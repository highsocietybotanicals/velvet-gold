import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkVivaOrderPaid, verifyVivaTransaction, type VivaPaymentCheck } from "../_shared/viva-api.ts";
import { confirmOrderPayment } from "../_shared/order-paid.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Appelée par la page /payment-success au retour de Viva (jusqu'à 6 fois, toutes les 3 s).
// Le navigateur fournit le code de commande Viva (paramètre « s » de l'URL de retour ou
// mémoire locale) et, si possible, l'id de commande et la transaction (« t »).
// La commande n'est marquée payée qu'après confirmation par l'API Viva.
//
// Réponses (HTTP 200 sauf mention) : status = "paid" | "already_paid" | "pending" | "not_payable",
// 404 status = "not_found", 400 status = "invalid" | "mismatch".

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ORDER_CODE_RE = /^\d{6,24}$/;
const TRANSACTION_ID_RE = /^[0-9a-f-]{32,36}$/i;

// Limiteur simple par IP (remis à zéro au redémarrage) : la page interroge 6 fois au plus.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;
const ipRequests = new Map<string, { count: number; resetAt: number }>();
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = ipRequests.get(ip);
  if (!entry || now > entry.resetAt) {
    ipRequests.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of ipRequests) if (now > entry.resetAt) ipRequests.delete(ip);
}, RATE_LIMIT_WINDOW_MS);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(clientIp)) {
    return json({ error: "Too many requests", status: "pending" }, 429);
  }

  try {
    let payload: any;
    try {
      payload = await req.json();
    } catch {
      return json({ error: "Missing parameters", status: "invalid" }, 400);
    }

    const vivaOrderCode = payload?.vivaOrderCode != null ? String(payload.vivaOrderCode).trim() : "";
    const orderId = typeof payload?.orderId === "string" ? payload.orderId.trim() : "";
    const transactionId = typeof payload?.transactionId === "string" ? payload.transactionId.trim() : "";

    if (!ORDER_CODE_RE.test(vivaOrderCode)) {
      return json({ error: "Missing parameters", status: "invalid" }, 400);
    }
    if (orderId && !UUID_RE.test(orderId)) {
      return json({ error: "Invalid order ID", status: "invalid" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Commande : par id (mémoire du navigateur) ou, à défaut, par code Viva (URL de retour,
    // utile quand la banque rouvre la page dans un autre navigateur).
    const columns = "id, total_amount, payment_status, viva_order_code, display_order_number";
    let order: any = null;
    if (orderId) {
      const { data, error } = await supabase.from("orders").select(columns).eq("id", orderId).maybeSingle();
      if (error) {
        console.error("verify-payment : lecture commande impossible", error.message);
        return json({ success: false, status: "pending" });
      }
      order = data;
    } else {
      const { data, error } = await supabase
        .from("orders")
        .select(columns)
        .eq("viva_order_code", vivaOrderCode)
        .order("created_at", { ascending: false })
        .limit(1);
      if (error) {
        console.error("verify-payment : lecture commande impossible", error.message);
        return json({ success: false, status: "pending" });
      }
      order = data?.[0] ?? null;
    }

    if (!order) {
      console.error("verify-payment : commande introuvable", orderId || `code Viva ${vivaOrderCode}`);
      return json({ error: "Order not found", status: "not_found" }, 404);
    }

    const orderNumber = order.display_order_number ?? null;

    // Security: verify the viva_order_code matches
    if (order.viva_order_code !== vivaOrderCode) {
      console.error("verify-payment : code Viva différent", order.viva_order_code, "vs", vivaOrderCode);
      return json({ error: "Order code mismatch", status: "mismatch" }, 400);
    }

    // Already paid? Return success immediately (idempotent)
    if (order.payment_status === "paid") {
      return json({ success: true, status: "already_paid", orderNumber });
    }
    if (order.payment_status !== "unpaid") {
      console.warn(`verify-payment : ${orderNumber ?? order.id} a le statut de paiement « ${order.payment_status} »`);
      return json({ success: false, status: "not_payable", orderNumber });
    }

    // Vérification auprès de Viva : la transaction indiquée au retour si on l'a, sinon la commande Viva.
    const ref = {
      orderId: order.id,
      orderCode: vivaOrderCode,
      expectedCents: Math.round(Number(order.total_amount) * 100),
    };
    let check: VivaPaymentCheck = { paid: false, reachable: false, detail: "pas d'identifiant de transaction" };
    if (TRANSACTION_ID_RE.test(transactionId)) {
      check = await verifyVivaTransaction(transactionId, ref);
    }
    if (!check.paid) {
      const byOrder = await checkVivaOrderPaid(ref);
      check = { ...byOrder, reachable: byOrder.reachable || check.reachable, detail: `${check.detail} | ${byOrder.detail}` };
    }

    if (!check.paid) {
      console.log(`verify-payment : ${orderNumber ?? order.id} pas encore confirmé par Viva — ${check.detail}`);
      return json({ success: false, status: "pending", orderNumber });
    }

    const result = await confirmOrderPayment(supabase, order.id, "verify-payment", { background: true });
    if (result.outcome === "marked_paid") {
      return json({ success: true, status: "paid", orderNumber });
    }
    if (result.outcome === "already_paid") {
      return json({ success: true, status: "already_paid", orderNumber });
    }
    if (result.outcome === "not_payable") {
      return json({ success: false, status: "not_payable", orderNumber });
    }
    // Erreur d'écriture : la page affichera « en cours de confirmation » ; la vérification
    // planifiée (reconcile-viva-payments) marquera la commande payée au passage suivant.
    console.error(`verify-payment : paiement confirmé par Viva mais enregistrement impossible pour ${orderNumber ?? order.id}`, result.detail);
    return json({ success: false, status: "pending", orderNumber });
  } catch (error) {
    console.error("Verify payment error:", error);
    return json({ error: "Internal error", status: "pending" }, 500);
  }
});
