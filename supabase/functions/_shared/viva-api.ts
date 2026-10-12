// Lecture de l'API Viva (identifiants marchands VIVA_MERCHANT_ID / VIVA_API_KEY, Basic auth).
// Seule source de vérité pour décider qu'une commande est payée : on relit toujours
// la transaction ou la commande chez Viva, jamais le contenu d'un appel entrant.
//
// Les réponses Viva diffèrent selon l'endpoint (clés « Amount » ou « amount »,
// montants en euros ou en centimes, transaction seule ou liste « Transactions ») :
// tout est normalisé ici.

const VIVA_BASE_URL = "https://www.vivapayments.com";
const VIVA_TIMEOUT_MS = 10_000;

export interface VivaPaymentRef {
  orderId: string; // id de la commande HSB (envoyé à Viva comme MerchantTrns)
  orderCode: string | null; // code de commande Viva (orders.viva_order_code)
  expectedCents: number; // total attendu en centimes
}

export interface VivaPaymentCheck {
  paid: boolean;
  /** true si Viva a répondu au moins une fois (sinon : réseau, panne ou identifiants absents) */
  reachable: boolean;
  /** explication courte pour le journal (jamais renvoyée au navigateur) */
  detail: string;
  transactionId?: string;
}

interface VivaGetResult {
  ok: boolean;
  status: number;
  data: any;
  error?: string;
}

function vivaAuthHeader(): string | null {
  const merchantId = Deno.env.get("VIVA_MERCHANT_ID");
  const apiKey = Deno.env.get("VIVA_API_KEY");
  if (!merchantId || !apiKey) return null;
  return `Basic ${btoa(`${merchantId}:${apiKey}`)}`;
}

/**
 * JSON.parse qui garde intacts les grands entiers (codes de commande Viva à 16 chiffres
 * et plus, au-delà de la précision des nombres JavaScript) en les transformant en chaînes.
 */
export function parseVivaJson(text: string): any {
  const safe = text.replace(/("[A-Za-z0-9_]+"\s*:\s*)(-?\d{16,})(?=\s*[,}\]])/g, '$1"$2"');
  return JSON.parse(safe);
}

async function vivaGet(path: string): Promise<VivaGetResult> {
  const auth = vivaAuthHeader();
  if (!auth) return { ok: false, status: 0, data: null, error: "identifiants Viva absents" };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), VIVA_TIMEOUT_MS);
  try {
    const res = await fetch(`${VIVA_BASE_URL}${path}`, {
      headers: { Authorization: auth, Accept: "application/json" },
      signal: controller.signal,
    });
    const text = await res.text();
    let data: any = null;
    if (text) {
      try {
        data = parseVivaJson(text);
      } catch {
        data = null;
      }
    }
    return { ok: res.ok, status: res.status, data };
  } catch (e) {
    return { ok: false, status: 0, data: null, error: String(e) };
  } finally {
    clearTimeout(timer);
  }
}

function pick(obj: any, ...keys: string[]): any {
  if (!obj || typeof obj !== "object") return undefined;
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return undefined;
}

function extractTransactions(data: any): any[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  const list = pick(data, "Transactions", "transactions");
  if (Array.isArray(list)) return list;
  if (pick(data, "TransactionId", "transactionId", "StatusId", "statusId") !== undefined) return [data];
  return [];
}

/**
 * Montant d'une transaction Viva (API « legacy » /api/transactions et événements webhook :
 * toujours en EUROS, ex. 35.00) égal au total attendu, à 1 centime près.
 * Pas de lecture « en centimes » : elle ferait accepter 0,35 € pour une commande de 35,00 €.
 */
export function amountMatchesCents(amount: unknown, expectedCents: number): boolean {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0 || !Number.isFinite(expectedCents) || expectedCents <= 0) return false;
  return Math.abs(Math.round(n * 100) - expectedCents) <= 1;
}

function summarizeTransaction(tx: any) {
  const status = String(pick(tx, "StatusId", "statusId") ?? "").toUpperCase();
  const merchantTrns = pick(tx, "MerchantTrns", "merchantTrns");
  const orderCode =
    pick(tx, "OrderCode", "orderCode") ?? pick(pick(tx, "Order", "order"), "OrderCode", "orderCode");
  const transactionId = pick(tx, "TransactionId", "transactionId");
  return {
    status,
    merchantTrns: merchantTrns != null ? String(merchantTrns).trim() : null,
    orderCode: orderCode != null ? String(orderCode) : null,
    transactionId: transactionId != null ? String(transactionId) : null,
    amount: pick(tx, "Amount", "amount"),
  };
}

