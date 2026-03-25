import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

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

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ error: "Email invalide" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const gmailUser = Deno.env.get("GMAIL_USER");
    const gmailPassword = Deno.env.get("GMAIL_APP_PASSWORD");

    if (!gmailUser || !gmailPassword) {
      console.error("Missing GMAIL credentials");
      return new Response(
        JSON.stringify({ error: "Configuration email manquante" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#111111;border:1px solid #2a2a2a;border-radius:12px;overflow:hidden;">
        <!-- Gold bar -->
        <tr><td style="height:4px;background:linear-gradient(90deg,#c5a55a,#d4af37,#c5a55a);"></td></tr>
        
        <tr><td style="padding:40px 30px;text-align:center;">
          <h1 style="color:#d4af37;font-size:28px;margin:0 0 10px;">Bienvenue chez HSB !</h1>
          <p style="color:#c0b89a;font-size:16px;margin:0 0 30px;">Merci de nous avoir rejoint. Voici vos avantages exclusifs :</p>
          
          <!-- Promo code -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
            <tr><td style="background-color:#1a1a1a;border:1px solid #2a2a2a;border-radius:8px;padding:20px;text-align:center;">
              <p style="color:#c0b89a;font-size:14px;margin:0 0 10px;">Votre code promo -15%</p>
              <p style="color:#d4af37;font-size:32px;font-weight:bold;margin:0;letter-spacing:3px;">BIENVENUE15</p>
              <p style="color:#888;font-size:12px;margin:10px 0 0;">Valable sur votre première commande</p>
            </td></tr>
          </table>
          
          <!-- Bonus 5g -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:30px;">
            <tr><td style="background-color:#1a1a1a;border:1px solid #2a2a2a;border-radius:8px;padding:20px;text-align:center;">
              <p style="color:#d4af37;font-size:18px;font-weight:bold;margin:0 0 5px;">🎁 5g OFFERTS</p>
              <p style="color:#c0b89a;font-size:14px;margin:0;">pour tout achat de 10g de fleurs</p>
            </td></tr>
          </table>
          
          <!-- CTA -->
          <a href="https://highsocietybotanicals.lovable.app" style="display:inline-block;background-color:#d4af37;color:#0a0a0a;text-decoration:none;padding:14px 40px;border-radius:8px;font-weight:bold;font-size:16px;">Découvrir nos produits</a>
          
          <p style="color:#666;font-size:12px;margin:30px 0 0;">High Society Botanicals — contacts@highsocietybotanicals.com</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const textContent = `Bienvenue chez High Society Botanicals !

Merci de nous avoir rejoint. Voici vos avantages :

Code promo -15% : BIENVENUE15
Valable sur votre première commande.

Bonus : 5g offerts pour tout achat de 10g de fleurs !

Découvrez nos produits : https://highsocietybotanicals.lovable.app

High Society Botanicals — contacts@highsocietybotanicals.com`;

    const client = new SMTPClient({
      connection: {
        hostname: "smtp.gmail.com",
        port: 465,
        tls: true,
        auth: { username: gmailUser, password: gmailPassword },
      },
    });

    await client.send({
      from: gmailUser,
      to: email,
      subject: "🎁 Votre code -15% + 5g offerts — High Society Botanicals",
      content: textContent,
      html: htmlContent,
    });

    await client.close();

    console.log("Welcome promo email sent to:", email);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error sending welcome promo:", error);
    return new Response(
      JSON.stringify({ error: "Erreur d'envoi", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
