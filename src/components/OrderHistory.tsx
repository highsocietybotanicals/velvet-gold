import { useState } from "react";
import { History, ChevronDown, ChevronUp, FileDown, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Order, ORDER_STATUS } from "@/hooks/useOrders";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { InkStamp } from "@/components/minuit/areas/profil/InkStamp";

// Habillage « carnet du membre » (espace Mon profil) : registre des commandes en tampons d'encre dorée.
// Styles dans src/components/minuit/areas/profil/profil.css. Téléchargement de facture et dépliage d'origine conservés.

interface OrderHistoryProps {
  orders: Order[];
}

const OrderHistoryItem = ({ order }: { order: Order }) => {
  const [expanded, setExpanded] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const statusInfo = ORDER_STATUS[order.status as keyof typeof ORDER_STATUS] || ORDER_STATUS.pending;

  const handleDownloadInvoice = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setDownloading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-invoice-pdf", {
        body: { orderId: order.id },
      });
      if (error) throw error;
      if (data?.pdfBase64) {
        const byteCharacters = atob(data.pdfBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = data.invoiceNumber ? `${data.invoiceNumber}.pdf` : `facture-${order.display_order_number || order.order_number}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Facture téléchargée !");
      }
    } catch (err) {
      console.error("Download invoice error:", err);
      toast.error("Erreur lors du téléchargement de la facture");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="pf-order" data-open={expanded ? "" : undefined}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="pf-order-btn"
        aria-expanded={expanded}
      >
        <InkStamp
          seed={order.id}
          day={format(new Date(order.created_at), "d MMM", { locale: fr })}
          year={format(new Date(order.created_at), "yyyy", { locale: fr })}
          amount={`${order.total_amount.toFixed(2)}€`}
          status={statusInfo.label}
          statusKey={order.status}
        />
        <span className="pf-order-info">
          <span className="pf-order-k">Commande</span>
          <span className="pf-order-n">{order.display_order_number || `#${order.order_number}`}</span>
          <span className="pf-order-date">
            {format(new Date(order.created_at), "d MMMM yyyy", { locale: fr })}
          </span>
          <span className="pf-order-st" data-status={order.status}>{statusInfo.label}</span>
          <span className="sr-only">{order.total_amount.toFixed(2)}€</span>
          <span className="pf-order-more" aria-hidden="true">
            {expanded ? "Refermer" : "Voir le détail"}
            {expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </span>
        </span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pf-ledger">
              <h3 className="pf-ledger-t">Détail de la commande</h3>
              {order.order_items && order.order_items.length > 0 ? (
                <div className="pf-ledger-lines">
                  {order.order_items.map((item) => (
                    <div key={item.id} className="pf-ledger-line">
                      <span className="pf-ledger-name">
                        {item.product_name}
                        {item.weight && ` (${item.weight}g)`}
                        {item.quantity && item.quantity > 1 && ` x${item.quantity}`}
                      </span>
                      <span className="pf-ledger-dots" aria-hidden="true" />
                      <span className="pf-ledger-px">{item.total_price.toFixed(2)}€</span>
                    </div>
                  ))}
                  <div className="pf-ledger-total">
                    <span>Total</span>
                    <span className="pf-ledger-sum">{order.total_amount.toFixed(2)}€</span>
                  </div>
                  {order.payment_status === "paid" && (
                    <div className="pf-ledger-act">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadInvoice}
                        disabled={downloading}
                        className="pf-btn-line pf-btn-wide"
                      >
                        {downloading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <FileDown className="h-4 w-4 mr-2" />
                        )}
                        Télécharger la facture
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="pf-ledger-empty">Aucun détail disponible</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const OrderHistory = ({ orders }: OrderHistoryProps) => {
  if (orders.length === 0) {
    return (
      <section className="pf-page pf-registre" data-pf-reveal="" aria-labelledby="pf-reg-t">
        <header className="pf-page-head">
          <p className="pf-kick">
            <History className="w-4 h-4" aria-hidden="true" />
            <span>Registre</span>
          </p>
          <h2 id="pf-reg-t" className="pf-h2">Historique des Commandes</h2>
        </header>
        <p className="pf-reg-empty">
          Aucune commande passée pour le moment
        </p>
      </section>
    );
  }

  return (
    <section className="pf-page pf-registre" data-pf-reveal="" aria-labelledby="pf-reg-t">
      <header className="pf-page-head">
        <p className="pf-kick">
          <History className="w-4 h-4" aria-hidden="true" />
          <span>Registre</span>
        </p>
        <h2 id="pf-reg-t" className="pf-h2">Historique des Commandes</h2>
      </header>

      <div className="pf-orders">
        {orders.map((order) => (
          <OrderHistoryItem key={order.id} order={order} />
        ))}
      </div>
    </section>
  );
};

export default OrderHistory;