/** Transaction Viva finalisée (StatusId F), rattachée à la commande et au bon montant ? */
function isCompletedPaymentFor(tx: any, ref: VivaPaymentRef): { ok: boolean; why: string } {
  const s = summarizeTransaction(tx);
  if (s.status !== "F") return { ok: false, why: `statut ${s.status || "?"}` };
  const linked =
    (!!s.merchantTrns && s.merchantTrns.toLowerCase() === ref.orderId.toLowerCase()) ||
    (!!s.orderCode && !!ref.orderCode && s.orderCode === String(ref.orderCode));
  if (!linked) return { ok: false, why: "transaction d'une autre commande" };
  if (!amountMatchesCents(s.amount, ref.expectedCents)) {
    if (Math.abs(Math.round(Number(s.amount)) - ref.expectedCents) <= 1) {
      // Diagnostic : montant qui correspondrait s'il était exprimé en centimes. Non accepté ;
      // la commande sera confirmée par l'état de la commande Viva (StateId 3) si elle est payée.
      console.warn(`Viva : montant de transaction ${s.amount} lu en euros ≠ ${ref.expectedCents} centimes (format à vérifier)`);
    }
    return { ok: false, why: `montant ${s.amount} € ≠ ${ref.expectedCents} centimes` };
  }
  return { ok: true, why: "ok" };
}

/** Vérifie une transaction précise (identifiant reçu du webhook ou de l'URL de retour Viva). */
export async function verifyVivaTransaction(
  transactionId: string,
  ref: VivaPaymentRef,
): Promise<VivaPaymentCheck> {
  const r = await vivaGet(`/api/transactions/${encodeURIComponent(transactionId)}`);
  if (!r.ok) {
    return {
      paid: false,
      // 400 / 404 : Viva a répondu que cette transaction n'existe pas (faux événement, autre
      // compte) ; le reste (réseau, 5xx, identifiants refusés) est une indisponibilité.
      reachable: r.status === 400 || r.status === 404,
      detail: `transaction : HTTP ${r.status}${r.error ? ` (${r.error})` : ""}`,
    };
  }
  const txs = extractTransactions(r.data);
  const tx =
    txs.find((t) => (summarizeTransaction(t).transactionId ?? "").toLowerCase() === transactionId.toLowerCase()) ??
    txs[0];
  if (!tx) return { paid: false, reachable: true, detail: "transaction introuvable chez Viva" };
  const v = isCompletedPaymentFor(tx, ref);
  return {
    paid: v.ok,
    reachable: true,
    detail: v.ok ? "transaction finalisée" : `transaction : ${v.why}`,
    transactionId,
  };
}

/**
 * Vérifie par le code de commande Viva : d'abord l'état de la commande (StateId 3 = payée),
 * puis les transactions rattachées (StatusId F au bon montant).
 */
export async function checkVivaOrderPaid(ref: VivaPaymentRef): Promise<VivaPaymentCheck> {
  if (!ref.orderCode) return { paid: false, reachable: false, detail: "pas de code de commande Viva" };

  let reachable = false;
  const details: string[] = [];

  // 1) Commande Viva
  const o = await vivaGet(`/api/orders/${encodeURIComponent(ref.orderCode)}`);
  if (o.ok && o.data && typeof o.data === "object") {
    reachable = true;
    const state = Number(pick(o.data, "StateId", "stateId"));
    const merchantTrns = pick(o.data, "MerchantTrns", "merchantTrns");
    const requestAmount = pick(o.data, "RequestAmount", "requestAmount");
    const paymentAmount = pick(o.data, "PaymentAmount", "paymentAmount");
    details.push(`commande Viva : état ${Number.isFinite(state) ? state : "?"}`);

    if (merchantTrns != null && String(merchantTrns).trim() !== "" &&
        String(merchantTrns).trim().toLowerCase() !== ref.orderId.toLowerCase()) {
      // Le code Viva enregistré ne correspond pas à cette commande : on ne conclut rien.
      return { paid: false, reachable, detail: "code Viva rattaché à une autre commande" };
    }
    // RequestAmount est en centimes (montant envoyé à la création de la commande Viva).
    const requestOk = requestAmount == null || Number(requestAmount) >= ref.expectedCents - 1;
    if (state === 3 && requestOk) {
      return { paid: true, reachable, detail: "commande Viva payée (état 3)" };
    }
    if (paymentAmount != null && Number(paymentAmount) >= ref.expectedCents - 1) {
      return { paid: true, reachable, detail: "commande Viva : montant encaissé" };
    }
  } else {
    details.push(`commande Viva : HTTP ${o.status}${o.error ? ` (${o.error})` : ""}`);
  }

  // 2) Transactions rattachées au code de commande
  const t = await vivaGet(`/api/transactions?ordercode=${encodeURIComponent(ref.orderCode)}`);
  if (t.ok) {
    reachable = true;
    const txs = extractTransactions(t.data);
    for (const tx of txs) {
      const v = isCompletedPaymentFor(tx, ref);
      if (v.ok) {
        return {
          paid: true,
          reachable,
          detail: "transaction finalisée",
          transactionId: summarizeTransaction(tx).transactionId ?? undefined,
        };
      }
    }
    details.push(`${txs.length} transaction(s) sans paiement finalisé`);
  } else {
    details.push(`transactions : HTTP ${t.status}${t.error ? ` (${t.error})` : ""}`);
  }

  return { paid: false, reachable, detail: details.join(" ; ") };
}
