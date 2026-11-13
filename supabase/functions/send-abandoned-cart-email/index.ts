import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { sendRawEmail } from "../_shared/transactional-email-templates/send-raw-email.ts";

// Rappel de panier : un client a lancé un paiement par carte et ne l'a pas terminé.
//  - 1er rappel entre 2 h et 4 h après, 2e rappel entre 24 h et 48 h après ;
//  - seulement les commandes par carte, en attente, non payées, hors espace pro
//    (jamais une commande en main propre, par virement ou d'un professionnel) ;
//  - rien si le client a payé une autre commande entre-temps ;
//  - simple rappel, sans code promo.
//
// GET  → {"version": "..."} (contrôle après publication, sans authentification).
// POST → tâche cron (en-tête x-cron-secret, vérifié par la fonction SQL
//        check_reconcile_cron_secret : le secret reste dans le coffre de la base),
//        ou clé service role. La clé publique du site n'est PAS acceptée.

const VERSION = "send-abandoned-cart-email 2026-11-13.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const SITE_URL = "https://highsocietybotanicals.com";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const euros = (n: number) => `${n.toFixed(2).replace(".", ",")} €`;

function buildEmail(opts: {
  firstName?: string | null;
  orderNumber: string;
  totalAmount: number;
  stage: "2h" | "24h";
}): { subject: string; html: string; text: string } {
  const { firstName, orderNumber, totalAmount, stage } = opts;
  const greeting = firstName ? `Bonjour ${firstName},` : `Bonjour,`;
  const resumeUrl = `${SITE_URL}/catalogue`;

  const headline = stage === "2h"
    ? "Votre panier vous attend"
    : "Votre sélection vous attend toujours";

  const intro = stage === "2h"
    ? "Votre paiement n'a pas été terminé. Votre sélection est toujours disponible : vous pouvez reprendre votre commande quand vous le souhaitez."
    : "Votre commande n'a pas été finalisée. Si vous le souhaitez, vous pouvez la reprendre en quelques instants. Bon à savoir : la livraison est offerte dès 10 g.";

  const subject = stage === "2h"
    ? "Votre panier vous attend - High Society Botanicals"
    : "Votre sélection vous attend toujours - High Society Botanicals";

  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#111111;border:1px solid #2a2a2a;border-radius:12px;overflow:hidden;">
<tr><td style="height:4px;background:linear-gradient(90deg,#c5a55a,#d4af37,#c5a55a);"></td></tr>
<tr><td style="padding:40px 30px;text-align:center;">
<h1 style="color:#d4af37;font-size:26px;margin:0 0 16px;font-family:Georgia,serif;">${headline}</h1>
<p style="color:#c0b89a;font-size:15px;margin:0 0 8px;">${escapeHtml(greeting)}</p>
<p style="color:#c0b89a;font-size:15px;line-height:1.6;margin:0 0 24px;">${intro}</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
<tr><td style="background-color:#1a1a1a;border:1px solid #2a2a2a;border-radius:8px;padding:16px;text-align:left;">
<p style="color:#888;font-size:12px;margin:0 0 4px;text-transform:uppercase;letter-spacing:1px;">Commande</p>
<p style="color:#d4af37;font-size:16px;margin:0 0 6px;font-weight:bold;">${escapeHtml(orderNumber)}</p>
<p style="color:#c0b89a;font-size:14px;margin:0;">Total : ${euros(totalAmount)}</p>
</td></tr>
</table>
<a href="${resumeUrl}" style="display:inline-block;background-color:#d4af37;color:#0a0a0a;text-decoration:none;padding:14px 36px;border-radius:8px;font-weight:bold;font-size:15px;font-family:Arial,sans-serif;">Reprendre ma commande</a>
<p style="color:#888;font-size:12px;line-height:1.5;margin:28px 0 0;">Vous avez déjà commandé, ou vous avez changé d'avis ? Vous n'avez rien à faire : ce panier s'effacera tout seul.</p>
<p style="color:#666;font-size:11px;margin:20px 0 0;">High Society Botanicals - Vente réservée aux personnes majeures</p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;

  const text = `${greeting}\n\n${headline}\n\n${intro}\n\nCommande ${orderNumber} - Total ${euros(totalAmount)}\n\nReprendre votre commande : ${resumeUrl}\n\nVous avez déjà commandé, ou vous avez changé d'avis ? Vous n'avez rien à faire : ce panier s'effacera tout seul.\n\nHigh Society Botanicals - Vente réservée aux personnes majeures`;

  return { subject, html, text };
}

