import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://highsocietybotanicals.com";

function encodeBase64(str: string): string {
  return btoa(unescape(encodeURIComponent(str)));
}
function encodeSubject(subject: string): string {
  return `=?UTF-8?B?${encodeBase64(subject)}?=`;
}

async function sendGmail(to: string, subject: string, html: string, text: string) {
  const gmailUser = Deno.env.get("GMAIL_USER")!;
  const gmailPassword = Deno.env.get("GMAIL_APP_PASSWORD")!;

  const boundary = "boundary_" + crypto.randomUUID().replace(/-/g, "");
  const rawEmail = [
    `From: High Society Botanicals <${gmailUser}>`,
    `To: ${to}`,
    `Subject: ${encodeSubject(subject)}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset=UTF-8`,
    `Content-Transfer-Encoding: base64`,
    ``,
    encodeBase64(text),
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: base64`,
    ``,
    encodeBase64(html),
    ``,
    `--${boundary}--`,
  ].join("\r\n");

  const conn = await Deno.connectTls({ hostname: "smtp.gmail.com", port: 465 });
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  async function readResp(): Promise<string> {
    const buf = new Uint8Array(4096);
    const n = await conn.read(buf);
    return n ? decoder.decode(buf.subarray(0, n)) : "";
  }
  async function send(cmd: string): Promise<string> {
    await conn.write(encoder.encode(cmd + "\r\n"));
    return await readResp();
  }
  try {
    await readResp();
    await send("EHLO localhost");
    await send("AUTH LOGIN");
    await send(btoa(gmailUser));
    await send(btoa(gmailPassword));
    await send(`MAIL FROM:<${gmailUser}>`);
    await send(`RCPT TO:<${to}>`);
    await send("DATA");
    await conn.write(encoder.encode(rawEmail + "\r\n.\r\n"));
    await readResp();
    await send("QUIT");
  } finally {
    try { conn.close(); } catch (_) {}
  }
}

function buildEmail(opts: {
  firstName?: string | null;
  orderNumber: string;
  totalAmount: number;
  stage: "2h" | "24h";
}): { subject: string; html: string; text: string } {
  const { firstName, orderNumber, totalAmount, stage } = opts;
  const greeting = firstName ? `Bonjour ${firstName},` : `Bonjour,`;
  const resumeUrl = `${SITE_URL}/catalogue?promo=RETOUR10`;

  const headline = stage === "2h"
    ? "Vous avez oublié quelque chose…"
    : "Votre sélection vous attend toujours";

  const intro = stage === "2h"
    ? "Votre panier est toujours disponible. Finalisez votre commande en un clic pour ne pas laisser passer votre sélection."
    : "Pour vous accompagner, profitez d'un avantage exclusif de <strong>-10%</strong> avec le code <strong>RETOUR10</strong> lors de la finalisation de votre commande.";

  const subject = stage === "2h"
    ? "Votre panier vous attend - High Society Botanicals"
    : "-10% sur votre panier avec le code RETOUR10";

  const promoBlock = stage === "24h" ? `
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
<tr><td style="background-color:#1a1a1a;border:1px solid #2a2a2a;border-radius:8px;padding:20px;text-align:center;">
<p style="color:#c0b89a;font-size:14px;margin:0 0 8px;">Votre avantage exclusif</p>
<p style="color:#d4af37;font-size:28px;font-weight:bold;margin:0;letter-spacing:3px;">RETOUR10</p>
<p style="color:#888;font-size:12px;margin:8px 0 0;">-10% sur votre commande</p>
</td></tr>
</table>` : "";

  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#111111;border:1px solid #2a2a2a;border-radius:12px;overflow:hidden;">
<tr><td style="height:4px;background:linear-gradient(90deg,#c5a55a,#d4af37,#c5a55a);"></td></tr>
<tr><td style="padding:40px 30px;text-align:center;">
<h1 style="color:#d4af37;font-size:26px;margin:0 0 16px;font-family:Georgia,serif;">${headline}</h1>
<p style="color:#c0b89a;font-size:15px;margin:0 0 8px;">${greeting}</p>
<p style="color:#c0b89a;font-size:15px;line-height:1.6;margin:0 0 24px;">${intro}</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
<tr><td style="background-color:#1a1a1a;border:1px solid #2a2a2a;border-radius:8px;padding:16px;text-align:left;">
<p style="color:#888;font-size:12px;margin:0 0 4px;text-transform:uppercase;letter-spacing:1px;">Commande</p>
<p style="color:#d4af37;font-size:16px;margin:0 0 6px;font-weight:bold;">${orderNumber}</p>
<p style="color:#c0b89a;font-size:14px;margin:0;">Total : ${totalAmount.toFixed(2)} €</p>
</td></tr>
</table>
${promoBlock}
<a href="${resumeUrl}" style="display:inline-block;background-color:#d4af37;color:#0a0a0a;text-decoration:none;padding:14px 36px;border-radius:8px;font-weight:bold;font-size:15px;font-family:Arial,sans-serif;">Reprendre ma commande</a>
<p style="color:#666;font-size:11px;margin:32px 0 0;">High Society Botanicals - Haute Couture Botanique</p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;

  const text = `${greeting}\n\n${headline}\n\nCommande ${orderNumber} - Total ${totalAmount.toFixed(2)} EUR\n\n${stage === "24h" ? "Code RETOUR10 = -10%\n\n" : ""}Reprendre votre commande : ${resumeUrl}\n\nHigh Society Botanicals`;

  return { subject, html, text };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const now = Date.now();
    const twoHoursAgo = new Date(now - 2 * 60 * 60 * 1000).toISOString();
    const fourHoursAgo = new Date(now - 4 * 60 * 60 * 1000).toISOString();
    const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();
    const fortyEightHoursAgo = new Date(now - 48 * 60 * 60 * 1000).toISOString();

    // Stage 2h: created between 4h-2h ago, no 2h email sent
    const { data: stage2h, error: e1 } = await supabase
      .from("orders")
      .select("id, user_id, guest_email, guest_name, display_order_number, total_amount, created_at")
      .eq("payment_status", "unpaid")
      .is("abandoned_email_2h_sent_at", null)
      .lte("created_at", twoHoursAgo)
      .gte("created_at", fourHoursAgo)
      .limit(50);
    if (e1) throw e1;

    // Stage 24h: created between 48h-24h ago, no 24h email sent
    const { data: stage24h, error: e2 } = await supabase
      .from("orders")
      .select("id, user_id, guest_email, guest_name, display_order_number, total_amount, created_at")
      .eq("payment_status", "unpaid")
      .is("abandoned_email_24h_sent_at", null)
      .lte("created_at", twentyFourHoursAgo)
      .gte("created_at", fortyEightHoursAgo)
      .limit(50);
    if (e2) throw e2;

    const results: Record<string, number> = { sent_2h: 0, sent_24h: 0, skipped: 0, failed: 0 };

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

    for (const order of stage2h ?? []) {
      const r = await resolveRecipient(order);
      if (!r) { results.skipped++; continue; }
      try {
        const { subject, html, text } = buildEmail({
          firstName: r.name?.split(" ")[0] ?? null,
          orderNumber: order.display_order_number ?? order.id.slice(0, 8),
          totalAmount: Number(order.total_amount ?? 0),
          stage: "2h",
        });
        await sendGmail(r.email, subject, html, text);
        await supabase.from("orders")
          .update({ abandoned_email_2h_sent_at: new Date().toISOString() })
          .eq("id", order.id);
        results.sent_2h++;
      } catch (err) {
        console.error("2h email failed:", order.id, err);
        results.failed++;
      }
    }

    for (const order of stage24h ?? []) {
      const r = await resolveRecipient(order);
      if (!r) { results.skipped++; continue; }
      try {
        const { subject, html, text } = buildEmail({
          firstName: r.name?.split(" ")[0] ?? null,
          orderNumber: order.display_order_number ?? order.id.slice(0, 8),
          totalAmount: Number(order.total_amount ?? 0),
          stage: "24h",
        });
        await sendGmail(r.email, subject, html, text);
        await supabase.from("orders")
          .update({ abandoned_email_24h_sent_at: new Date().toISOString() })
          .eq("id", order.id);
        results.sent_24h++;
      } catch (err) {
        console.error("24h email failed:", order.id, err);
        results.failed++;
      }
    }

    return new Response(JSON.stringify({ success: true, ...results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("send-abandoned-cart-email error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
