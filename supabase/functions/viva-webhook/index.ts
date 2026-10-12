import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkVivaOrderPaid, parseVivaJson, verifyVivaTransaction, type VivaPaymentCheck } from "../_shared/viva-api.ts";
import { confirmOrderPayment, runAfterResponse } from "../_shared/order-paid.ts";
import { notifyAdminsOfOrphanPayment } from "../_shared/admin-order-notify.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Plus de liste d'adresses IP Viva : quand Viva change d'adresse, les paiements étaient refusés
// (403) et jamais enregistrés. La sécurité repose sur la relecture de chaque paiement auprès
// de l'API Viva avec les identifiants marchands (transaction finalisée « F », rattachée à la
// commande, au bon montant). L'IP est seulement journalisée.

// Simple in-memory rate limiter per IP (resets on cold start)
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 20; // max 20 requests per IP per minute
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
  for (const [ip, entry] of ipRequests) {
    if (now > entry.resetAt) ipRequests.delete(ip);
  }
}, RATE_LIMIT_WINDOW_MS);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ORDER_CODE_RE = /^\d{6,24}$/;
const TRANSACTION_ID_RE = /^[0-9a-f-]{32,36}$/i;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limit by IP
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(clientIp)) {
    console.warn("Webhook Viva : trop de requêtes depuis", clientIp);
    return json({ error: "Too many requests" }, 429);
  }

  // Must return the verification key from Viva's API
  if (req.method === "GET") {
    try {
      const merchantId = Deno.env.get("VIVA_MERCHANT_ID");
      const apiKey = Deno.env.get("VIVA_API_KEY");
      const credentials = btoa(`${merchantId}:${apiKey}`);

      // Try production first
      let tokenResponse = await fetch(
        "https://www.vivapayments.com/api/messages/config/token",
        { headers: { Authorization: `Basic ${credentials}` } }
      );

      // Fallback to demo if production fails
      if (!tokenResponse.ok) {
        console.log("Production token fetch failed, trying demo...");
        tokenResponse = await fetch(
          "https://demo.vivapayments.com/api/messages/config/token",
          { headers: { Authorization: `Basic ${credentials}` } }
        );
      }

      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.text();
        console.log("Viva verification token retrieved successfully (IP", clientIp, ")");
        return new Response(tokenData, {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Fallback: use stored verification key if API call fails
      const verificationKey = Deno.env.get("VIVA_WEBHOOK_VERIFICATION_KEY");
      if (verificationKey) {
        console.log("Using stored verification key as fallback");
        return json({ Key: verificationKey });
      }

      console.error("Failed to get verification token from Viva:", tokenResponse.status);
      return json({ error: "Verification token unavailable" }, 500);
    } catch (err) {
      console.error("Verification error:", err);
      return json({ error: "Verification failed" }, 500);
    }
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    // Lecture en texte : les codes de commande Viva (16 chiffres) dépassent la précision
    // des nombres JavaScript, parseVivaJson les garde intacts.
    let body: any;
    try {
      body = parseVivaJson(await req.text());
    } catch {
      console.warn("Webhook Viva : corps illisible (IP", clientIp, ")");
      return json({ error: "Bad request" }, 400);
    }

    const eventTypeId = Number(body?.EventTypeId);
    const eventData = body?.EventData ?? {};
    const merchantTrns = typeof eventData.MerchantTrns === "string" ? eventData.MerchantTrns.trim() : "";
    const orderCode = eventData.OrderCode != null ? String(eventData.OrderCode).trim() : "";
    const transactionId = typeof eventData.TransactionId === "string" ? eventData.TransactionId.trim() : "";

    // Journal sans données personnelles (ni e-mail, ni nom, ni carte)
    console.log(
      `Webhook Viva reçu : événement ${eventTypeId || "?"}, IP ${clientIp}, transaction ${transactionId || "?"}, commande Viva ${orderCode || "?"}, référence ${merchantTrns || "?"}, statut ${eventData.StatusId ?? "?"}`,
    );

    // 1797 = paiement refusé / échoué : journalisé, aucune action (la commande reste « à payer »)
    if (eventTypeId === 1797) {
      console.log(`Webhook Viva : paiement échoué pour la référence ${merchantTrns || orderCode || "?"} — aucune action`);
      return json({ success: true, ignored: "payment_failed_event" });
    }

    // EventTypeId 1796 = Transaction Payment Created (successful payment)
    if (eventTypeId !== 1796) {
      return json({ success: true, ignored: "event_type" });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Retrouver la commande : MerchantTrns = id de la commande HSB, sinon code de commande Viva.
    const columns = "id, total_amount, payment_status, viva_order_code, display_order_number";
    let order: any = null;
    if (UUID_RE.test(merchantTrns)) {
      const { data, error } = await supabase.from("orders").select(columns).eq("id", merchantTrns).maybeSingle();
      if (error) {
        console.error("Webhook Viva : lecture commande impossible", error.message);
        return json({ error: "Internal error" }, 500); // Viva renverra l'événement
      }
      order = data;
    }
    if (!order && ORDER_CODE_RE.test(orderCode)) {
      const { data, error } = await supabase
        .from("orders")
        .select(columns)
        .eq("viva_order_code", orderCode)
        .order("created_at", { ascending: false })
        .limit(1);
      if (error) {
        console.error("Webhook Viva : lecture commande impossible", error.message);
        return json({ error: "Internal error" }, 500);
      }
      order = data?.[0] ?? null;
    }

    if (!order) {
      // Référence = id d'une commande du site, mais la commande n'existe plus (supprimée comme
      // panier abandonné avant l'arrivée du paiement) : après confirmation par Viva, on prévient
      // la gérante pour que le paiement ne soit pas perdu.
      const claimedCents = Math.round(Number(eventData.Amount) * 100);
      if (UUID_RE.test(merchantTrns) && TRANSACTION_ID_RE.test(transactionId) && claimedCents > 0) {
        const orphanCheck = await verifyVivaTransaction(transactionId, {
          orderId: merchantTrns,
          orderCode: ORDER_CODE_RE.test(orderCode) ? orderCode : null,
          expectedCents: claimedCents,
        });
        if (orphanCheck.paid) {
          console.error(
            `Webhook Viva : PAIEMENT SANS COMMANDE — référence ${merchantTrns}, commande Viva ${orderCode || "?"}, ${claimedCents / 100} € — alerte admin`,
          );
          await runAfterResponse(
            notifyAdminsOfOrphanPayment(supabase, {
              reference: merchantTrns,
              vivaOrderCode: ORDER_CODE_RE.test(orderCode) ? orderCode : null,
              transactionId,
              amountCents: claimedCents,
              customerEmail: typeof eventData.Email === "string" ? eventData.Email.slice(0, 255) : null,
              customerName: typeof eventData.FullName === "string" ? eventData.FullName.slice(0, 200) : null,
            }),
            `Webhook Viva : alerte paiement sans commande ${transactionId}`,
          );
          return json({ success: true, status: "orphan_payment" });
        }
        if (!orphanCheck.reachable) {
          console.error(`Webhook Viva : commande ${merchantTrns} introuvable et Viva injoignable — ${orphanCheck.detail}`);
          return json({ error: "Verification unavailable" }, 503); // Viva renverra l'événement
        }
      }
      // Paiement sans commande du site (terminal, lien de paiement…) : rien à faire.
      console.log("Webhook Viva : aucune commande du site pour cet événement — ignoré");
      return json({ success: true, ignored: "order_not_found" });
    }

    const orderLabel = order.display_order_number || order.id;

    // Idempotence : déjà payée → 200 sans rien renvoyer
    if (order.payment_status === "paid") {
      console.log(`Webhook Viva : ${orderLabel} déjà payée — aucune action`);
      return json({ success: true, status: "already_paid" });
    }
    if (order.payment_status !== "unpaid") {
      console.warn(`Webhook Viva : ${orderLabel} a le statut de paiement « ${order.payment_status} » — aucune action`);
      return json({ success: true, ignored: "payment_status" });
    }

    // Vérification auprès de l'API Viva (identifiants marchands) — la vraie sécurité.
    const ref = {
      orderId: order.id,
      orderCode: order.viva_order_code ?? (ORDER_CODE_RE.test(orderCode) ? orderCode : null),
      expectedCents: Math.round(Number(order.total_amount) * 100),
    };
    let check: VivaPaymentCheck = { paid: false, reachable: false, detail: "pas d'identifiant de transaction" };
    if (TRANSACTION_ID_RE.test(transactionId)) {
      check = await verifyVivaTransaction(transactionId, ref);
    }
    if (!check.paid && ref.orderCode) {
      const byOrder = await checkVivaOrderPaid(ref);
      check = {
        ...byOrder,
        reachable: byOrder.reachable || check.reachable,
        detail: `${check.detail} | ${byOrder.detail}`,
      };
    }

    if (!check.paid) {
      if (!check.reachable) {
        // Viva injoignable : erreur temporaire, Viva renverra l'événement (et la vérification
        // planifiée reconcile-viva-payments rattrapera le paiement).
        console.error(`Webhook Viva : vérification impossible pour ${orderLabel} — ${check.detail}`);
        return json({ error: "Verification unavailable" }, 503);
      }
      console.error(`Webhook Viva : paiement NON confirmé par l'API Viva pour ${orderLabel} — ${check.detail}`);
      return json({ error: "Bad request" }, 400);
    }

    const result = await confirmOrderPayment(supabase, order.id, "viva-webhook", { background: true });
    if (result.outcome === "error") {
      // 500 → Viva renverra l'événement ; la vérification planifiée rattrapera aussi.
      return json({ error: "Internal error" }, 500);
    }
    console.log(`Webhook Viva : ${orderLabel} → ${result.outcome} (${check.detail})`);
    return json({ success: true, status: result.outcome });
  } catch (error) {
    console.error("Webhook error:", error);
    return json({ error: "Internal error" }, 500);
  }
});