/** Secret de la tâche cron (en-tête x-cron-secret), comparé dans la base, jamais dans le code. */
async function hasValidCronSecret(req: Request, supabase: any): Promise<boolean> {
  const candidate = req.headers.get("x-cron-secret")?.trim() ?? "";
  if (candidate.length < 32 || candidate.length > 256) return false;
  try {
    const { data, error } = await supabase.rpc("check_reconcile_cron_secret", { candidate });
    if (error) {
      console.error("relance paniers : vérification du secret impossible", error.message);
      return false;
    }
    return data === true;
  } catch (e) {
    console.error("relance paniers : vérification du secret impossible", e);
    return false;
  }
}

/** Seulement un paiement par carte laissé en plan par un particulier. */
const isAbandonedCardOrder = (o: any): boolean =>
  o.payment_status === "unpaid" &&
  o.status === "pending" &&
  (o.payment_method ?? "online") === "online" &&
  (o.order_channel ?? "b2c") !== "pro";

const ORDER_COLUMNS =
  "id, user_id, guest_email, guest_name, display_order_number, total_amount, created_at, payment_status, status, payment_method, order_channel";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method === "GET") return json({ version: VERSION });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, serviceKey);

    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    const allowed = token === serviceKey || (await hasValidCronSecret(req, supabase));
    if (!allowed) return json({ error: "Forbidden" }, 403);

    const now = Date.now();
    const iso = (hoursAgo: number) => new Date(now - hoursAgo * 60 * 60 * 1000).toISOString();

    // 1er rappel : commande créée il y a 2 à 4 h, pas encore rappelée
    const { data: stage2h, error: e1 } = await supabase
      .from("orders")
      .select(ORDER_COLUMNS)
      .eq("payment_status", "unpaid")
      .is("abandoned_email_2h_sent_at", null)
      .lte("created_at", iso(2))
      .gte("created_at", iso(4))
      .limit(50);
    if (e1) throw e1;

    // 2e rappel : commande créée il y a 24 à 48 h, pas encore rappelée
    const { data: stage24h, error: e2 } = await supabase
      .from("orders")
      .select(ORDER_COLUMNS)
      .eq("payment_status", "unpaid")
      .is("abandoned_email_24h_sent_at", null)
      .lte("created_at", iso(24))
      .gte("created_at", iso(48))
      .limit(50);
    if (e2) throw e2;

    const results: Record<string, number> = {
      sent_2h: 0, sent_24h: 0, skipped: 0, failed: 0, not_card: 0, bought_since: 0,
    };

    async function resolveRecipient(order: any): Promise<{ email: string; name: string | null } | null> {
      if (order.guest_email) return { email: order.guest_email, name: order.guest_name ?? null };
      if (order.user_id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("email, full_name")
          .eq("id", order.user_id)
          .maybeSingle();
        if (profile?.email) return { email: profile.email, name: profile.full_name ?? null };
      }
      return null;
    }

    /** Le client a-t-il payé une commande depuis ce panier ? Alors on ne le relance pas. */
    async function hasBoughtSince(order: any, email: string): Promise<boolean> {
      let query = supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("payment_status", "paid")
        .gte("created_at", order.created_at);
      query = order.user_id ? query.eq("user_id", order.user_id) : query.eq("guest_email", email);
      const { count, error } = await query;
      if (error) throw error;
      return (count ?? 0) > 0;
    }

    async function remind(order: any, stage: "2h" | "24h") {
      if (!isAbandonedCardOrder(order)) { results.not_card++; return; }
      const r = await resolveRecipient(order);
      if (!r) { results.skipped++; return; }
      try {
        if (await hasBoughtSince(order, r.email)) { results.bought_since++; return; }
        const { subject, html, text } = buildEmail({
          firstName: r.name?.trim().split(/\s+/)[0] || null,
          orderNumber: order.display_order_number ?? order.id.slice(0, 8),
          totalAmount: Number(order.total_amount ?? 0),
          stage,
        });
        const result = await sendRawEmail({
          to: r.email,
          subject,
          html,
          text,
          label: `abandoned-cart-${stage}`,
          idempotencyKey: `abandoned-cart-${stage}-${order.id}`,
        });
        if (!result.sent) { results.skipped++; return; }
        const column = stage === "2h" ? "abandoned_email_2h_sent_at" : "abandoned_email_24h_sent_at";
        await supabase.from("orders").update({ [column]: new Date().toISOString() }).eq("id", order.id);
        results[stage === "2h" ? "sent_2h" : "sent_24h"]++;
      } catch (err) {
        console.error(`relance paniers : rappel ${stage} en échec`, order.id, err);
        results.failed++;
      }
    }

    for (const order of stage2h ?? []) await remind(order, "2h");
    for (const order of stage24h ?? []) await remind(order, "24h");

    console.log("relance paniers : bilan", JSON.stringify(results));
    return json({ success: true, version: VERSION, ...results });
  } catch (error) {
    console.error("send-abandoned-cart-email error:", error);
    return json({ error: String(error) }, 500);
  }
});
