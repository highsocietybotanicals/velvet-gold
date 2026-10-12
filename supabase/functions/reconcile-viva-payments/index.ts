import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkVivaOrderPaid } from "../_shared/viva-api.ts";
import { confirmOrderPayment } from "../_shared/order-paid.ts";
import {
  ADMIN_ORDER_EVENTS,
  ADMIN_ORDER_TEMPLATE,
  notifyAdminsOfOrder,
  type AdminOrderEvent,
} from "../_shared/admin-order-notify.ts";
import { isPrivilegedRequest } from "../_shared/request-auth.ts";

// Filet de sécurité des paiements et des notifications, appelé toutes les 10 minutes par une
// tâche cron (et à la main si besoin) :
//  1. commandes en ligne non payées de moins de 8 jours avec un code Viva → si Viva confirme le
//     paiement, même chemin que le webhook (payée + en préparation, e-mail client,
//     kilométrage, notification admin), sans jamais rien envoyer deux fois. Les commandes de
//     moins de 2 h sont vérifiées à chaque passage, les plus anciennes une fois par heure ;
//  2. commandes créées sans paiement en ligne (main propre, virement, pro) depuis moins de 2 h
//     → notification admin « nouvelle commande » si elle n'a pas déjà été envoyée ;
//  3. notifications admin en échec depuis moins de 24 h → nouvel essai (3 au plus).
//
// GET → {"version": "..."} (contrôle après publication, sans authentification).
// POST → tâche cron (en-tête x-cron-secret, secret créé dans le coffre de la base et vérifié par
// la fonction SQL check_reconcile_cron_secret), ou clé service role / admin connectée (passage
// complet). La clé publique du site n'est PAS acceptée : elle figure dans le code du site.

const VERSION = "reconcile-viva-payments 2026-10-12.2";
// Doit rester supérieur au délai de suppression des paniers abandonnés (7 jours, voir
// cleanup-abandoned-orders.sql) : une commande est vérifiée jusqu'à sa suppression.
const PAYMENT_LOOKBACK_DAYS = 8;
const RECENT_ORDER_HOURS = 2;
const MAX_ORDERS_PER_RUN = 60;
const NEW_ORDER_WINDOW_MIN = 120;
const NEW_ORDER_GRACE_MIN = 1; // laisse le temps aux lignes de commande d'être enregistrées
const RETRY_WINDOW_HOURS = 24;
// Budget de temps (limite d'exécution des fonctions edge ≈ 150 s) : au-delà, la suite attend le passage suivant.
const PAYMENT_BUDGET_MS = 90_000;
const TOTAL_BUDGET_MS = 120_000;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

let running = false;

interface Summary {
  version: string;
  startedAt: string;
  mode: "complet" | "récentes seulement";
  durationMs?: number;
  payments: {
    checked: number;
    markedPaid: string[];
    alreadyPaid: number;
    stillPending: number;
    vivaUnreachable: number;
    paidOnCancelled: string[];
  };
  notifications: { newOrdersChecked: number; newOrdersNotified: string[]; retried: number };
  stoppedEarly?: string;
  errors: string[];
}

