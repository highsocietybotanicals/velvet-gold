import { Package, CheckCircle, Truck, MapPin, Clock, Send } from "lucide-react";
import { motion } from "framer-motion";
import { Order, ORDER_STATUS } from "@/hooks/useOrders";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// Habillage « carnet du membre » (espace Mon profil) : bordereau de la commande en cours, fil d'or des étapes.
// Styles dans src/components/minuit/areas/profil/profil.css. Données et calculs d'origine conservés.

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
    <section className="pf-page pf-track" data-pf-reveal="" aria-labelledby="pf-track-t">
      <header className="pf-page-head pf-track-head">
        <div>
          <p className="pf-kick">
            <Package className="w-4 h-4" aria-hidden="true" />
            <span>Bordereau</span>
          </p>
          <h2 id="pf-track-t" className="pf-h2">Commande en cours</h2>
        </div>
        <span className="pf-docket">{order.display_order_number || `#${order.order_number}`}</span>
      </header>

      {/* Status badge */}
      <div className="pf-track-status">
        <span className="pf-st" data-status={order.status}>
          {statusInfo.label}
        </span>
        {order.delivery_date && (
          <span className="pf-track-date">
            • Livraison prévue le {format(new Date(order.delivery_date), "d MMMM", { locale: fr })}
            {order.delivery_time && ` (${order.delivery_time})`}
          </span>
        )}
      </div>

      {/* Progress steps : fil d'or */}
      <div className="pf-route">
        {/* Line */}
        <div className="pf-route-base" aria-hidden="true" />
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: currentStep / (STEPS.length - 1) }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="pf-route-fill"
          aria-hidden="true"
        />

        {/* Steps */}
        <div className="pf-steps">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = index <= currentStep;
            const isCurrent = index === currentStep;
            const timestamp = getStatusTime(step.key);

            return (
              <div key={step.key} className={`pf-step${isActive ? " on" : ""}${isCurrent ? " now" : ""}`}>
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: isCurrent ? 1.1 : 1 }}
                  className="pf-step-dot"
                >
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </motion.div>
                <span className="pf-step-l">
                  {step.label}
                </span>
                {timestamp && (
                  <span className="pf-step-t">
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
        <div className="pf-track-box">
          <div className="pf-track-k">
            <Truck className="w-4 h-4" aria-hidden="true" />
            <span>Suivi Colissimo</span>
          </div>
          <div className="pf-track-row">
            <span className="pf-track-num">{(order as any).tracking_number}</span>
            <a
              href={(order as any).tracking_url || `https://www.laposte.fr/outils/suivre-vos-envois?code=${(order as any).tracking_number}`}
              target="_blank"
              rel="noopener noreferrer"
              className="pf-track-link"
            >
              Suivre mon colis
              <MapPin className="w-3 h-3" aria-hidden="true" />
            </a>
          </div>
        </div>
      )}

      {/* Delivery info */}
      {order.delivery_type && (
        <div className="pf-track-box pf-track-deliv">
          <MapPin className="w-4 h-4" aria-hidden="true" />
          <div>
            <span className="pf-track-type">
              {order.delivery_type === "postal" ? "Livraison postale" : order.delivery_type === "personal" ? "Remise en main propre" : order.delivery_type}
            </span>
            {order.delivery_address && (
              <p className="pf-track-addr">{order.delivery_address}</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default OrderTracking;
