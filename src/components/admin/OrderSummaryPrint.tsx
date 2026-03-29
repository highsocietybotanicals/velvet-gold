import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface OrderItem {
  product_name: string;
  product_type: string;
  weight: number | null;
  quantity: number | null;
  unit_price: number;
  total_price: number;
}

interface OrderSummaryPrintProps {
  order: {
    display_order_number?: string | null;
    order_number: number;
    guest_name?: string | null;
    guest_email?: string | null;
    guest_phone?: string | null;
    delivery_address?: string | null;
    delivery_type: string;
    contact_phone?: string | null;
    user_email?: string;
    total_amount: number;
    created_at: string;
    payment_status?: string;
    order_items?: OrderItem[];
    promo_code?: string;
    promo_discount_percent?: number;
    promo_discount_amount?: number;
    relay_point_name?: string | null;
    relay_point_address?: string | null;
  };
}

const TVA_RATE = 20;

const esc = (s: string) =>
  s.replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

const OrderSummaryPrint = ({ order }: OrderSummaryPrintProps) => {
  const name = esc(order.guest_name || "Client");
  const phone = esc(order.contact_phone || order.guest_phone || "");
  const email = esc(order.guest_email || order.user_email || "");
  const address = esc(order.delivery_address || "");
  const orderNum = esc(order.display_order_number || `#${order.order_number.toString().padStart(4, "0")}`);
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

  const items = order.order_items || [];
  const subtotalTTC = items.reduce((sum, item) => sum + Number(item.total_price || 0), 0);
  const totalTTC = Number(order.total_amount || 0);
  const promoDiscountAmount = Math.max(
    0,
    Number(order.promo_discount_amount ?? Math.max(0, subtotalTTC - totalTTC))
  );
  const totalHT = totalTTC / (1 + TVA_RATE / 100);
  const totalTVA = totalTTC - totalHT;
  const paymentBadge =
    order.payment_status === "paid"
      ? { label: "✅ PAYÉE", background: "#e8f5e9", color: "#2e7d32" }
      : { label: "⏳ EN ATTENTE DE PAIEMENT", background: "#fff3cd", color: "#856404" };

  const itemsHtml = items
    .map((item) => {
      const qty = item.weight ? `${item.weight}g` : `x${item.quantity}`;
      const unitHT = Number(item.unit_price || 0) / (1 + TVA_RATE / 100);
      const totalItemHT = Number(item.total_price || 0) / (1 + TVA_RATE / 100);

      return `<tr>
        <td style="padding:3mm 2mm;border-bottom:0.5px solid #ddd;font-size:9pt">${esc(item.product_name)}</td>
        <td style="padding:3mm 2mm;border-bottom:0.5px solid #ddd;font-size:9pt;text-align:center">${qty}</td>
        <td style="padding:3mm 2mm;border-bottom:0.5px solid #ddd;font-size:9pt;text-align:right">${unitHT.toFixed(2)} €</td>
        <td style="padding:3mm 2mm;border-bottom:0.5px solid #ddd;font-size:9pt;text-align:right">${TVA_RATE}%</td>
        <td style="padding:3mm 2mm;border-bottom:0.5px solid #ddd;font-size:9pt;text-align:right;font-weight:600">${totalItemHT.toFixed(2)} €</td>
      </tr>`;
    })
    .join("");

  const handlePrint = () => {
    const w = window.open("", "_blank", "width=700,height=900");
    if (!w) return;

    w.document.write(`<!DOCTYPE html><html><head>
      <title>Facture ${invoiceNum}</title>
      <style>
        @page { size: A4; margin: 15mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #222; background: #fff; padding: 15mm; font-size: 10pt; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8mm; padding-bottom: 5mm; border-bottom: 3px solid #b8860b; }
        .brand { font-size: 16pt; font-weight: bold; color: #b8860b; letter-spacing: 1px; }
        .brand-sub { font-size: 8pt; color: #666; margin-top: 1mm; }
        .company-info { font-size: 8pt; color: #555; text-align: right; line-height: 1.6; }
        .company-info strong { color: #333; }
        .invoice-title { font-size: 18pt; font-weight: bold; color: #b8860b; text-align: center; margin: 6mm 0; letter-spacing: 2px; }
        .meta-row { display: flex; justify-content: space-between; gap: 4%; margin-bottom: 8mm; }
        .meta-box { background: #f9f7f3; border: 1px solid #e8e0d0; border-radius: 4px; padding: 4mm; width: 48%; }
        .meta-box h3 { font-size: 7pt; text-transform: uppercase; color: #b8860b; margin-bottom: 2mm; letter-spacing: 1px; }
        .meta-box p { font-size: 9pt; line-height: 1.5; color: #333; }
        .meta-box .highlight { font-weight: bold; font-size: 10pt; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 5mm; }
        thead th { font-size: 7pt; text-transform: uppercase; color: #fff; background: #b8860b; padding: 2.5mm 2mm; text-align: left; }
        thead th:nth-child(2) { text-align: center; }
        thead th:nth-child(3), thead th:nth-child(4), thead th:nth-child(5) { text-align: right; }
        .totals { margin-top: 3mm; border-top: 2px solid #b8860b; padding-top: 4mm; }
        .totals-row { display: flex; justify-content: flex-end; gap: 10mm; font-size: 10pt; padding: 1mm 0; }
        .totals-row.grand { font-size: 14pt; font-weight: bold; color: #b8860b; border-top: 1px solid #b8860b; padding-top: 3mm; margin-top: 2mm; }
        .totals-row .label { min-width: 46mm; text-align: right; }
        .totals-row .value { min-width: 28mm; text-align: right; }
        .payment-badge { display: inline-block; padding: 2mm 4mm; border-radius: 4px; font-size: 9pt; font-weight: 600; margin-top: 4mm; }
        .footer { text-align: center; font-size: 7pt; color: #999; border-top: 1px solid #ddd; padding-top: 4mm; margin-top: 10mm; line-height: 1.6; }
        .footer .thanks { font-size: 10pt; color: #b8860b; font-weight: 600; margin-bottom: 2mm; }
        .legal { font-size: 7pt; color: #888; margin-top: 4mm; text-align: center; line-height: 1.5; }
      </style>
    </head><body>
      <div class="header">
        <div>
          <div class="brand">HIGH SOCIETY BOTANICALS</div>
          <div class="brand-sub">highsocietybotanicals.com</div>
        </div>
        <div class="company-info">
          <strong>High Society Botanicals</strong><br/>
          SIRET : 994 621 910 00011<br/>
          TVA Intra. : FR 48 994 621 910<br/>
          France
        </div>
      </div>

      <div class="invoice-title">FACTURE</div>

      <div class="meta-row">
        <div class="meta-box">
          <h3>Informations facture</h3>
          <p>
            <span class="highlight">${invoiceNum}</span><br/>
            Commande : ${orderNum}<br/>
            Date : ${date}<br/>
            Mode : ${delivery}
          </p>
        </div>
        <div class="meta-box">
          <h3>Client</h3>
          <p>
            <span class="highlight">${name}</span><br/>
            ${email ? `${email}<br/>` : ""}
            ${phone ? `Tél : ${phone}<br/>` : ""}
            ${address ? `${address}<br/>` : ""}
            ${order.relay_point_name ? `Point Relais : ${esc(order.relay_point_name)}${order.relay_point_address ? ` — ${esc(order.relay_point_address)}` : ""}` : ""}
          </p>
        </div>
      </div>

      <table>
        <thead><tr><th>Désignation</th><th>Quantité</th><th>Prix unit. HT</th><th>TVA</th><th>Total HT</th></tr></thead>
        <tbody>${itemsHtml}</tbody>
      </table>

      <div class="totals">
        <div class="totals-row"><span class="label">Sous-total TTC :</span><span class="value">${subtotalTTC.toFixed(2)} €</span></div>
        ${order.promo_code ? `<div class="totals-row" style="color:#b8860b;font-weight:600;"><span class="label">Code promo ${esc(order.promo_code)}${order.promo_discount_percent ? ` (-${order.promo_discount_percent}%)` : ""} :</span><span class="value">-${promoDiscountAmount.toFixed(2)} €</span></div>` : ""}
        <div class="totals-row"><span class="label">Total HT :</span><span class="value">${totalHT.toFixed(2)} €</span></div>
        <div class="totals-row"><span class="label">TVA (${TVA_RATE}%) :</span><span class="value">${totalTVA.toFixed(2)} €</span></div>
        <div class="totals-row grand"><span class="label">TOTAL TTC :</span><span class="value">${totalTTC.toFixed(2)} €</span></div>
      </div>

      <div class="payment-badge" style="background:${paymentBadge.background};color:${paymentBadge.color};">${paymentBadge.label}</div>

      <div class="legal">
        High Society Botanicals — SIRET : 994 621 910 00011 — TVA Intra. : FR 48 994 621 910
      </div>

      <div class="footer">
        <div class="thanks">Merci pour votre confiance ! 🌿</div>
        <div>High Society Botanicals — France — highsocietybotanicals.com</div>
      </div>
    </body></html>`);

    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 250);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handlePrint}
      className="border-primary/30 text-primary hover:bg-primary/10"
      title="Imprimer la facture"
    >
      <Printer className="h-4 w-4" />
    </Button>
  );
};

export default OrderSummaryPrint;
