import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendRawEmail } from "../_shared/transactional-email-templates/send-raw-email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string" || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ error: "Email invalide" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Per-IP rate limit: max 3 sends per hour, max 20 per day
    const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim()
      || req.headers.get("cf-connecting-ip")
      || "unknown";
    const nowIso = new Date().toISOString();
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { count: hourCount } = await adminClient
      .from("ip_rate_limits")
      .select("id", { count: "exact", head: true })
      .eq("bucket", "welcome_promo")
      .eq("ip", ip)
      .gte("created_at", hourAgo);
    const { count: dayCount } = await adminClient
      .from("ip_rate_limits")
      .select("id", { count: "exact", head: true })
      .eq("bucket", "welcome_promo")
      .eq("ip", ip)
      .gte("created_at", dayAgo);

    if ((hourCount ?? 0) >= 3 || (dayCount ?? 0) >= 20) {
      return new Response(
        JSON.stringify({ error: "Trop de tentatives, réessayez plus tard" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Record attempt immediately (before send) to prevent burst abuse
    await adminClient.from("ip_rate_limits").insert({
      bucket: "welcome_promo",
      ip,
      created_at: nowIso,
    });

    // Best-effort cleanup of old entries (>7 days)
    await adminClient
      .from("ip_rate_limits")
      .delete()
      .lt("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    // Idempotency: prevent abusive re-sends to arbitrary addresses
    const { data: existing } = await adminClient
      .from("contacts")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();
    if (existing) {
      return new Response(
        JSON.stringify({ success: true, alreadySent: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }


    const subject = "Votre code -15% + 5g offerts - High Society Botanicals";

    const htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#111111;border:1px solid #2a2a2a;border-radius:12px;overflow:hidden;">
<tr><td style="height:4px;background:linear-gradient(90deg,#c5a55a,#d4af37,#c5a55a);"></td></tr>
<tr><td style="padding:40px 30px;text-align:center;">
<h1 style="color:#d4af37;font-size:28px;margin:0 0 10px;">Bienvenue chez HSB !</h1>
<p style="color:#c0b89a;font-size:16px;margin:0 0 30px;">Merci de nous avoir rejoint. Voici vos avantages exclusifs :</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
<tr><td style="background-color:#1a1a1a;border:1px solid #2a2a2a;border-radius:8px;padding:20px;text-align:center;">
<p style="color:#c0b89a;font-size:14px;margin:0 0 10px;">Votre code promo -15%</p>
<p style="color:#d4af37;font-size:32px;font-weight:bold;margin:0;letter-spacing:3px;">BIENVENUE15</p>
<p style="color:#888;font-size:12px;margin:10px 0 0;">Valable sur votre premiere commande</p>
</td></tr>
</table>
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:30px;">
<tr><td style="background-color:#1a1a1a;border:1px solid #2a2a2a;border-radius:8px;padding:20px;text-align:center;">
<p style="color:#d4af37;font-size:18px;font-weight:bold;margin:0 0 5px;">5g OFFERTS</p>
<p style="color:#c0b89a;font-size:14px;margin:0;">pour tout achat de 10g de fleurs</p>
</td></tr>
</table>
<a href="https://highsocietybotanicals.lovable.app" style="display:inline-block;background-color:#d4af37;color:#0a0a0a;text-decoration:none;padding:14px 40px;border-radius:8px;font-weight:bold;font-size:16px;">Decouvrir nos produits</a>
<p style="color:#666;font-size:12px;margin:30px 0 0;">High Society Botanicals</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

    const textContent = `Bienvenue chez High Society Botanicals !

Merci de nous avoir rejoint. Voici vos avantages :

Code promo -15% : BIENVENUE15
Valable sur votre premiere commande.

Bonus : 5g offerts pour tout achat de 10g de fleurs !

Decouvrez nos produits : https://highsocietybotanicals.lovable.app

High Society Botanicals`;

    const result = await sendRawEmail({
      to: normalizedEmail,
      subject,
      html: htmlContent,
      text: textContent,
      label: "welcome-promo",
      idempotencyKey: `welcome-promo-${normalizedEmail}`,
      replyTo: "contacts@highsocietybotanicals.com",
    });
    if (!result.sent) {
      return new Response(JSON.stringify({ success: false, reason: result.reason }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Welcome promo email sent to:", normalizedEmail);

    // Record contact to enforce one-shot idempotency on future calls
    await adminClient
      .from("contacts")
      .upsert({ email: normalizedEmail, source: "welcome_popup" }, { onConflict: "email" });

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error sending welcome promo:", error);
    return new Response(
      JSON.stringify({ error: "Erreur d'envoi" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
