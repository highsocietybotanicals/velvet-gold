import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Truck, User as UserIcon, MapPin, AlertCircle, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const canAccessPersonalDelivery = isProActive || totalFlowerWeight >= 100;

  // Structured address fields
  const [street, setStreet] = useState("");
  const [complement, setComplement] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");

  const [postalCodeError, setPostalCodeError] = useState("");

  // Assemble address whenever fields change
  useEffect(() => {
    const parts = [street, complement, postalCode, city, "France"].filter(Boolean);
    setAddress(parts.join(", "));
  }, [street, complement, postalCode, city, setAddress]);

  const handlePostalCodeChange = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 5);
    setPostalCode(cleaned);
    if (cleaned.length > 0 && cleaned.length !== 5) {
      setPostalCodeError("Le code postal doit contenir 5 chiffres");
    } else {
      setPostalCodeError("");
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-foreground uppercase tracking-wider flex items-center gap-2">
        <Truck className="w-4 h-4 text-primary" />
        Mode de livraison
      </h3>

      <div className="grid grid-cols-1 gap-3">
        {/* Postal Delivery */}
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

        {/* Personal Delivery */}
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
                Je me déplace chez vous (rayon de 100km autour de notre entrepôt, Loire-Atlantique)
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

      {/* Postal delivery - Structured address form */}
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

          <div className="space-y-3">
            <div>
              <Label htmlFor="street" className="text-xs text-muted-foreground">
                Numéro et rue *
              </Label>
              <Input
                id="street"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="12 Rue de la Paix"
                className="mt-1 bg-background border-border text-sm"
                maxLength={200}
                required
              />
            </div>

            <div>
              <Label htmlFor="complement" className="text-xs text-muted-foreground">
                Complément (bâtiment, étage, code...)
              </Label>
              <Input
                id="complement"
                value={complement}
                onChange={(e) => setComplement(e.target.value)}
                placeholder="Bât. B, 3ème étage, code 1234"
                className="mt-1 bg-background border-border text-sm"
                maxLength={200}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="postalCode" className="text-xs text-muted-foreground">
                  Code postal *
                </Label>
                <Input
                  id="postalCode"
                  value={postalCode}
                  onChange={(e) => handlePostalCodeChange(e.target.value)}
                  placeholder="75001"
                  className={`mt-1 bg-background border-border text-sm ${postalCodeError ? "border-destructive" : ""}`}
                  maxLength={5}
                  inputMode="numeric"
                  required
                />
                {postalCodeError && (
                  <p className="text-xs text-destructive mt-1">{postalCodeError}</p>
                )}
              </div>
              <div>
                <Label htmlFor="city" className="text-xs text-muted-foreground">
                  Ville *
                </Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Paris"
                  className="mt-1 bg-background border-border text-sm"
                  maxLength={100}
                  required
                />
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Pays</Label>
              <Input
                value="France"
                disabled
                className="mt-1 bg-muted border-border text-sm text-muted-foreground"
              />
            </div>
          </div>
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
          <label className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border cursor-pointer hover:border-primary/50 transition-colors">
            <input
              type="checkbox"
              checked={isWithin100km}
              onChange={(e) => setIsWithin100km(e.target.checked)}
              className="mt-1 rounded border-primary text-primary focus:ring-primary"
            />
            <div>
              <p className="text-sm font-medium text-foreground">
                Je confirme être situé à moins de 100km de Puceul (44170)
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Distance calculée depuis Puceul (44170). Nous vous contacterons pour confirmer le rendez-vous.
              </p>
            </div>
          </label>

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
