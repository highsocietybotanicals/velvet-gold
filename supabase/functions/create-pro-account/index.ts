import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

const encodeBase64 = (str: string) => btoa(unescape(encodeURIComponent(str)));
const encodeSubject = (s: string) => `=?UTF-8?B?${encodeBase64(s)}?=`;

function generatePassword(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

async function sendEmail(to: string, subject: string, html: string, text: string) {
  const gmailUser = Deno.env.get("GMAIL_USER");
  const gmailPassword = Deno.env.get("GMAIL_APP_PASSWORD");
  if (!gmailUser || !gmailPassword) throw new Error("Configuration email manquante");

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

  const readResponse = async () => {
    const buf = new Uint8Array(4096);
    const n = await conn.read(buf);
    return n ? decoder.decode(buf.subarray(0, n)) : "";
  };
  const sendCommand = async (cmd: string) => {
    await conn.write(encoder.encode(cmd + "\r\n"));
    return await readResponse();
  };

  await readResponse();
  await sendCommand("EHLO localhost");
  await sendCommand("AUTH LOGIN");
  await sendCommand(btoa(gmailUser));
  await sendCommand(btoa(gmailPassword));
  await sendCommand(`MAIL FROM:<${gmailUser}>`);
  await sendCommand(`RCPT TO:<${to}>`);
  await sendCommand("DATA");
  await conn.write(encoder.encode(rawEmail + "\r\n.\r\n"));
  await readResponse();
  await sendCommand("QUIT");
  conn.close();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) return json({ error: "Unauthorized" }, 401);

    const [{ data: isAdmin }, { data: isCommercial }] = await Promise.all([
      userClient.rpc("is_admin"),
      userClient.rpc("is_commercial"),
    ]);
    if (!isAdmin && !isCommercial) return json({ error: "Forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const rawEmail = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!rawEmail || rawEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
      return json({ error: "Email invalide" }, 400);
    }
    const companyName = typeof body.company_name === "string" ? body.company_name.slice(0, 200) : "";
    const fullName = typeof body.full_name === "string" ? body.full_name.slice(0, 200) : "";
    const phone = typeof body.phone === "string" ? body.phone.slice(0, 20) : "";
    const city = typeof body.city === "string" ? body.city.slice(0, 200) : "";
    const postalCode = typeof body.postal_code === "string" ? body.postal_code.slice(0, 10) : "";
    const address = typeof body.address === "string" ? body.address.slice(0, 500) : "";
    const siretRaw = typeof body.siret === "string" ? body.siret.replace(/\D/g, "") : "";
    const siret = /^\d{14}$/.test(siretRaw) ? siretRaw : null;
    const vatRaw =
      typeof body.vat_number === "string" ? body.vat_number.toUpperCase().replace(/\s/g, "") : "";
    const vatNumber = /^[A-Z]{2}[A-Z0-9]{2,12}$/.test(vatRaw) ? vatRaw : null;


    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Déjà un compte pour cet email ? on ne recrée rien.
    const { data: existingProfile } = await admin
      .from("profiles")
      .select("id")
      .eq("email", rawEmail)
      .maybeSingle();

    if (existingProfile) {
      return json({ success: true, alreadyExists: true });
    }

    const password = generatePassword();
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: rawEmail,
      password,
      email_confirm: true,
    });
    if (createError || !created?.user) {
      return json({ error: createError?.message ?? "Création du compte impossible" }, 400);
    }

    const userId = created.user.id;

    await admin
      .from("profiles")
      .update({
        company_name: companyName || null,
        full_name: fullName || null,
        phone: phone || null,
        city: city || null,
        postal_code: /^\d{5}$/.test(postalCode) ? postalCode : null,
        address_line1: address || null,
        siret,
        vat_number: vatNumber,
        is_pro_validated: true,
        is_vat_validated: !!vatNumber,

      })
      .eq("id", userId);

    await admin.from("user_roles").insert({ user_id: userId, role: "pro" });

    const loginUrl = "https://highsocietybotanicals.com/auth";
    const subject = "Votre accès partenaire professionnel — High Society Botanicals";
    const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#111111;border:1px solid #2a2a2a;border-radius:12px;overflow:hidden;">
<tr><td style="height:4px;background:linear-gradient(90deg,#c5a55a,#d4af37,#c5a55a);"></td></tr>
<tr><td style="padding:40px 30px;">
<h1 style="color:#d4af37;font-size:26px;margin:0 0 12px;text-align:center;">Votre espace professionnel est ouvert</h1>
<p style="color:#c0b89a;font-size:15px;line-height:1.6;margin:0 0 24px;">
Bonjour${fullName ? ` ${fullName}` : ""},<br><br>
Suite à notre rencontre${companyName ? ` avec ${companyName}` : ""}, votre accès partenaire High Society Botanicals a été créé.
Vous y retrouvez notre grille tarifaire professionnelle HT, le détail des variétés (analyses laboratoire, taux, terpènes) et la commande en ligne en préconditionné.
</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
<tr><td style="background-color:#1a1a1a;border:1px solid #2a2a2a;border-radius:8px;padding:20px;">
<p style="color:#888;font-size:12px;margin:0 0 6px;text-transform:uppercase;letter-spacing:1px;">Identifiant</p>
<p style="color:#f5f0e1;font-size:16px;margin:0 0 16px;">${rawEmail}</p>
<p style="color:#888;font-size:12px;margin:0 0 6px;text-transform:uppercase;letter-spacing:1px;">Mot de passe provisoire</p>
<p style="color:#d4af37;font-size:22px;font-weight:bold;letter-spacing:2px;margin:0;">${password}</p>
</td></tr>
</table>
<p style="text-align:center;margin:0 0 24px;">
<a href="${loginUrl}" style="display:inline-block;background-color:#d4af37;color:#0a0a0a;text-decoration:none;padding:14px 36px;border-radius:8px;font-weight:bold;font-size:15px;">Accéder à mon espace pro</a>
</p>
<p style="color:#666;font-size:12px;line-height:1.6;margin:0;">
Pensez à modifier ce mot de passe après votre première connexion. Produits réservés aux adultes, conformes à la réglementation française, analyses disponibles sur demande.
</p>
<p style="color:#666;font-size:12px;margin:24px 0 0;text-align:center;">High Society Botanicals — Abbaretz (44170)</p>
</td></tr>
</table>
</td></tr></table>
</body></html>`;

    const text = `Votre espace professionnel High Society Botanicals est ouvert.

Identifiant : ${rawEmail}
Mot de passe provisoire : ${password}

Connexion : ${loginUrl}

Pensez à modifier votre mot de passe après la première connexion.

High Society Botanicals — Abbaretz (44170)`;

    let emailSent = true;
    try {
      await sendEmail(rawEmail, subject, html, text);
    } catch (e) {
      emailSent = false;
      console.error("Pro account email failed:", (e as Error).message);
    }

    return json({ success: true, created: true, emailSent, password });
  } catch (e) {
    console.error("create-pro-account error:", (e as Error).message);
    return json({ error: "Erreur serveur" }, 500);
  }
});
