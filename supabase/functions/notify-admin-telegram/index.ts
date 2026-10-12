import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  deliveryLines,
  formatEuros,
  formatGrams,
  formatItemQuantity,
  loadAdminOrderContext,
} from "../_shared/admin-order-notify.ts";
import { isPrivilegedRequest } from "../_shared/request-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TELEGRAM_GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";
const ADMIN_ORDERS_URL = "https://highsocietybotanicals.com/admin/commandes";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// Markdown « historique » de Telegram : _ * ` [ doivent être échappés dans les textes libres
// (noms, adresses, produits, e-mails), sinon Telegram refuse le message.
const md = (s: unknown) => String(s ?? "").replace(/([_*`\[])/g, "\\$1");

async function sendTelegram(
  lovableKey: string,
  telegramKey: string,
  chatId: string,
  text: string,
  parseMode?: "Markdown",
): Promise<{ ok: boolean; status: number; body: string }> {
  const res = await fetch(`${TELEGRAM_GATEWAY_URL}/sendMessage`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": telegramKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      ...(parseMode ? { parse_mode: parseMode } : {}),
      disable_web_page_preview: true,
    }),
  });
  return { ok: res.ok, status: res.status, body: (await res.text()).slice(0, 500) };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (!(await isPrivilegedRequest(req, supabase))) {
      return json({ error: "Forbidden" }, 403);
    }

    let payload: any;
    try {
      payload = await req.json();
    } catch {
      return json({ error: "Corps de requête invalide" }, 400);
    }
    const orderId = payload?.orderId;
    const eventType = payload?.eventType;
    const userId = payload?.userId;
    const needsOrder = eventType !== "orphan_payment" && eventType !== "pro_application";
    if (needsOrder && !orderId) return json({ error: "orderId required" }, 400);
    if (eventType === "pro_application" && !userId) return json({ error: "userId required" }, 400);

    const chatId = Deno.env.get("TELEGRAM_ADMIN_CHAT_ID");
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const telegramKey = Deno.env.get("TELEGRAM_API_KEY");

    if (!chatId || !lovableKey || !telegramKey) {
      console.log("Telegram admin notify skipped: missing env (chat_id/api_keys)");
      return json({ skipped: true, reason: "missing config" });
    }

    // Nouveau dossier partenaire (espace pro) : à valider dans Admin > Pro
    if (eventType === "pro_application") {
      const { data: p } = await supabase
        .from("profiles")
        .select("company_name, full_name, email, phone, siret, vat_number, postal_code, city")
        .eq("id", userId)
        .single();
      if (!p) return json({ error: "Profile not found" }, 404);
      const text = [
        `🏪 *Nouveau dossier PRO à valider*`,
        ``,
        `*Société :* ${md(p.company_name || "—")}`,
        p.full_name ? `*Contact :* ${md(p.full_name)}` : "",
        p.email ? `*E-mail :* ${md(p.email)}` : "",
        p.phone ? `*Tél :* ${md(p.phone)}` : "",
        `*SIRET :* ${md(p.siret || "—")}`,
        `*TVA :* ${md(p.vat_number || "—")}`,
        p.city ? `*Ville :* ${md([p.postal_code, p.city].filter(Boolean).join(" "))}` : "",
        ``,
        `À valider : Admin > Pro`,
      ].filter(Boolean).join("\n");
      const sentPro = await sendTelegram(lovableKey, telegramKey, chatId, text, "Markdown");
      if (!sentPro.ok) {
        console.error("Telegram send failed:", sentPro.status, sentPro.body);
        return json({ error: "Telegram send failed" }, 502);
      }
      return json({ success: true });
    }

    // Paiement Viva dont la commande n'existe plus sur le site (détails complets par e-mail).
    if (eventType === "orphan_payment") {
      const o = payload?.orphan ?? {};
      const text = [
        `⚠️ PAIEMENT VIVA SANS COMMANDE — ${formatEuros(Number(o.amountCents) / 100)}`,
        "",
        `Cliente : ${String(o.customerName ?? "").trim() || "non communiqué"}`,
        `Code Viva : ${o.vivaOrderCode || "—"}`,
        `Transaction : ${o.transactionId || "—"}`,
        "",
        "La commande n'existe plus sur le site : contactez la cliente ou remboursez-la (détails par e-mail).",
      ].join("\n");
      const sentOrphan = await sendTelegram(lovableKey, telegramKey, chatId, text);
      if (!sentOrphan.ok) {
        console.error("Telegram send failed:", sentOrphan.status, sentOrphan.body);
        return json({ error: "Telegram send failed" }, 502);
      }
      return json({ success: true });
    }

    const ctx = await loadAdminOrderContext(supabase, String(orderId));
    if (!ctx) return json({ error: "Order not found" }, 404);
    const { order } = ctx;

    const isPaidEvent = eventType === "paid";
    const isPaidOnCancelled = eventType === "paid_cancelled";
    const isProEvent = eventType === "pro_order" || eventType === "pro_kit";
    const emoji = isPaidEvent ? "💰" : isPaidOnCancelled ? "⚠️" : isProEvent ? "🏪" : "🆕";
    const title = isPaidEvent
      ? "COMMANDE PAYÉE"
      : isPaidOnCancelled
        ? "PAIEMENT REÇU SUR UNE COMMANDE ANNULÉE — à rembourser ou à réactiver"
        : eventType === "pro_kit"
          ? "Kit découverte PRO commandé (virement attendu)"
          : eventType === "pro_order"
            ? "Nouvelle commande PRO (virement attendu)"
            : `Nouvelle commande${order.order_channel === "pro" ? " pro" : ""} — ${order.payment_status === "paid" ? "déjà encaissée" : "à encaisser"}`;

    const items = ctx.items.filter((i: any) => i.product_type !== "gift" && i.product_type !== "sample");
    const extras = ctx.items.filter((i: any) => i.product_type === "gift" || i.product_type === "sample");
    const delivery = deliveryLines(order);
    const weight = Number(order.total_flower_weight) > 0 ? `  (${formatGrams(order.total_flower_weight)})` : "";

    const build = (markdown: boolean) => {
      const b = (s: string) => (markdown ? `*${s}*` : s);
      const t = (s: unknown) => (markdown ? md(s) : String(s ?? ""));
      const lines: (string | null)[] = [
        `${emoji} ${b(t(title))} — ${t(ctx.orderNumber)}`,
        "",
        `${b("Total :")} ${t(formatEuros(order.total_amount))}${t(weight)}`,
        `${b("Client :")} ${t(ctx.clientName)}`,
        ctx.clientPhone ? `${b("Tél :")} ${t(ctx.clientPhone)}` : null,
        `${b("Livraison :")} ${t(delivery[0])}`,
        ...delivery.slice(1).map((l) => `  ${t(l)}`),
        "",
        b("Articles :"),
        ...(items.length ? items.map((i: any) => `  • ${t(i.product_name)} — ${t(formatItemQuantity(i))}`) : ["—"]),
        ...(extras.length ? [b("Offerts :"), ...extras.map((i: any) => `  • ${t(i.product_name)}`)] : []),
        "",
        t(ADMIN_ORDERS_URL),
      ];
      return lines.filter((line): line is string => line !== null).join("\n");
    };

    let sent = await sendTelegram(lovableKey, telegramKey, chatId, build(true), "Markdown");
    if (!sent.ok && sent.status === 400) {
      // Mise en forme refusée par Telegram : on renvoie le même message en texte brut.
      console.warn("Telegram : Markdown refusé, envoi en texte brut", sent.body);
      sent = await sendTelegram(lovableKey, telegramKey, chatId, build(false));
    }

    if (!sent.ok) {
      console.error("Telegram send failed:", sent.status, sent.body);
      return json({ error: "Telegram send failed" }, 502);
    }

    return json({ success: true });
  } catch (e) {
    console.error("notify-admin-telegram error:", e);
    return json({ error: String(e) }, 500);
  }
});
