import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface ShippingLabelProps {
  order: {
    display_order_number?: string | null;
    order_number: number;
    guest_name?: string | null;
    guest_email?: string | null;
    guest_phone?: string | null;
    delivery_address?: string | null;
    contact_phone?: string | null;
    user_email?: string;
  };
}

const SENDER = {
  name: "High Society Botanicals",
  address: "44390 Puceul",
  country: "France",
};

const escHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
   .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const ShippingLabel = ({ order }: ShippingLabelProps) => {
  const labelRef = useRef<HTMLDivElement>(null);

  const recipientName = escHtml(order.guest_name || "Client");
  const recipientPhone = escHtml(order.contact_phone || order.guest_phone || "");
  const recipientEmail = escHtml(order.guest_email || order.user_email || "");
  const recipientAddress = escHtml(order.delivery_address || "Adresse non renseignée");
  const orderNumber = escHtml(order.display_order_number || `#${order.order_number.toString().padStart(4, "0")}`);

  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=600,height=400");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Étiquette ${orderNumber}</title>
        <style>
          @page { size: 100mm 150mm; margin: 0; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: Arial, Helvetica, sans-serif; 
            width: 100mm; 
            height: 150mm; 
            padding: 5mm;
            display: flex;
            flex-direction: column;
          }
          .sender {
            font-size: 9pt;
            color: #666;
            border-bottom: 1px solid #ccc;
            padding-bottom: 3mm;
            margin-bottom: 4mm;
          }
          .sender .name { font-weight: bold; color: #333; }
          .recipient {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            padding: 2mm 0;
          }
          .recipient .name {
            font-size: 16pt;
            font-weight: bold;
            margin-bottom: 3mm;
          }
          .recipient .address {
            font-size: 12pt;
            line-height: 1.5;
            white-space: pre-line;
          }
          .recipient .phone {
            font-size: 10pt;
            color: #444;
            margin-top: 3mm;
          }
          .footer {
            border-top: 2px solid #000;
            padding-top: 3mm;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 9pt;
          }
          .footer .order {
            font-weight: bold;
            font-size: 11pt;
            font-family: monospace;
          }
        </style>
      </head>
      <body>
        <div class="sender">
          <div class="name">${SENDER.name}</div>
          <div>${SENDER.address}</div>
        </div>
        <div class="recipient">
          <div class="name">${recipientName}</div>
          <div class="address">${recipientAddress}</div>
          ${recipientPhone ? `<div class="phone">📞 ${recipientPhone}</div>` : ""}
          ${recipientEmail ? `<div class="phone">✉ ${recipientEmail}</div>` : ""}
        </div>
        <div class="footer">
          <span class="order">${orderNumber}</span>
          <span>HSB</span>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 250);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handlePrint}
      className="border-primary/30 text-primary hover:bg-primary/10"
      title="Imprimer étiquette"
    >
      <Printer className="h-4 w-4" />
    </Button>
  );
};

export default ShippingLabel;
