import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsPDF } from "https://esm.sh/jspdf@2.5.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TVA_RATE = 20;

function esc(s: string): string {
  return s || "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId } = await req.json();
    if (!orderId) {
      return new Response(JSON.stringify({ error: "Missing orderId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch order items
    const { data: items } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId);

    // Fetch profile if user_id
    let profile = null;
    if (order.user_id) {
      const { data: p } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", order.user_id)
        .single();
      profile = p;
    }

    const orderItems = items || [];
    const name = profile?.full_name || order.guest_name || "Client";
    const phone = order.contact_phone || order.guest_phone || "";
    const email = profile?.email || order.guest_email || "";
    const address = order.delivery_address || "";
    const orderNum = order.display_order_number || `HSB-${String(order.order_number).padStart(6, "0")}`;
    const invoiceNum = `FA-${orderNum.replace("HSB-", "")}`;
    const date = new Date(order.created_at).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const delivery =
      order.delivery_type === "personal"
        ? "Remise en main propre"
        : order.delivery_type === "relay"
          ? "Point Relais Colissimo"
          : "Envoi postal";

    const billedItems = orderItems.filter((i: any) => i.product_type !== "sample" && i.product_type !== "gift");
    const subtotalTTC = billedItems.reduce((sum: number, i: any) => sum + Number(i.total_price || 0), 0);
    const totalTTC = Number(order.total_amount || 0);
    const promoDiscountAmount = Math.max(0, Number(order.promo_discount_amount ?? Math.max(0, subtotalTTC - totalTTC)));
    const totalHT = totalTTC / (1 + TVA_RATE / 100);
    const totalTVA = totalTTC - totalHT;

    const paymentLabel = order.payment_status === "paid" ? "PAYEE" : "EN ATTENTE";

    // Generate PDF with jsPDF (A4)
    const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const W = 210;
    const margin = 15;
    const contentW = W - 2 * margin;
    let y = margin;

    // Colors
    const gold = [184, 134, 11];
    const dark = [34, 34, 34];
    const gray = [102, 102, 102];
    const lightGray = [200, 200, 200];

    // Header
    doc.setFontSize(18);
    doc.setTextColor(...gold);
    doc.setFont("helvetica", "bold");
    doc.text("HIGH SOCIETY BOTANICALS", margin, y + 6);
    doc.setFontSize(8);
    doc.setTextColor(...gray);
    doc.setFont("helvetica", "normal");
    doc.text("highsocietybotanicals.com", margin, y + 12);

    // Company info right
    doc.setFontSize(8);
    doc.setTextColor(...gray);
    const companyLines = [
      "High Society Botanicals",
      "SIRET : 994 621 910 00011",
      "TVA Intra. : FR 48 994 621 910",
      "France",
    ];
    companyLines.forEach((line, i) => {
      doc.text(line, W - margin, y + 4 + i * 4, { align: "right" });
    });

    y += 20;
    // Gold line
    doc.setDrawColor(...gold);
    doc.setLineWidth(0.8);
    doc.line(margin, y, W - margin, y);
    y += 8;

    // FACTURE title
    doc.setFontSize(20);
    doc.setTextColor(...gold);
    doc.setFont("helvetica", "bold");
    doc.text("FACTURE", W / 2, y, { align: "center" });
    y += 12;

    // Meta boxes
    const boxH = 32;
    const boxW = contentW / 2 - 3;

    // Invoice info box
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
    doc.text(invoiceNum, margin + 4, y + 12);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Commande : ${orderNum}`, margin + 4, y + 17);
    doc.text(`Date : ${date}`, margin + 4, y + 22);
    doc.text(`Mode : ${delivery}`, margin + 4, y + 27);

    // Client box
    const boxX2 = margin + boxW + 6;
    doc.setFillColor(249, 247, 243);
    doc.setDrawColor(232, 224, 208);
    doc.roundedRect(boxX2, y, boxW, boxH, 2, 2, "FD");

    doc.setFontSize(7);
    doc.setTextColor(...gold);
    doc.setFont("helvetica", "bold");
    doc.text("CLIENT", boxX2 + 4, y + 6);

    doc.setFontSize(10);
    doc.setTextColor(...dark);
    doc.setFont("helvetica", "bold");
    doc.text(esc(name), boxX2 + 4, y + 12);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    let clientY = y + 17;
    if (email) { doc.text(email, boxX2 + 4, clientY); clientY += 5; }
    if (phone) { doc.text(`Tel : ${phone}`, boxX2 + 4, clientY); clientY += 5; }
    if (address) { doc.text(address, boxX2 + 4, clientY); }

    y += boxH + 10;

    // Table header
    const colX = [margin, margin + 75, margin + 110, margin + 135, margin + 160];
    const colLabels = ["Designation", "Quantite", "Prix unit. HT", "TVA", "Total HT"];

    doc.setFillColor(...gold);
    doc.rect(margin, y, contentW, 8, "F");
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    colLabels.forEach((label, i) => {
      const align = i === 0 ? "left" : "right";
      const x = i === 0 ? colX[i] + 2 : colX[i] + (i < 4 ? 20 : 18);
      doc.text(label.toUpperCase(), x, y + 5.5, { align });
    });
    y += 10;

    // Table rows
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    billedItems.forEach((item: any) => {
      if (y > 260) {
        doc.addPage();
        y = margin;
      }
      const qty = item.weight ? `${item.weight}g` : `x${item.quantity || 1}`;
      const unitHT = Number(item.unit_price || 0) / (1 + TVA_RATE / 100);
      const totalItemHT = Number(item.total_price || 0) / (1 + TVA_RATE / 100);

      doc.setTextColor(...dark);
      doc.text(esc(item.product_name), colX[0] + 2, y + 4);
      doc.text(qty, colX[1] + 20, y + 4, { align: "right" });
      doc.text(`${unitHT.toFixed(2)} EUR`, colX[2] + 20, y + 4, { align: "right" });
      doc.text(`${TVA_RATE}%`, colX[3] + 20, y + 4, { align: "right" });
      doc.setFont("helvetica", "bold");
      doc.text(`${totalItemHT.toFixed(2)} EUR`, colX[4] + 18, y + 4, { align: "right" });
      doc.setFont("helvetica", "normal");

      // separator
      doc.setDrawColor(...lightGray);
      doc.setLineWidth(0.2);
      doc.line(margin, y + 7, W - margin, y + 7);
      y += 9;
    });

    y += 4;
    // Totals
    doc.setDrawColor(...gold);
    doc.setLineWidth(0.6);
    doc.line(margin, y, W - margin, y);
    y += 6;

    const totalsX = W - margin - 10;
    const labelX = totalsX - 55;

    doc.setFontSize(10);
    doc.setTextColor(...dark);
    doc.setFont("helvetica", "normal");
    doc.text("Sous-total TTC :", labelX, y, { align: "right" });
    doc.text(`${subtotalTTC.toFixed(2)} EUR`, totalsX, y, { align: "right" });
    y += 6;

    if (order.promo_code) {
      doc.setTextColor(...gold);
      doc.setFont("helvetica", "bold");
      const promoLabel = `Code promo ${order.promo_code}${order.promo_discount_percent ? ` (-${order.promo_discount_percent}%)` : ""} :`;
      doc.text(promoLabel, labelX, y, { align: "right" });
      doc.text(`-${promoDiscountAmount.toFixed(2)} EUR`, totalsX, y, { align: "right" });
      doc.setFont("helvetica", "normal");
      y += 6;
    }

    doc.setTextColor(...dark);
    doc.text("Total HT :", labelX, y, { align: "right" });
    doc.text(`${totalHT.toFixed(2)} EUR`, totalsX, y, { align: "right" });
    y += 6;

    doc.text(`TVA (${TVA_RATE}%) :`, labelX, y, { align: "right" });
    doc.text(`${totalTVA.toFixed(2)} EUR`, totalsX, y, { align: "right" });
    y += 4;

    doc.setDrawColor(...gold);
    doc.setLineWidth(0.3);
    doc.line(labelX - 10, y, totalsX + 2, y);
    y += 6;

    doc.setFontSize(14);
    doc.setTextColor(...gold);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL TTC :", labelX, y, { align: "right" });
    doc.text(`${totalTTC.toFixed(2)} EUR`, totalsX, y, { align: "right" });
    y += 10;

    // Payment badge
    if (order.payment_status === "paid") {
      doc.setFillColor(232, 245, 233);
      doc.roundedRect(margin, y, 60, 8, 2, 2, "F");
      doc.setFontSize(9);
      doc.setTextColor(46, 125, 50);
      doc.setFont("helvetica", "bold");
      doc.text("PAYEE", margin + 30, y + 5.5, { align: "center" });
    } else {
      doc.setFillColor(255, 243, 205);
      doc.roundedRect(margin, y, 72, 8, 2, 2, "F");
      doc.setFontSize(9);
      doc.setTextColor(133, 100, 4);
      doc.setFont("helvetica", "bold");
      doc.text("EN ATTENTE DE PAIEMENT", margin + 36, y + 5.5, { align: "center" });
    }

    y += 16;

    // Legal
    doc.setFontSize(7);
    doc.setTextColor(136, 136, 136);
    doc.setFont("helvetica", "normal");
    doc.text(
      "High Society Botanicals — SIRET : 994 621 910 00011 — TVA Intra. : FR 48 994 621 910",
      W / 2,
      y,
      { align: "center" }
    );
    y += 8;

    // Footer
    doc.setDrawColor(221, 221, 221);
    doc.setLineWidth(0.2);
    doc.line(margin, y, W - margin, y);
    y += 6;
    doc.setFontSize(10);
    doc.setTextColor(...gold);
    doc.setFont("helvetica", "bold");
    doc.text("Merci pour votre confiance !", W / 2, y, { align: "center" });
    y += 5;
    doc.setFontSize(8);
    doc.setTextColor(...gray);
    doc.setFont("helvetica", "normal");
    doc.text("High Society Botanicals — France — highsocietybotanicals.com", W / 2, y, { align: "center" });

    // Get PDF as base64
    const pdfBase64 = doc.output("datauristring").split(",")[1];
    const pdfArrayBuffer = doc.output("arraybuffer");

    // Store in Supabase Storage
    const userId = order.user_id || "guest";
    const filePath = `${userId}/${invoiceNum}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from("invoices")
      .upload(filePath, new Uint8Array(pdfArrayBuffer), {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        pdfBase64,
        filePath,
        invoiceNumber: invoiceNum,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Generate invoice error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
