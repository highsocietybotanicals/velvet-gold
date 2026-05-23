import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Truck, User as UserIcon, MapPin, AlertCircle, Check, Search, Loader2, Store } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import DeliveryScheduler from "./DeliveryScheduler";

interface RelayPoint {
  id: string;
  name: string;
  address: string;
  postalCode: string;
  city: string;
  type: string;
  distance: number;
}

export type PersonalDeliveryZone = "10" | "25" | "50" | "100" | null;

interface DeliverySectionProps {
  deliveryType: "postal" | "personal" | "relay";
  setDeliveryType: (type: "postal" | "personal" | "relay") => void;
  personalDeliveryZone: PersonalDeliveryZone;
  setPersonalDeliveryZone: (value: PersonalDeliveryZone) => void;
  address: string;
  setAddress: (value: string) => void;
  scheduledDate: Date | undefined;
  setScheduledDate: (date: Date | undefined) => void;
  scheduledTime: string;
  setScheduledTime: (time: string) => void;
  contactPhone: string;
  setContactPhone: (phone: string) => void;
  relayPointId?: string;
  setRelayPointId?: (id: string) => void;
  relayPointName?: string;
  setRelayPointName?: (name: string) => void;
  relayPointAddress?: string;
  setRelayPointAddress?: (address: string) => void;
}

const ZONE_OPTIONS: { value: Exclude<PersonalDeliveryZone, null>; label: string; min: number }[] = [
  { value: "10", label: "Moins de 10 km", min: 2.5 },
  { value: "25", label: "Moins de 25 km", min: 5 },
  { value: "50", label: "Moins de 50 km", min: 50 },
  { value: "100", label: "Moins de 100 km", min: 100 },
];