async function reconcile(supabase: any, opts: { full: boolean }): Promise<Summary> {
  const started = Date.now();
  // Commandes de plus de 2 h : vérifiées au passage de chaque heure pile (minutes 0 à 9), ou
  // à chaque appel manuel ; les plus récentes à chaque passage.
  const checkOlder = opts.full || new Date(started).getUTCMinutes() < 10;
  const summary: Summary = {
    version: VERSION,
    startedAt: new Date(started).toISOString(),
    mode: checkOlder ? "complet" : "récentes seulement",
    payments: { checked: 0, markedPaid: [], alreadyPaid: 0, stillPending: 0, vivaUnreachable: 0, paidOnCancelled: [] },
    notifications: { newOrdersChecked: 0, newOrdersNotified: [], retried: 0 },
    errors: [],
  };
  const elapsed = () => Date.now() - started;

  // ---------- 1. Paiements en ligne non enregistrés ----------
  const lookbackMs = checkOlder ? PAYMENT_LOOKBACK_DAYS * 24 * 3600 * 1000 : RECENT_ORDER_HOURS * 3600 * 1000;
  const since = new Date(started - lookbackMs).toISOString();
  const { data: unpaid, error: unpaidError } = await supabase
    .from("orders")
    .select("id, display_order_number, total_amount, viva_order_code")
    .eq("payment_method", "online")
    .eq("payment_status", "unpaid")
    .not("viva_order_code", "is", null)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(MAX_ORDERS_PER_RUN);

  if (unpaidError) {
    console.error("reconcile : lecture des commandes impossible", unpaidError.message);
    summary.errors.push(`lecture commandes : ${unpaidError.message}`);
  }

  for (const order of unpaid ?? []) {
    if (elapsed() > PAYMENT_BUDGET_MS) {
      summary.stoppedEarly = "budget de temps atteint pendant la vérification des paiements";
      console.warn(`reconcile : ${summary.stoppedEarly} (${summary.payments.checked} vérifiées)`);
      break;
    }
    const label = order.display_order_number || order.id;
    summary.payments.checked++;
    try {
      const check = await checkVivaOrderPaid({
        orderId: order.id,
        orderCode: String(order.viva_order_code),
        expectedCents: Math.round(Number(order.total_amount) * 100),
      });
      if (!check.paid) {
        if (check.reachable) summary.payments.stillPending++;
        else {
          summary.payments.vivaUnreachable++;
          console.error(`reconcile : Viva injoignable pour ${label} — ${check.detail}`);
        }
        continue;
      }
      const result = await confirmOrderPayment(supabase, order.id, "reconcile", { background: false });
      if (result.outcome === "marked_paid") {
        summary.payments.markedPaid.push(label);
        console.log(`reconcile : paiement rattrapé pour ${label} (${check.detail})`);
      } else if (result.outcome === "already_paid") {
        summary.payments.alreadyPaid++;
      } else if (result.paidOnCancelled) {
        // Commande annulée payée chez Viva : alerte admin envoyée une fois (journal), rien d'autre.
        summary.payments.paidOnCancelled.push(label);
      } else {
        summary.errors.push(`${label} : ${result.outcome} ${result.detail ?? ""}`.trim());
      }
    } catch (e) {
      console.error(`reconcile : erreur sur ${label}`, e);
      summary.errors.push(`${label} : ${String(e)}`);
    }
  }

  // ---------- 2. Nouvelles commandes hors paiement en ligne ----------
  const handled = new Set<string>();
  const newSince = new Date(started - NEW_ORDER_WINDOW_MIN * 60_000).toISOString();
  const graceUntil = new Date(started - NEW_ORDER_GRACE_MIN * 60_000).toISOString();
  const { data: fresh, error: freshError } = await supabase
    .from("orders")
    .select("id, display_order_number")
    .neq("payment_method", "online")
    .gte("created_at", newSince)
    .lte("created_at", graceUntil)
    .order("created_at", { ascending: true })
    .limit(MAX_ORDERS_PER_RUN);
  if (freshError) {
    console.error("reconcile : lecture des nouvelles commandes impossible", freshError.message);
    summary.errors.push(`nouvelles commandes : ${freshError.message}`);
  }
  for (const order of fresh ?? []) {
    if (elapsed() > TOTAL_BUDGET_MS) {
      summary.stoppedEarly ??= "budget de temps atteint pendant les notifications";
      break;
    }
    summary.notifications.newOrdersChecked++;
    handled.add(`${order.id}:new`);
    const r = await notifyAdminsOfOrder(supabase, order.id, "new", { telegram: true, source: "reconcile" });
    if (r.sent > 0) summary.notifications.newOrdersNotified.push(order.display_order_number || order.id);
  }

  // ---------- 3. Notifications admin en échec : nouvel essai ----------
  const retrySince = new Date(started - RETRY_WINDOW_HOURS * 3600 * 1000).toISOString();
  const { data: failedLogs, error: failedError } = await supabase
    .from("email_send_log")
    .select("metadata")
    .eq("template_name", ADMIN_ORDER_TEMPLATE)
    .eq("status", "failed")
    .gte("created_at", retrySince)
    .limit(200);
  if (failedError) {
    console.error("reconcile : lecture du journal des e-mails impossible", failedError.message);
    summary.errors.push(`journal e-mails : ${failedError.message}`);
  }
  for (const row of failedLogs ?? []) {
    if (elapsed() > TOTAL_BUDGET_MS) {
      summary.stoppedEarly ??= "budget de temps atteint pendant les nouveaux essais";
      break;
    }
    const orderId = row?.metadata?.order_id;
    const eventType = row?.metadata?.event_type as AdminOrderEvent | undefined;
    if (typeof orderId !== "string" || !eventType || !ADMIN_ORDER_EVENTS.includes(eventType)) continue;
    const key = `${orderId}:${eventType}`;
    if (handled.has(key)) continue;
    handled.add(key);
    const r = await notifyAdminsOfOrder(supabase, orderId, eventType, { telegram: false, source: "reconcile-retry" });
    if (r.sent > 0) summary.notifications.retried++;
  }

  summary.durationMs = Date.now() - started;
  console.log("reconcile : bilan", JSON.stringify(summary));
  return summary;
}

/**
 * Secret de la tâche cron (en-tête x-cron-secret). Il est créé et conservé dans le coffre de la
 * base (vault) ; seule la fonction SQL check_reconcile_cron_secret, réservée au rôle service, le
 * compare. Aucun secret dans le code ni dans les variables d'environnement.
 */
async function hasValidCronSecret(req: Request, supabase: any): Promise<boolean> {
  const candidate = req.headers.get("x-cron-secret")?.trim() ?? "";
  if (candidate.length < 32 || candidate.length > 256) return false;
  try {
    const { data, error } = await supabase.rpc("check_reconcile_cron_secret", { candidate });
    if (error) {
      console.error("reconcile : vérification du secret de la tâche cron impossible", error.message);
      return false;
    }
    return data === true;
  } catch (e) {
    console.error("reconcile : vérification du secret de la tâche cron impossible", e);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method === "GET") return json({ version: VERSION });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const fromCron = await hasValidCronSecret(req, supabase);
    const privileged = fromCron ? false : await isPrivilegedRequest(req, supabase);
    if (!fromCron && !privileged) {
      console.warn("reconcile : appel refusé (ni secret de la tâche cron, ni clé serveur, ni compte admin)");
      return json({ error: "Forbidden" }, 403);
    }

    if (running) return json({ version: VERSION, skipped: "passage déjà en cours" });
    running = true;
    try {
      const summary = await reconcile(supabase, { full: privileged });
      return json(summary);
    } finally {
      running = false;
    }
  } catch (error) {
    console.error("reconcile-viva-payments error:", error);
    return json({ version: VERSION, error: "Internal error" }, 500);
  }
});
