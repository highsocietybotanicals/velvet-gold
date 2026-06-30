import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsPDF } from "https://esm.sh/jspdf@2.5.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TVA_RATE = 20;

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function isAdmin(serviceClient: any, userId: string): Promise<boolean> {
  const { data } = await serviceClient
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  return !!data;
}

async function requireAdmin(req: Request, serviceClient: any): Promise<Response | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return jsonResponse({ error: "Unauthorized" }, 401);
  const token = authHeader.replace("Bearer ", "").trim();

  const serviceKey = (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "").trim();
  if (token && token === serviceKey) return null;

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  if (!anonKey) return jsonResponse({ error: "Auth unavailable" }, 500);

  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data, error } = await authClient.auth.getClaims(token);
  if (error || !data?.claims?.sub) return jsonResponse({ error: "Unauthorized" }, 401);
  const ok = await isAdmin(serviceClient, data.claims.sub);
  if (!ok) return jsonResponse({ error: "Forbidden" }, 403);
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const authErr = await requireAdmin(req, supabase);
    if (authErr) return authErr;

    const { invoiceId } = await req.json();
    if (!invoiceId) return jsonResponse({ error: "Missing invoiceId" }, 400);

    const { data: invoice, error: invErr } = await supabase
      .from("pro_invoices")
      .select("*")
      .eq("id", invoiceId)
      .single();
    if (invErr || !invoice) return jsonResponse({ error: "Invoice not found" }, 404);

    const { data: partner } = await supabase
      .from("pro_partners")
      .select("*")
      .eq("id", invoice.partner_id)
      .single();

    const { data: deposits } = await supabase
      .from("pro_deposits")
      .select("*")
      .eq("invoice_id", invoiceId)
      .order("sold_at", { ascending: true });

    const lines = deposits || [];
    const rawCommission = invoice.commission_percent;
    const commission = rawCommission === null || rawCommission === undefined ? 30 : Number(rawCommission);
    const sellerShare = (100 - commission) / 100; // ce que je facture (ex: 0.70)

    const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const W = 210;
    const margin = 15;
    let y = margin;

    const gold: [number, number, number] = [184, 134, 11];
    const dark: [number, number, number] = [34, 34, 34];
    const gray: [number, number, number] = [102, 102, 102];
    const lightGray: [number, number, number] = [200, 200, 200];

    doc.setFontSize(18);
    doc.setTextColor(...gold);
    doc.setFont("helvetica", "bold");
    doc.text("HIGH SOCIETY BOTANICALS", margin, y + 6);
    doc.setFontSize(8);
    doc.setTextColor(...gray);
    doc.setFont("helvetica", "normal");
    doc.text("highsocietybotanicals.com", margin, y + 12);

    const companyLines = [
      "High Society Botanicals",
      "SIRET : 994 621 910 00011",
      "TVA Intra. : FR 48 994 621 910",
      "15 rue des écoles, 44170 Abbaretz",
    ];
    companyLines.forEach((line, i) => {
      doc.text(line, W - margin, y + 4 + i * 4, { align: "right" });
    });

    y += 20;
    doc.setDrawColor(...gold);
    doc.setLineWidth(0.8);
    doc.line(margin, y, W - margin, y);
    y += 8;

    doc.setFontSize(20);
    doc.setTextColor(...gold);
    doc.setFont("helvetica", "bold");
    doc.text("FACTURE PRO", W / 2, y, { align: "center" });
    y += 12;

    // Info boxes
    const contentW = W - 2 * margin;
    const boxH = 36;
    const boxW = contentW / 2 - 3;

    doc.setFillColor(249, 247, 243);
    doc.setDrawColor(232, 224, 208);
    doc.roundedRect(margin, y, boxW, boxH, 2, 2, "FD");
    doc.setFontSize(7);
    doc.setTextColor(...gold);
    doc.setFont("helvetica", "bold");
    doc.text("INFORMATIONS FACTURE", margin + 4, y + 6);
    doc.setFontSize(10);
    doc.setTextColor(...dark);
    doc.setFont("helvetica", "bold");
    doc.text(invoice.invoice_number || "FA-PRO", margin + 4, y + 12);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const issued = new Date(invoice.issued_at).toLocaleDateString("fr-FR");
    doc.text(`Date d'émission : ${issued}`, margin + 4, y + 18);
    if (invoice.due_date) {
      const due = new Date(invoice.due_date).toLocaleDateString("fr-FR");
      doc.text(`Échéance : ${due}`, margin + 4, y + 23);
    }
    if (commission > 0) {
      doc.text(`Commission partenaire : ${commission}%`, margin + 4, y + 28);
      doc.text(`Part cédée (facturée) : ${(sellerShare * 100).toFixed(0)}%`, margin + 4, y + 33);
    } else {
      doc.text(`Type : Vente directe B2B`, margin + 4, y + 28);
    }

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
    doc.setFont("helvetica", "bold");
    doc.text(partner?.name || "Partenaire", boxX2 + 4, y + 12);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    let cy = y + 17;
    if (partner?.siret) { doc.text(`SIRET : ${partner.siret}`, boxX2 + 4, cy); cy += 5; }
    if (partner?.vat_number) { doc.text(`TVA : ${partner.vat_number}`, boxX2 + 4, cy); cy += 5; }
    if (partner?.address_line1) { doc.text(partner.address_line1, boxX2 + 4, cy); cy += 5; }
    if (partner?.postal_code || partner?.city) {
      doc.text(`${partner?.postal_code || ""} ${partner?.city || ""}`.trim(), boxX2 + 4, cy);
    }

    y += boxH + 10;

    const isDeposit = commission > 0;
    const cDesig = margin + 2;
    const cFormat = margin + 78;
    const cQte = margin + 96;
    const cPuTTC = margin + 122;
    const cPvTTC = margin + 148;
    const cHT = margin + 168;
    const rightEdge = W - margin - 2;

    doc.setFillColor(...gold);
    doc.rect(margin, y, contentW, 8, "F");
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    if (isDeposit) {
      doc.text("DESIGNATION", cDesig, y + 5.5);
      doc.text("FORMAT", cFormat, y + 5.5, { align: "right" });
      doc.text("QTE", cQte, y + 5.5, { align: "right" });
      doc.text("PU TTC", cPuTTC, y + 5.5, { align: "right" });
      doc.text("PV TOTAL TTC", cPvTTC, y + 5.5, { align: "right" });
      doc.text("HT CEDE", cHT, y + 5.5, { align: "right" });
      doc.text("TTC CEDE", rightEdge, y + 5.5, { align: "right" });
    } else {
      // Direct B2B layout: Designation | Format | Qte | PU HT/g | Total HT | Total TTC
      doc.text("DESIGNATION", cDesig, y + 5.5);
      doc.text("FORMAT", cFormat, y + 5.5, { align: "right" });
      doc.text("QTE", cQte, y + 5.5, { align: "right" });
      doc.text("PU HT/g", cPuTTC, y + 5.5, { align: "right" });
      doc.text("TOTAL HT", cPvTTC + 6, y + 5.5, { align: "right" });
      doc.text("TOTAL TTC", rightEdge, y + 5.5, { align: "right" });
    }
    y += 10;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    let totalRetail = 0;
    let totalInvoicedTTC = 0;
    let rowIdx = 0;

    lines.forEach((line: any) => {
      if (y > 250) { doc.addPage(); y = margin; }
      const weight = line.weight_grams ? Number(line.weight_grams) : null;
      const qty = Number(line.quantity || 1);
      const retail = Number(line.retail_price_ttc || 0);
      const unitTTC = qty > 0 ? retail / qty : retail;
      const lineTotalTTC = isDeposit ? retail * sellerShare : retail;
      const lineHT = lineTotalTTC / (1 + TVA_RATE / 100);
      const totalGrams = weight && qty > 0 ? weight * qty : 0;
      const lineUnitHT = isDeposit
        ? (qty > 0 ? lineHT / qty : lineHT)
        : (totalGrams > 0 ? lineHT / totalGrams : lineHT);

      totalRetail += retail;
      totalInvoicedTTC += lineTotalTTC;

      if (rowIdx % 2 === 0) {
        doc.setFillColor(252, 250, 245);
        doc.rect(margin, y - 1, contentW, 8, "F");
      }
      rowIdx++;

      doc.setTextColor(...dark);
      doc.setFont("helvetica", "normal");
      doc.text(String(line.product_name).slice(0, 36), cDesig, y + 4);
      doc.text(weight ? `${weight} g` : "-", cFormat, y + 4, { align: "right" });
      doc.text(`x ${qty}`, cQte, y + 4, { align: "right" });
      if (isDeposit) {
        doc.text(`${unitTTC.toFixed(2)} EUR`, cPuTTC, y + 4, { align: "right" });
        doc.text(`${retail.toFixed(2)} EUR`, cPvTTC, y + 4, { align: "right" });
        doc.text(`${lineHT.toFixed(2)} EUR`, cHT, y + 4, { align: "right" });
      } else {
        doc.text(`${lineUnitHT.toFixed(2)} EUR`, cPuTTC, y + 4, { align: "right" });
        doc.text(`${lineHT.toFixed(2)} EUR`, cPvTTC + 6, y + 4, { align: "right" });
      }
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...gold);
      doc.text(`${lineTotalTTC.toFixed(2)} EUR`, rightEdge, y + 4, { align: "right" });
      doc.setTextColor(...dark);
      doc.setFont("helvetica", "normal");

      doc.setDrawColor(...lightGray);
      doc.setLineWidth(0.15);
      doc.line(margin, y + 7, W - margin, y + 7);
      y += 8;
    });

    const totalHT = totalInvoicedTTC / (1 + TVA_RATE / 100);
    const totalTVA = totalInvoicedTTC - totalHT;

    y += 4;
    doc.setDrawColor(...gold);
    doc.setLineWidth(0.6);
    doc.line(margin, y, W - margin, y);
    y += 6;

    const totalsX = W - margin - 5;
    const labelX = totalsX - 60;
    doc.setFontSize(10);
    doc.setTextColor(...dark);
    if (isDeposit) {
      doc.text("PV public total TTC (info) :", labelX, y, { align: "right" });
      doc.text(`${totalRetail.toFixed(2)} EUR`, totalsX, y, { align: "right" });
      y += 6;
      doc.text(`Part cédée (${(sellerShare * 100).toFixed(0)}%) HT :`, labelX, y, { align: "right" });
    } else {
      doc.text(`Total HT :`, labelX, y, { align: "right" });
    }
    doc.text(`${totalHT.toFixed(2)} EUR`, totalsX, y, { align: "right" });
    y += 6;
    doc.text(`TVA (${TVA_RATE}%) :`, labelX, y, { align: "right" });
    doc.text(`${totalTVA.toFixed(2)} EUR`, totalsX, y, { align: "right" });
    y += 4;
    doc.setDrawColor(...gold);
    doc.line(labelX - 10, y, totalsX + 2, y);
    y += 6;

    doc.setFontSize(14);
    doc.setTextColor(...gold);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL A REGLER TTC :", labelX, y, { align: "right" });
    doc.text(`${totalInvoicedTTC.toFixed(2)} EUR`, totalsX, y, { align: "right" });
    y += 12;

    // Update invoice totals in DB
    await supabase
      .from("pro_invoices")
      .update({
        total_retail_ttc: Number(totalRetail.toFixed(2)),
        total_invoiced_ht: Number(totalHT.toFixed(2)),
        total_vat: Number(totalTVA.toFixed(2)),
        total_invoiced_ttc: Number(totalInvoicedTTC.toFixed(2)),
      })
      .eq("id", invoiceId);

    doc.setFontSize(8);
    doc.setTextColor(...gray);
    doc.setFont("helvetica", "normal");
    doc.text(
      isDeposit
        ? "Vente B2B en contrat de revente. TVA acquittée sur les débits. Marchandise cédée à " +
            (sellerShare * 100).toFixed(0) + "% du PV public."
        : "Vente directe B2B entre professionnels. TVA acquittée sur les débits.",
      margin,
      y,
    );
    y += 5;
    doc.text(
      "Paiement à réception. Pas d'escompte pour règlement anticipé. Pénalités de retard : 3 fois le taux légal.",
      margin,
      y,
    );
    y += 10;

    doc.setDrawColor(221, 221, 221);
    doc.setLineWidth(0.2);
    doc.line(margin, y, W - margin, y);
    y += 6;
    doc.setFontSize(10);
    doc.setTextColor(...gold);
    doc.setFont("helvetica", "bold");
    doc.text("Merci pour votre confiance !", W / 2, y, { align: "center" });

    const pdfBase64 = doc.output("datauristring").split(",")[1];
    const pdfArrayBuffer = doc.output("arraybuffer");

    const filePath = `pro/${invoice.invoice_number}.pdf`;
    const { error: upErr } = await supabase.storage
      .from("invoices")
      .upload(filePath, new Uint8Array(pdfArrayBuffer), {
        contentType: "application/pdf",
        upsert: true,
      });
    if (upErr) console.error("Upload error:", upErr);

    await supabase
      .from("pro_invoices")
      .update({ pdf_path: filePath })
      .eq("id", invoiceId);

    return jsonResponse({
      success: true,
      pdfBase64,
      filePath,
      invoiceNumber: invoice.invoice_number,
    });
  } catch (e) {
    console.error("generate-pro-invoice error:", e);
    return jsonResponse({ error: "Internal error" }, 500);
  }
});