const DeliverySection = ({
  deliveryType,
  setDeliveryType,
  personalDeliveryZone,
  setPersonalDeliveryZone,
  address,
  setAddress,
  scheduledDate,
  setScheduledDate,
  scheduledTime,
  setScheduledTime,
  contactPhone,
  setContactPhone,
  relayPointId,
  setRelayPointId,
  relayPointName,
  setRelayPointName,
  relayPointAddress,
  setRelayPointAddress,
}: DeliverySectionProps) => {
  const { isPro, isProValidated } = useAuth();
  const { totalFlowerWeight } = useCart();

  const isProActive = isPro && isProValidated;
  const canAccessPersonalDelivery = isProActive || totalFlowerWeight >= 2.5;

  // Structured address fields
  const [street, setStreet] = useState("");
  const [complement, setComplement] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [postalCodeError, setPostalCodeError] = useState("");

  // Relay point state
  const [relayPostalCode, setRelayPostalCode] = useState("");
  const [relayPoints, setRelayPoints] = useState<RelayPoint[]>([]);
  const [relayLoading, setRelayLoading] = useState(false);
  const [relayError, setRelayError] = useState("");

  // Assemble address whenever fields change
  useEffect(() => {
    if (deliveryType === "relay") return;
    if (deliveryType === "personal") {
      const zone = ZONE_OPTIONS.find((z) => z.value === personalDeliveryZone);
      setAddress(zone ? `Livraison personnelle — Zone ${zone.label}` : "");
      return;
    }
    const parts = [street, complement, postalCode, city, "France"].filter(Boolean);
    setAddress(parts.join(", "));
  }, [street, complement, postalCode, city, setAddress, deliveryType, personalDeliveryZone]);

  const handlePostalCodeChange = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 5);
    setPostalCode(cleaned);
    if (cleaned.length > 0 && cleaned.length !== 5) {
      setPostalCodeError("Le code postal doit contenir 5 chiffres");
    } else {
      setPostalCodeError("");
    }
  };

  const handleSearchRelayPoints = async () => {
    if (!/^\d{5}$/.test(relayPostalCode)) {
      setRelayError("Code postal invalide (5 chiffres)");
      return;
    }
    setRelayLoading(true);
    setRelayError("");
    setRelayPoints([]);
    try {
      const { data, error } = await supabase.functions.invoke("colissimo-find-relay-points", {
        body: { postalCode: relayPostalCode },
      });
      if (error) throw error;
      if (data?.error) {
        setRelayError(data.error);
        return;
      }
      setRelayPoints(data?.points || []);
      if ((data?.points || []).length === 0) {
        setRelayError("Aucun point relais trouvé pour ce code postal");
      }
    } catch (err: any) {
      console.error("Relay search error:", err);
      setRelayError("Erreur lors de la recherche");
    } finally {
      setRelayLoading(false);
    }
  };

  const handleSelectRelay = (point: RelayPoint) => {
    setRelayPointId?.(point.id);
    setRelayPointName?.(point.name);
    const fullAddress = `${point.address}, ${point.postalCode} ${point.city}`;
    setRelayPointAddress?.(fullAddress);
    setAddress(fullAddress);
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
              <p className="font-medium text-foreground">Envoi postal à domicile</p>
              <p className="text-xs text-muted-foreground mt-1">
                Expédition sous 48h par La Poste
              </p>
            </div>
          </div>
        </motion.button>

        {/* Relay Point Delivery */}
        <motion.button
          onClick={() => setDeliveryType("relay")}
          className={`p-4 rounded-lg border-2 transition-all text-left ${
            deliveryType === "relay"
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary/50"
          }`}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-start gap-3">
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
              deliveryType === "relay" ? "border-primary bg-primary" : "border-muted-foreground"
            }`}>
              {deliveryType === "relay" && <Check className="w-3 h-3 text-primary-foreground" />}
            </div>
            <div>
              <p className="font-medium text-foreground">Point Relais Colissimo</p>
              <p className="text-xs text-muted-foreground mt-1">
                Retrait dans un bureau de tabac, commerce ou bureau de poste
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

      {/* Relay point search */}
      {deliveryType === "relay" && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-3 pt-2"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Store className="w-4 h-4" />
            <span>Rechercher un point relais</span>
          </div>

          <div className="flex gap-2">
            <Input
              value={relayPostalCode}
              onChange={(e) => setRelayPostalCode(e.target.value.replace(/\D/g, "").slice(0, 5))}
              placeholder="Code postal (ex: 44000)"
              className="bg-background border-border text-sm"
              maxLength={5}
              inputMode="numeric"
            />
            <button
              onClick={handleSearchRelayPoints}
              disabled={relayLoading || relayPostalCode.length !== 5}
              className="px-4 h-9 text-sm btn-luxury disabled:opacity-50 whitespace-nowrap flex items-center gap-2"
            >
              {relayLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Rechercher
            </button>
          </div>

          {relayError && (
            <p className="text-xs text-destructive">{relayError}</p>
          )}

          {/* Relay points list */}
          {relayPoints.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {relayPoints.map((point) => (
                <button
                  key={point.id}
                  onClick={() => handleSelectRelay(point)}
                  className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                    relayPointId === point.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <Store className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{point.name}</p>
                      <p className="text-xs text-muted-foreground">{point.address}</p>
                      <p className="text-xs text-muted-foreground">{point.postalCode} {point.city}</p>
                      {point.distance > 0 && (
                        <p className="text-xs text-primary mt-1">
                          {point.distance < 1000
                            ? `${point.distance}m`
                            : `${(point.distance / 1000).toFixed(1)}km`}
                        </p>
                      )}
                    </div>
                    {relayPointId === point.id && (
                      <Check className="w-4 h-4 text-primary shrink-0 mt-0.5 ml-auto" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Selected relay confirmation */}
          {relayPointId && relayPointName && (
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">{relayPointName}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{relayPointAddress}</p>
            </div>
          )}

          {/* Phone for relay (logged-in users) */}
          <div>
            <Label className="text-xs text-muted-foreground">Téléphone *</Label>
            <Input
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="06 12 34 56 78"
              className="mt-1 bg-background border-border text-sm"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">Requis pour le retrait en point relais</p>
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
                Je confirme être situé à moins de 100km de notre entrepôt (Loire-Atlantique, 44)
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Nous vous contacterons pour confirmer le rendez-vous.
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
