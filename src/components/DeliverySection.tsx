import { motion } from "framer-motion";
import { Truck, User as UserIcon, MapPin, AlertCircle, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import DeliveryScheduler from "./DeliveryScheduler";

interface DeliverySectionProps {
  deliveryType: "postal" | "personal";
  setDeliveryType: (type: "postal" | "personal") => void;
  isWithin100km: boolean;
  setIsWithin100km: (value: boolean) => void;
  address: string;
  setAddress: (value: string) => void;
  scheduledDate: Date | undefined;
  setScheduledDate: (date: Date | undefined) => void;
  scheduledTime: string;
  setScheduledTime: (time: string) => void;
  contactPhone: string;
  setContactPhone: (phone: string) => void;
}

const DeliverySection = ({
  deliveryType,
  setDeliveryType,
  isWithin100km,
  setIsWithin100km,
  address,
  setAddress,
  scheduledDate,
  setScheduledDate,
  scheduledTime,
  setScheduledTime,
  contactPhone,
  setContactPhone,
}: DeliverySectionProps) => {
  const { isPro, isProValidated } = useAuth();
  const { totalFlowerWeight } = useCart();

  const isProActive = isPro && isProValidated;

  // Determine if personal delivery is accessible
  // Pro: always (if within 100km)
  // Regular: needs >= 100g AND within 100km
  const canAccessPersonalDelivery = isProActive || totalFlowerWeight >= 100;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-foreground uppercase tracking-wider flex items-center gap-2">
        <Truck className="w-4 h-4 text-primary" />
        Mode de livraison
      </h3>

      <div className="grid grid-cols-1 gap-3">
        {/* Postal Delivery - Always available */}
        <motion.button
          onClick={() => setDeliveryType("postal")}
          className={`p-4 rounded-lg border-2 transition-all text-left ${
            deliveryType === "postal"
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary/50"
          }`}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-start gap-3">
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
              deliveryType === "postal" ? "border-primary bg-primary" : "border-muted-foreground"
            }`}>
              {deliveryType === "postal" && <Check className="w-3 h-3 text-primary-foreground" />}
            </div>
            <div>
              <p className="font-medium text-foreground">Envoi postal</p>
              <p className="text-xs text-muted-foreground mt-1">
                Expédition sous 48h par La Poste
              </p>
            </div>
          </div>
        </motion.button>

        {/* Personal Delivery - Conditional */}
        <motion.button
          onClick={() => canAccessPersonalDelivery && setDeliveryType("personal")}
          disabled={!canAccessPersonalDelivery}
          className={`p-4 rounded-lg border-2 transition-all text-left ${
            !canAccessPersonalDelivery
              ? "border-border/50 opacity-50 cursor-not-allowed"
              : deliveryType === "personal"
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary/50"
          }`}
          whileTap={canAccessPersonalDelivery ? { scale: 0.98 } : {}}
        >
          <div className="flex items-start gap-3">
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
              deliveryType === "personal" ? "border-primary bg-primary" : "border-muted-foreground"
            }`}>
              {deliveryType === "personal" && <Check className="w-3 h-3 text-primary-foreground" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium text-foreground">Livraison personnelle</p>
                {isProActive && (
                  <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                    PRO
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Je me déplace chez vous (moins de 100km)
              </p>
              {!canAccessPersonalDelivery && (
                <div className="flex items-center gap-1 mt-2 text-xs text-amber-500">
                  <AlertCircle className="w-3 h-3" />
                  <span>Disponible à partir de 100g de fleurs</span>
                </div>
              )}
            </div>
          </div>
        </motion.button>
      </div>

      {/* Postal delivery address */}
      {deliveryType === "postal" && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-3 pt-2"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>Adresse de livraison</span>
          </div>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Votre adresse complète..."
            className="w-full p-3 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary"
            rows={3}
          />
        </motion.div>
      )}

      {/* Personal delivery options */}
      {deliveryType === "personal" && canAccessPersonalDelivery && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-4 pt-2"
        >
          {/* 100km confirmation */}
          <label className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border cursor-pointer hover:border-primary/50 transition-colors">
            <input
              type="checkbox"
              checked={isWithin100km}
              onChange={(e) => setIsWithin100km(e.target.checked)}
              className="mt-1 rounded border-primary text-primary focus:ring-primary"
            />
            <div>
              <p className="text-sm font-medium text-foreground">
                Je confirme être situé à moins de 100km
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Cette option est basée sur votre déclaration. Nous vous contacterons pour confirmer.
              </p>
            </div>
          </label>

          {/* Scheduler - only if 100km confirmed */}
          {isWithin100km && (
            <DeliveryScheduler
              scheduledDate={scheduledDate}
              setScheduledDate={setScheduledDate}
              scheduledTime={scheduledTime}
              setScheduledTime={setScheduledTime}
              contactPhone={contactPhone}
              setContactPhone={setContactPhone}
            />
          )}
        </motion.div>
      )}
    </div>
  );
};

export default DeliverySection;
