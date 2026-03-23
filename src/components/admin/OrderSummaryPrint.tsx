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
    order_items?: OrderItem[];
    promo_code?: string;
    promo_discount_percent?: number;
    promo_discount_amount?: number;
  };
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;")
   .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const OrderSummaryPrint = ({ order }: OrderSummaryPrintProps) => {
  const name = esc(order.guest_name || "Client");
  const phone = esc(order.contact_phone || order.guest_phone || "");
  const email = esc(order.guest_email || order.user_email || "");
  const address = esc(order.delivery_address || "—");
  const orderNum = esc(order.display_order_number || `#${order.order_number.toString().padStart(4, "0")}`);
  const date = new Date(order.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const delivery = order.delivery_type === "personal" ? "Remise en main propre" : "Envoi postal";

  const itemsHtml = (order.order_items || []).map(item => {
    const qty = item.weight ? `${item.weight}g` : `x${item.quantity}`;
    return `<tr>
      <td style="padding:2mm 1mm;border-bottom:0.5px solid #ddd;font-size:8pt">${esc(item.product_name)}</td>
      <td style="padding:2mm 1mm;border-bottom:0.5px solid #ddd;font-size:8pt;text-align:center">${qty}</td>
      <td style="padding:2mm 1mm;border-bottom:0.5px solid #ddd;font-size:8pt;text-align:right">${item.unit_price.toFixed(2)}€</td>
      <td style="padding:2mm 1mm;border-bottom:0.5px solid #ddd;font-size:8pt;text-align:right;font-weight:600">${item.total_price.toFixed(2)}€</td>
    </tr>`;
  }).join("");

  const handlePrint = () => {
    const w = window.open("", "_blank", "width=500,height=700");
    if (!w) return;

    w.document.write(`<!DOCTYPE html><html><head>
      <title>Commande ${orderNum}</title>
      <style>
        @page { size: 100mm 150mm; margin: 0; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, Helvetica, sans-serif; width: 100mm; height: 150mm; padding: 4mm; display: flex; flex-direction: column; color: #222; }
        .header { text-align: center; border-bottom: 1.5px solid #b8860b; padding-bottom: 2.5mm; margin-bottom: 2.5mm; }
        .header .brand { font-size: 11pt; font-weight: bold; color: #b8860b; letter-spacing: 0.5px; }
        .header .sub { font-size: 7pt; color: #888; margin-top: 0.5mm; }
        .order-info { display: flex; justify-content: space-between; font-size: 7.5pt; color: #555; margin-bottom: 2mm; padding-bottom: 1.5mm; border-bottom: 0.5px solid #ddd; }
        .order-info .num { font-weight: bold; font-size: 9pt; color: #222; font-family: monospace; }
        .client { font-size: 8pt; margin-bottom: 2mm; padding-bottom: 1.5mm; border-bottom: 0.5px solid #ddd; }
        .client .cname { font-weight: bold; font-size: 9pt; }
        .client div { margin-top: 0.5mm; }
        .client .label { color: #888; font-size: 7pt; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 2mm; }
        thead th { font-size: 7pt; text-transform: uppercase; color: #888; border-bottom: 1px solid #b8860b; padding: 1mm 1mm 1.5mm; text-align: left; }
        thead th:nth-child(2) { text-align: center; }
        thead th:nth-child(3), thead th:nth-child(4) { text-align: right; }
        .total-row { border-top: 1.5px solid #b8860b; padding-top: 1.5mm; display: flex; justify-content: space-between; align-items: center; font-size: 10pt; font-weight: bold; }
        .total-row .amount { color: #b8860b; font-size: 12pt; }
        .footer { margin-top: auto; text-align: center; font-size: 7pt; color: #888; border-top: 0.5px solid #ddd; padding-top: 2mm; }
        .footer .thanks { font-size: 8pt; color: #b8860b; font-weight: 600; margin-bottom: 1mm; }
      </style>
    </head><body>
      <div class="header">
        <div class="brand">HIGH SOCIETY BOTANICALS</div>
        <div class="sub">highsocietybotanicals.com — France</div>
      </div>

      <div class="order-info">
        <div><span class="num">${orderNum}</span></div>
        <div>${date}</div>
      </div>

      <div class="client">
        <div class="cname">${name}</div>
        ${address !== "—" ? `<div><span class="label">Adresse :</span> ${address}</div>` : ""}
        ${phone ? `<div><span class="label">Tél :</span> ${phone}</div>` : ""}
        ${email ? `<div><span class="label">Email :</span> ${email}</div>` : ""}
        <div><span class="label">Livraison :</span> ${delivery}</div>
      </div>

      <table>
        <thead><tr>
          <th>Produit</th><th>Qté</th><th>P.U.</th><th>Total</th>
        </tr></thead>
        <tbody>${itemsHtml}</tbody>
      </table>

      ${order.promo_code ? `
      <div style="font-size:8pt;margin-bottom:2mm;">
        <div style="display:flex;justify-content:space-between;margin-bottom:1mm;">
          <span>Sous-total</span>
          <span>${(order.total_amount + (order.promo_discount_amount || 0)).toFixed(2)}€</span>
        </div>
        <div style="display:flex;justify-content:space-between;color:#b8860b;font-weight:600;">
          <span>Code ${esc(order.promo_code)} (${order.promo_discount_percent ? `-${order.promo_discount_percent}%` : 'promo'})</span>
          <span>-${(order.promo_discount_amount || 0).toFixed(2)}€</span>
        </div>
      </div>
      ` : ''}

      <div class="total-row">
        <span>TOTAL</span>
        <span class="amount">${order.total_amount.toFixed(2)}€</span>
      </div>

      <div class="footer">
        <div class="thanks">Merci pour votre commande ! 🌿</div>
        <div>High Society Botanicals — highsocietybotanicals.com</div>
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
      title="Imprimer bon de commande"
    >
      <Printer className="h-4 w-4" />
    </Button>
  );
};

export default OrderSummaryPrint;
