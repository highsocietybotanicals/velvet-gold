import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsPDF } from "https://esm.sh/jspdf@2.5.2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TVA_RATE = 20;

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

interface Line {
  designation: string;
  format_g: number;
  quantity: number;
  unit_price_ht: number; // € HT par gramme
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData } = await userClient.auth.getUser();
    const caller = userData?.user;
    if (!caller) return json({ error: "Unauthorized" }, 401);

    const [{ data: isAdmin }, { data: isCommercial }] = await Promise.all([
      userClient.rpc("is_admin"),
      userClient.rpc("is_commercial"),
    ]);
    if (!isAdmin && !isCommercial) return json({ error: "Forbidden" }, 403);

    const body = await req.json().catch(() => ({}));

    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: "Email client invalide" }, 400);
    }

    const rawLines: Line[] = Array.isArray(body.lines) ? body.lines : [];
    const lines = rawLines
      .map((l) => ({
        designation: String(l.designation ?? "").slice(0, 80).trim(),
        format_g: Number(l.format_g) || 0,
        quantity: Math.max(1, Math.round(Number(l.quantity) || 0)),
        unit_price_ht: Number(l.unit_price_ht) || 0,
      }))
      .filter((l) => l.designation && l.format_g > 0 && l.unit_price_ht > 0);

    if (lines.length === 0) return json({ error: "Aucune ligne valide" }, 400);
    if (lines.length > 30) return json({ error: "Trop de lignes (max 30)" }, 400);

    const iban = String(body.iban ?? "").toUpperCase().replace(/\s+/g, "").slice(0, 34);
    const bic = String(body.bic ?? "").toUpperCase().replace(/\s+/g, "").slice(0, 11);
    const holder = String(body.holder ?? "High Society Botanicals").slice(0, 80);
    if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(iban)) {
      return json({ error: "IBAN invalide" }, 400);
    }

    const dueDays = Math.min(90, Math.max(0, Math.round(Number(body.due_days) || 30)));
    const notes = String(body.notes ?? "").slice(0, 500);

    // Compte pro du client
    const { data: profile } = await admin
      .from("profiles")
      .select("id, company_name, full_name, siret, vat_number, address_line1, postal_code, city, phone")
      .eq("email", email)
      .maybeSingle();

    if (!profile) {
      return json(
        { error: "Aucun compte pro pour cet email. Crée d'abord le prospect / son compte pro." },
        404,
      );
    }

    let totalHT = 0;
    let totalWeight = 0;
    const items = lines.map((l) => {
      const grams = Math.round(l.format_g * l.quantity * 100) / 100;
      const lineHT = Math.round(grams * l.unit_price_ht * 100) / 100;
      totalHT += lineHT;
      totalWeight += grams;
      return {
        product_id: "manual-pro",
        product_name: `${l.designation} — ${l.format_g} g x${l.quantity}`,
        product_type: "fleur",
        weight: grams,
        quantity: l.quantity,
        unit_price: l.unit_price_ht,
        total_price: lineHT,
        _line: l,
        _grams: grams,
        _ht: lineHT,
      };
    });

    totalHT = Math.round(totalHT * 100) / 100;
    const totalTVA = Math.round(totalHT * (TVA_RATE / 100) * 100) / 100;
    const totalTTC = Math.round((totalHT + totalTVA) * 100) / 100;
    totalWeight = Math.round(totalWeight * 100) / 100;

    const deliveryAddress = [profile.address_line1, profile.postal_code, profile.city]
      .filter(Boolean)
      .join(" ");

    const { data: order, error: orderErr } = await admin
      .from("orders")
      .insert({
        user_id: profile.id,
        total_amount: totalTTC,
        total_flower_weight: totalWeight,
        delivery_type: "postal",
        delivery_address: deliveryAddress || null,
        contact_phone: (profile.phone || "").slice(0, 20) || null,
        status: "pending",
        payment_status: "unpaid",
        order_channel: "pro",
        payment_method: "transfer",
      })
      .select("id, display_order_number, created_at")
      .single();

    if (orderErr || !order) {
      console.error("commercial-invoice order error:", orderErr);
      return json({ error: "Création de la commande impossible" }, 500);
    }

    await admin.from("order_items").insert(
      items.map((i) => ({
        order_id: order.id,
        product_id: i.product_id,
        product_name: i.product_name,
        product_type: i.product_type,
        weight: i.weight,
        quantity: i.quantity,
        unit_price: i.unit_price,
        total_price: i.total_price,
      })),
    );

    const orderNumber = order.display_order_number as string;

    // Commission du commercial (sa propre fiche, ou celle fournie par l'admin)
    let repId: string | null = typeof body.rep_id === "string" ? body.rep_id : null;
    if (!repId) {
      const { data: myRep } = await admin
        .from("sales_reps")
        .select("id, commission_percent")
        .eq("user_id", caller.id)
        .maybeSingle();
      repId = myRep?.id ?? null;
    }
    if (repId) {
      const { data: rep } = await admin
        .from("sales_reps")
        .select("commission_percent")
        .eq("id", repId)
        .maybeSingle();
      const pct = Number(rep?.commission_percent ?? 10);
      const month = new Date(order.created_at as string);
      await admin.from("sales_commissions").insert({
        rep_id: repId,
        order_id: order.id,
        client_label: profile.company_name || email,
        period_month: `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-01`,
        revenue_ht: totalHT,
        commission_percent: pct,
        commission_amount: Math.round(totalHT * (pct / 100) * 100) / 100,
        status: "pending",
      });
    }

    // ---------- PDF ----------
    const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const W = 210;
    const margin = 15;
    const contentW = W - 2 * margin;
    let y = margin;

    const gold: [number, number, number] = [184, 134, 11];
    const dark: [number, number, number] = [34, 34, 34];
    const gray: [number, number, number] = [102, 102, 102];

    doc.setFontSize(18);
    doc.setTextColor(...gold);
    doc.setFont("helvetica", "bold");
    doc.text("HIGH SOCIETY BOTANICALS", margin, y + 6);
    doc.setFontSize(8);
    doc.setTextColor(...gray);
    doc.setFont("helvetica", "normal");
    doc.text("highsocietybotanicals.com", margin, y + 12);
    [
      "High Society Botanicals",
      "SIRET : 994 621 910 00011",
      "TVA Intra. : FR 48 994 621 910",
      "15 rue des écoles, 44170 Abbaretz",
    ].forEach((l, i) => doc.text(l, W - margin, y + 4 + i * 4, { align: "right" }));

    y += 20;
    doc.setDrawColor(...gold);
    doc.setLineWidth(0.8);
    doc.line(margin, y, W - margin, y);
    y += 8;

    doc.setFontSize(20);
    doc.setTextColor(...gold);
    doc.setFont("helvetica", "bold");
    doc.text("FACTURE PROFESSIONNELLE", W / 2, y, { align: "center" });
    y += 12;

    const boxH = 34;
    const boxW = contentW / 2 - 3;
    const issued = new Date().toLocaleDateString("fr-FR");
    const due = new Date(Date.now() + dueDays * 86400000).toLocaleDateString("fr-FR");

    doc.setFillColor(249, 247, 243);
    doc.setDrawColor(232, 224, 208);
    doc.roundedRect(margin, y, boxW, boxH, 2, 2, "FD");
    doc.setFontSize(7);
    doc.setTextColor(...gold);
    doc.setFont("helvetica", "bold");
    doc.text("INFORMATIONS FACTURE", margin + 4, y + 6);
    doc.setFontSize(11);
    doc.setTextColor(...dark);
    doc.text(orderNumber, margin + 4, y + 13);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Date d'émission : ${issued}`, margin + 4, y + 20);
    doc.text(`Échéance : ${due}`, margin + 4, y + 25);
    doc.text("Règlement : virement bancaire", margin + 4, y + 30);

    const boxX2 = margin + boxW + 6;
    doc.setFillColor(249, 247, 243);
    doc.setDrawColor(232, 224, 208);
    doc.roundedRect(boxX2, y, boxW, boxH, 2, 2, "FD");
    doc.setFontSize(7);
    doc.setTextColor(...gold);
    doc.setFont("helvetica", "bold");
    doc.text("CLIENT PROFESSIONNEL", boxX2 + 4, y + 6);
    doc.setFontSize(10);
    doc.setTextColor(...dark);
    doc.text((profile.company_name || profile.full_name || email).slice(0, 34), boxX2 + 4, y + 12);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    let cy = y + 17;
    if (profile.siret) {
      doc.text(`SIRET : ${profile.siret}`, boxX2 + 4, cy);
      cy += 5;
    }
    if (profile.vat_number) {
      doc.text(`TVA : ${profile.vat_number}`, boxX2 + 4, cy);
      cy += 5;
    }
    if (deliveryAddress) doc.text(deliveryAddress.slice(0, 38), boxX2 + 4, cy);

    y += boxH + 10;

    const cDesig = margin + 2;
    const cFormat = margin + 92;
    const cQte = margin + 112;
    const cPu = margin + 140;
    const rightEdge = W - margin - 2;

    doc.setFillColor(...gold);
    doc.rect(margin, y, contentW, 8, "F");
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("DESIGNATION", cDesig, y + 5.5);
    doc.text("FORMAT", cFormat, y + 5.5, { align: "right" });
    doc.text("QTE", cQte, y + 5.5, { align: "right" });
    doc.text("PU HT/g", cPu, y + 5.5, { align: "right" });
    doc.text("TOTAL HT", rightEdge, y + 5.5, { align: "right" });
    y += 10;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    items.forEach((i, idx) => {
      if (y > 240) {
        doc.addPage();
        y = margin;
      }
      if (idx % 2 === 0) {
        doc.setFillColor(252, 250, 245);
        doc.rect(margin, y - 1, contentW, 8, "F");
      }
      doc.setTextColor(...dark);
      doc.text(i._line.designation.slice(0, 44), cDesig, y + 4);
      doc.text(`${i._line.format_g} g`, cFormat, y + 4, { align: "right" });
      doc.text(`x ${i._line.quantity}`, cQte, y + 4, { align: "right" });
      doc.text(`${i._line.unit_price_ht.toFixed(2)} EUR`, cPu, y + 4, { align: "right" });
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...gold);
      doc.text(`${i._ht.toFixed(2)} EUR`, rightEdge, y + 4, { align: "right" });
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...dark);
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.15);
      doc.line(margin, y + 7, W - margin, y + 7);
      y += 8;
    });

    y += 4;
    doc.setDrawColor(...gold);
    doc.setLineWidth(0.6);
    doc.line(margin, y, W - margin, y);
    y += 6;

    const totalsX = W - margin - 5;
    const labelX = totalsX - 60;
    doc.setFontSize(10);
    doc.setTextColor(...dark);
    doc.text(`Poids total : ${totalWeight} g`, margin, y);
    doc.text("Total HT :", labelX, y, { align: "right" });
    doc.text(`${totalHT.toFixed(2)} EUR`, totalsX, y, { align: "right" });
    y += 6;
    doc.text(`TVA (${TVA_RATE}%) :`, labelX, y, { align: "right" });
    doc.text(`${totalTVA.toFixed(2)} EUR`, totalsX, y, { align: "right" });
    y += 4;
    doc.setDrawColor(...gold);
    doc.line(labelX - 10, y, totalsX + 2, y);
    y += 7;
    doc.setFontSize(14);
    doc.setTextColor(...gold);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL A REGLER TTC :", labelX, y, { align: "right" });
    doc.text(`${totalTTC.toFixed(2)} EUR`, totalsX, y, { align: "right" });
    y += 12;

    // Bloc virement
    if (y > 215) {
      doc.addPage();
      y = margin;
    }
    doc.setFillColor(249, 247, 243);
    doc.setDrawColor(232, 224, 208);
    doc.roundedRect(margin, y, contentW, 40, 2, 2, "FD");
    doc.setFontSize(8);
    doc.setTextColor(...gold);
    doc.setFont("helvetica", "bold");
    doc.text("REGLEMENT PAR VIREMENT BANCAIRE", margin + 4, y + 7);
    doc.setFontSize(9);
    doc.setTextColor(...dark);
    doc.setFont("helvetica", "normal");
    doc.text(`Titulaire : ${holder}`, margin + 4, y + 14);
    doc.text(`IBAN : ${iban.replace(/(.{4})/g, "$1 ").trim()}`, margin + 4, y + 20);
    if (bic) doc.text(`BIC : ${bic}`, margin + 4, y + 26);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...gold);
    doc.setFontSize(11);
    doc.text(`Libellé obligatoire du virement : ${orderNumber}`, margin + 4, y + 34);
    y += 48;

    doc.setFontSize(8);
    doc.setTextColor(...gray);
    doc.setFont("helvetica", "normal");
    if (notes) {
      doc.text(doc.splitTextToSize(notes, contentW), margin, y);
      y += 6 + Math.ceil(notes.length / 110) * 4;
    }
    doc.text(
      "Vente directe entre professionnels. TVA acquittée sur les débits. Paiement à réception de facture.",
      margin,
      y,
    );
    y += 5;
    doc.text(
      "Pas d'escompte pour règlement anticipé. Pénalités de retard : 3 fois le taux d'intérêt légal.",
      margin,
      y,
    );
    y += 5;
    doc.text(
      "Produits de chanvre conformes à la réglementation française — analyses laboratoire sur demande.",
      margin,
      y,
    );

    const pdfBase64 = doc.output("datauristring").split(",")[1];
    const pdfBytes = new Uint8Array(doc.output("arraybuffer"));

    const filePath = `pro/${orderNumber}.pdf`;
    const { error: upErr } = await admin.storage
      .from("invoices")
      .upload(filePath, pdfBytes, { contentType: "application/pdf", upsert: true });
    if (upErr) console.error("commercial-invoice upload error:", upErr);

    // ---------- Email ----------
    let emailSent = true;
    try {
      const gmailUser = Deno.env.get("GMAIL_USER")!;
      const gmailPassword = Deno.env.get("GMAIL_APP_PASSWORD")!;
      const client = new SMTPClient({
        connection: {
          hostname: "smtp.gmail.com",
          port: 465,
          tls: true,
          auth: { username: gmailUser, password: gmailPassword },
        },
      });

      const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#111;border:1px solid #2a2a2a;border-radius:12px;overflow:hidden;">
<tr><td style="height:4px;background:linear-gradient(90deg,#c5a55a,#d4af37,#c5a55a);"></td></tr>
<tr><td style="padding:36px 30px;">
<h1 style="color:#d4af37;font-size:22px;margin:0 0 16px;text-align:center;">Votre facture ${orderNumber}</h1>
<p style="color:#c0b89a;font-size:15px;line-height:1.6;margin:0 0 22px;">
Bonjour${profile.full_name ? ` ${profile.full_name}` : ""},<br><br>
Voici votre facture professionnelle en pièce jointe. Elle est également disponible dans votre espace pro,
rubrique « Mes commandes ».
</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:22px;">
<tr><td style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:8px;padding:18px;">
<p style="color:#888;font-size:12px;margin:0 0 6px;text-transform:uppercase;letter-spacing:1px;">Montant à régler</p>
<p style="color:#f5f0e1;font-size:20px;margin:0 0 14px;">${totalTTC.toFixed(2)} € TTC <span style="font-size:13px;color:#888;">(${totalHT.toFixed(2)} € HT)</span></p>
<p style="color:#888;font-size:12px;margin:0 0 6px;text-transform:uppercase;letter-spacing:1px;">Virement — libellé obligatoire</p>
<p style="color:#d4af37;font-size:18px;font-weight:bold;letter-spacing:1px;margin:0 0 14px;">${orderNumber}</p>
<p style="color:#888;font-size:12px;margin:0 0 6px;text-transform:uppercase;letter-spacing:1px;">IBAN</p>
<p style="color:#f5f0e1;font-size:14px;margin:0;">${iban.replace(/(.{4})/g, "$1 ").trim()}${bic ? ` — BIC ${bic}` : ""}</p>
</td></tr></table>
<p style="text-align:center;margin:0 0 22px;">
<a href="https://highsocietybotanicals.com/pro/commandes" style="display:inline-block;background:#d4af37;color:#0a0a0a;text-decoration:none;padding:13px 32px;border-radius:8px;font-weight:bold;font-size:15px;">Voir dans mon espace pro</a>
</p>
<p style="color:#666;font-size:12px;line-height:1.6;margin:0;">Échéance : ${due}. Merci d'indiquer le numéro ${orderNumber} en libellé de votre virement pour que le règlement soit rattaché automatiquement.</p>
<p style="color:#666;font-size:12px;margin:22px 0 0;text-align:center;">High Society Botanicals — Abbaretz (44170)</p>
</td></tr></table></td></tr></table></body></html>`;

      await client.send({
        from: `High Society Botanicals <${gmailUser}>`,
        to: email,
        subject: `Facture ${orderNumber} — High Society Botanicals`,
        content: `Votre facture ${orderNumber} : ${totalTTC.toFixed(2)} EUR TTC (${totalHT.toFixed(2)} EUR HT).
Règlement par virement — libellé obligatoire : ${orderNumber}
IBAN : ${iban}${bic ? ` / BIC : ${bic}` : ""}
Échéance : ${due}

Facture également disponible dans votre espace pro : https://highsocietybotanicals.com/pro/commandes`,
        html,
        attachments: [
          {
            encoding: "base64",
            filename: `${orderNumber}.pdf`,
            content: pdfBase64,
            contentType: "application/pdf",
          },
        ],
      } as any);
      await client.close();
    } catch (e) {
      emailSent = false;
      console.error("commercial-invoice email failed:", (e as Error).message);
    }

    await admin.from("email_send_log").insert({
      template_name: "pro_invoice_commercial",
      recipient_email: email,
      status: emailSent ? "sent" : "failed",
      metadata: { order_id: order.id, order_number: orderNumber },
    });

    return json({
      success: true,
      orderId: order.id,
      orderNumber,
      totalHT,
      totalTTC,
      filePath,
      emailSent,
      pdfBase64,
    });
  } catch (e) {
    console.error("commercial-invoice error:", (e as Error).message);
    return json({ error: "Erreur serveur" }, 500);
  }
});
