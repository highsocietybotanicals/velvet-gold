import { useState } from "react";
import { History, ChevronDown, ChevronUp, Package, FileDown, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Order, ORDER_STATUS } from "@/hooks/useOrders";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface OrderHistoryProps {
  orders: Order[];
}

const OrderHistoryItem = ({ order }: { order: Order }) => {
  const [expanded, setExpanded] = useState(false);
  const statusInfo = ORDER_STATUS[order.status as keyof typeof ORDER_STATUS] || ORDER_STATUS.pending;

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <Package className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="text-left">
            <p className="font-medium text-foreground">Commande {order.display_order_number || `#${order.order_number}`}</p>
            <p className="text-sm text-muted-foreground">
              {format(new Date(order.created_at), "d MMMM yyyy", { locale: fr })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="font-medium text-primary">{order.total_amount.toFixed(2)}€</p>
            <p className={`text-sm ${statusInfo.color}`}>{statusInfo.label}</p>
          </div>
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
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
            <div className="p-4 pt-0 border-t border-border bg-muted/30">
              <h4 className="text-sm font-medium text-foreground mb-3">Détail de la commande</h4>
              {order.order_items && order.order_items.length > 0 ? (
                <div className="space-y-2">
                  {order.order_items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.product_name}
                        {item.weight && ` (${item.weight}g)`}
                        {item.quantity && item.quantity > 1 && ` x${item.quantity}`}
                      </span>
                      <span className="text-foreground">{item.total_price.toFixed(2)}€</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-border flex justify-between font-medium">
                    <span className="text-foreground">Total</span>
                    <span className="text-primary">{order.total_amount.toFixed(2)}€</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Aucun détail disponible</p>
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
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-5 h-5 text-primary" />
          <h2 className="font-display text-lg text-foreground">Historique des Commandes</h2>
        </div>
        <p className="text-muted-foreground text-center py-8">
          Aucune commande passée pour le moment
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <History className="w-5 h-5 text-primary" />
        <h2 className="font-display text-lg text-foreground">Historique des Commandes</h2>
      </div>

      <div className="space-y-3">
        {orders.map((order) => (
          <OrderHistoryItem key={order.id} order={order} />
        ))}
      </div>
    </div>
  );
};

export default OrderHistory;
