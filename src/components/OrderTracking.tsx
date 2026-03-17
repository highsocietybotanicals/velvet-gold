import { Package, CheckCircle, Truck, MapPin, Clock, Send } from "lucide-react";
import { motion } from "framer-motion";
import { Order, ORDER_STATUS } from "@/hooks/useOrders";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface OrderTrackingProps {
  order: Order;
}

const STEPS = [
  { key: "pending", icon: Clock, label: "Reçue" },
  { key: "preparing", icon: Package, label: "Préparation" },
  { key: "shipped", icon: Send, label: "Expédiée" },
  { key: "in_delivery", icon: Truck, label: "En livraison" },
  { key: "delivered", icon: CheckCircle, label: "Livrée" },
];

const getStepIndex = (status: string) => {
  const index = STEPS.findIndex((s) => s.key === status);
  return index >= 0 ? index : 0;
};

const OrderTracking = ({ order }: OrderTrackingProps) => {
  const currentStep = getStepIndex(order.status);
  const statusInfo = ORDER_STATUS[order.status as keyof typeof ORDER_STATUS] || ORDER_STATUS.pending;
  const history = order.status_history || [];

  // Get timestamp for a specific status from history
  const getStatusTime = (statusKey: string): string | null => {
    const entry = history.find((h) => h.new_status === statusKey);
    if (!entry) return null;
    return format(new Date(entry.created_at), "d MMM à HH:mm", { locale: fr });
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-primary" />
          <h2 className="font-display text-lg text-foreground">Commande en cours</h2>
        </div>
        <span className="text-sm text-muted-foreground">{order.display_order_number || `#${order.order_number}`}</span>
      </div>

      {/* Status badge */}
      <div className="flex items-center gap-2 mb-6">
        <span className={`text-sm font-medium ${statusInfo.color}`}>
          {statusInfo.label}
        </span>
        {order.delivery_date && (
          <span className="text-sm text-muted-foreground">
            • Livraison prévue le {format(new Date(order.delivery_date), "d MMMM", { locale: fr })}
            {order.delivery_time && ` (${order.delivery_time})`}
          </span>
        )}
      </div>

      {/* Progress steps */}
      <div className="relative">
        {/* Line */}
        <div className="absolute top-5 left-5 right-5 h-0.5 bg-muted" />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute top-5 left-5 h-0.5 bg-primary"
          style={{ maxWidth: "calc(100% - 40px)" }}
        />

        {/* Steps */}
        <div className="relative flex justify-between">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = index <= currentStep;
            const isCurrent = index === currentStep;
            const timestamp = getStatusTime(step.key);

            return (
              <div key={step.key} className="flex flex-col items-center">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: isCurrent ? 1.1 : 1 }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                    isActive
                      ? "bg-primary border-primary text-primary-foreground"
                      : "bg-muted border-muted-foreground/30 text-muted-foreground"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </motion.div>
                <span
                  className={`mt-2 text-xs text-center ${
                    isActive ? "text-foreground font-medium" : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
                {timestamp && (
                  <span className="text-[10px] text-muted-foreground mt-0.5">
                    {timestamp}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tracking info */}
      {(order as any).tracking_number && (
        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex items-center gap-2 mb-2">
            <Truck className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Suivi Colissimo</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-mono text-muted-foreground">{(order as any).tracking_number}</span>
            <a
              href={(order as any).tracking_url || `https://www.laposte.fr/outils/suivre-vos-envois?code=${(order as any).tracking_number}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              Suivre mon colis
              <MapPin className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {/* Delivery info */}
      {order.delivery_type && (
        <div className="mt-4 pt-4 border-t border-border flex items-start gap-2">
          <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
          <div className="text-sm">
            <span className="text-muted-foreground">
              {order.delivery_type === "postal" ? "Livraison postale" : order.delivery_type === "personal" ? "Remise en main propre" : order.delivery_type}
            </span>
            {order.delivery_address && (
              <p className="text-foreground mt-1">{order.delivery_address}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTracking;
