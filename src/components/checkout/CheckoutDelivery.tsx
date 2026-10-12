import { useEffect, useState, type ReactNode } from "react";
import { format, addDays, isBefore, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import {
  AlertCircle,
  Calendar as CalendarIcon,
  Check,
  CircleUserRound,
  Clock,
  Loader2,
  MapPin,
  Phone,
  Search,
  Store,
  Truck,
  UserRound,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CheckoutField } from "./CheckoutField";
import {
  FIELD_IDS,
  PERSONAL_MIN_WEIGHT,
  ZONE_OPTIONS,
  canUsePersonalDelivery,
  formatGrams,
  isZoneEligible,
  type CheckoutDetails,
  type DeliveryContext,
  type DeliveryType,
  type DetailErrors,
  type DetailField,
} from "./checkoutValidation";

// Étape « Livraison et paiement » du tiroir du panier : mode de livraison, adresse (exigée pour TOUS
// les modes, y compris la remise en main propre), point relais, créneau, nom et téléphone.

interface RelayPoint {
  id: string;
  name: string;
  address: string;
  postalCode: string;
  city: string;
  type: string;
  distance: number;
}

const TIME_SLOTS = [
  { value: "09:00-12:00", label: "9 h – 12 h (matin)" },
  { value: "14:00-18:00", label: "14 h – 18 h (après-midi)" },
  { value: "18:00-20:00", label: "18 h – 20 h (soir)" },
];

interface CheckoutDeliveryProps {
  deliveryType: DeliveryType;
  onDeliveryTypeChange: (type: DeliveryType) => void;
  details: CheckoutDetails;
  onChange: (patch: Partial<CheckoutDetails>) => void;
  /** Erreurs à afficher (champs déjà quittés, ou toutes après un essai de paiement). */
  errors: DetailErrors;
  onFieldBlur: (field: DetailField) => void;
  ctx: DeliveryContext;
  accountEmail: string | null;
}

const SectionTitle = ({ icon, children }: { icon: ReactNode; children: ReactNode }) => (
  <h3 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.18em] text-[color:var(--mn-or)]">
    {icon}
    {children}
  </h3>
);

const InlineError = ({ id, message }: { id: string; message?: string }) => (
  <div aria-live="polite">
    {message && (
      <p id={id} className="mt-2 flex items-start gap-1.5 text-xs text-red-400">
        <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>{message}</span>
      </p>
    )}
  </div>
);

const RadioDot = ({ checked }: { checked: boolean }) => (
  <span
    aria-hidden="true"
    className={cn(
      "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
      checked ? "border-primary bg-primary" : "border-muted-foreground",
    )}
  >
    {checked && <Check className="h-3 w-3 text-primary-foreground" />}
  </span>
);

const optionClass = (checked: boolean, disabled = false) =>
  cn(
    "relative flex items-start gap-3 rounded-[2px] border p-4 text-left transition-colors has-[:focus-visible]:ring-1 has-[:focus-visible]:ring-[color:var(--mn-or-clair)]",
    disabled
      ? "cursor-not-allowed border-[color:var(--mn-ligne)] opacity-50"
      : checked
        ? "cursor-pointer border-primary bg-primary/10"
        : "cursor-pointer border-[color:var(--mn-ligne)] hover:border-primary/50",
  );

const CheckoutDelivery = ({
  deliveryType,
  onDeliveryTypeChange,
  details,
  onChange,
  errors,
  onFieldBlur,
  ctx,
  accountEmail,
}: CheckoutDeliveryProps) => {
  const personalAllowed = canUsePersonalDelivery(ctx);

  // Recherche de point relais (même service que l'ancien formulaire)
  const [relayPostalCode, setRelayPostalCode] = useState(details.postalCode);
  const [relayPoints, setRelayPoints] = useState<RelayPoint[]>([]);
  const [relayLoading, setRelayLoading] = useState(false);
  const [relayError, setRelayError] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Code postal du compte proposé d'office pour la recherche de point relais
  useEffect(() => {
    if (deliveryType === "relay" && !relayPostalCode && /^\d{5}$/.test(details.postalCode)) {
      setRelayPostalCode(details.postalCode);
    }
  }, [deliveryType, details.postalCode, relayPostalCode]);

  const handleSearchRelayPoints = async () => {
    if (!/^\d{5}$/.test(relayPostalCode)) {
      setRelayError("Code postal invalide (5 chiffres).");
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
        setRelayError(String(data.error));
        return;
      }
      const points: RelayPoint[] = Array.isArray(data?.points) ? data.points : [];
      setRelayPoints(points);
      if (points.length === 0) setRelayError("Aucun point relais trouvé pour ce code postal.");
    } catch (err) {
      console.error("Recherche de points relais impossible :", err);
      setRelayError("La recherche n'a pas abouti. Réessayez dans un instant.");
    } finally {
      setRelayLoading(false);
    }
  };

  const handleSelectRelay = (point: RelayPoint) => {
    onChange({
      relayPointId: point.id,
      relayPointName: point.name,
      relayPointAddress: `${point.address}, ${point.postalCode} ${point.city}`,
    });
  };

  const minDate = addDays(new Date(), 1);
  const isPersonal = deliveryType === "personal";
  const needsAddress = deliveryType === "postal" || isPersonal;

  return (
    <div className="space-y-7">
      {accountEmail && (
        <p className="flex items-center gap-2 rounded-[2px] border border-[color:var(--mn-ligne)] bg-black/30 px-3 py-2.5 text-xs text-[color:var(--mn-ivoire-2)]">
          <CircleUserRound className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <span className="min-w-0">
            Commande liée à votre compte <strong className="break-all font-medium text-[color:var(--mn-ivoire)]">{accountEmail}</strong>
          </span>
        </p>
      )}

      {/* ---------- mode de livraison ---------- */}
      <fieldset id={FIELD_IDS.mode} tabIndex={-1} className="space-y-3 outline-none" aria-describedby={errors.mode ? "co-mode-erreur" : undefined}>
        <legend className="mb-3">
          <SectionTitle icon={<Truck className="h-4 w-4" aria-hidden="true" />}>Mode de livraison</SectionTitle>
        </legend>

        <label className={optionClass(deliveryType === "postal")}>
          <input
            type="radio"
            name="co-delivery"
            value="postal"
            checked={deliveryType === "postal"}
            onChange={() => onDeliveryTypeChange("postal")}
            className="sr-only"
          />
          <RadioDot checked={deliveryType === "postal"} />
          <span>
            <span className="block font-medium text-foreground">Envoi postal à domicile</span>
            <span className="mt-1 block text-xs text-muted-foreground">Expédition sous 48 h par La Poste</span>
          </span>
        </label>

        <label className={optionClass(deliveryType === "relay")}>
          <input
            type="radio"
            name="co-delivery"
            value="relay"
            checked={deliveryType === "relay"}
            onChange={() => onDeliveryTypeChange("relay")}
            className="sr-only"
          />
          <RadioDot checked={deliveryType === "relay"} />
          <span>
            <span className="block font-medium text-foreground">Point relais Colissimo</span>
            <span className="mt-1 block text-xs text-muted-foreground">
              Retrait dans un bureau de tabac, un commerce ou un bureau de poste
            </span>
          </span>
        </label>

        <label className={optionClass(isPersonal, !personalAllowed && !isPersonal)}>
          <input
            type="radio"
            name="co-delivery"
            value="personal"
            checked={isPersonal}
            disabled={!personalAllowed && !isPersonal}
            onChange={() => onDeliveryTypeChange("personal")}
            className="sr-only"
          />
          <RadioDot checked={isPersonal} />
          <span className="flex-1">
            <span className="flex items-center gap-2">
              <span className="font-medium text-foreground">Livraison personnelle</span>
              {ctx.isProActive && (
                <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] text-primary">PRO</span>
              )}
            </span>
            <span className="mt-1 block text-xs text-muted-foreground">
              Je me déplace chez vous ou au lieu de votre choix (Loire-Atlantique, jusqu'à 100 km) — à partir de{" "}
              {formatGrams(PERSONAL_MIN_WEIGHT)}
            </span>
            {!personalAllowed && (
              <span className="mt-2 flex items-center gap-1 text-xs text-amber-400">
                <AlertCircle className="h-3 w-3" aria-hidden="true" />
                Disponible à partir de {formatGrams(PERSONAL_MIN_WEIGHT)} de fleurs
              </span>
            )}
          </span>
        </label>
        <InlineError id="co-mode-erreur" message={errors.mode} />
      </fieldset>

      {/* ---------- zone (main propre) ---------- */}
      {isPersonal && (
        <fieldset
          id={FIELD_IDS.zone}
          tabIndex={-1}
          className="space-y-2 outline-none"
          aria-describedby={errors.zone ? "co-zone-erreur" : undefined}
        >
          <legend className="mb-2 text-sm font-medium text-foreground">
            Votre zone, depuis notre entrepôt en Loire-Atlantique (44)
          </legend>
          {ZONE_OPTIONS.map((zone) => {
            const eligible = isZoneEligible(zone, ctx);
            const checked = details.personalZone === zone.value;
            return (
              <label key={zone.value} className={cn(optionClass(checked, !eligible), "items-center p-3")}>
                <input
                  type="radio"
                  name="co-zone"
                  value={zone.value}
                  checked={checked}
                  disabled={!eligible}
                  onChange={() => onChange({ personalZone: zone.value })}
                  onBlur={() => onFieldBlur("zone")}
                  className="sr-only"
                />
                <RadioDot checked={checked} />
                <span className="flex flex-1 items-center justify-between gap-2">
                  <span className="text-sm text-foreground">{zone.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {eligible ? `dès ${formatGrams(zone.min)}` : `À partir de ${formatGrams(zone.min)}`}
                  </span>
                </span>
              </label>
            );
          })}
          <InlineError id="co-zone-erreur" message={errors.zone} />
        </fieldset>
      )}

      {/* ---------- adresse (domicile ou lieu de remise) ---------- */}
      {needsAddress && (
        <div className="space-y-4">
          <SectionTitle icon={<MapPin className="h-4 w-4" aria-hidden="true" />}>
            {isPersonal ? "Adresse de remise" : "Adresse de livraison"}
          </SectionTitle>
          {isPersonal && (
            <p className="-mt-2 text-xs text-muted-foreground">
              Votre adresse, ou un lieu de rendez-vous précis (gare, place…), avec son code postal et sa ville.
            </p>
          )}
          <CheckoutField
            id={FIELD_IDS.street}
            label={isPersonal ? "Adresse ou lieu de rendez-vous" : "Numéro et rue"}
            autoComplete="address-line1"
            placeholder={isPersonal ? "12 rue de la Paix, ou Gare de Nantes" : "12 rue de la Paix"}
            value={details.street}
            maxLength={200}
            onChange={(e) => onChange({ street: e.target.value })}
            onBlur={() => onFieldBlur("street")}
            error={errors.street}
          />
          <CheckoutField
            id={FIELD_IDS.complement}
            label="Complément (bâtiment, étage, code…)"
            optional
            autoComplete="address-line2"
            value={details.complement}
            maxLength={200}
            onChange={(e) => onChange({ complement: e.target.value })}
            onBlur={() => onFieldBlur("complement")}
            error={errors.complement}
          />
          <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3">
            <CheckoutField
              id={FIELD_IDS.postalCode}
              label="Code postal"
              autoComplete="postal-code"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="44000"
              value={details.postalCode}
              maxLength={5}
              onChange={(e) => onChange({ postalCode: e.target.value.replace(/\D/g, "").slice(0, 5) })}
              onBlur={() => onFieldBlur("postalCode")}
              error={errors.postalCode}
            />
            <CheckoutField
              id={FIELD_IDS.city}
              label="Ville"
              autoComplete="address-level2"
              placeholder="Nantes"
              value={details.city}
              maxLength={100}
              onChange={(e) => onChange({ city: e.target.value })}
              onBlur={() => onFieldBlur("city")}
              error={errors.city}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">Pays : France</p>
        </div>
      )}

      {/* ---------- point relais ---------- */}
      {deliveryType === "relay" && (
        <div className="space-y-3">
          <SectionTitle icon={<Store className="h-4 w-4" aria-hidden="true" />}>Point relais</SectionTitle>
          <div className="space-y-1.5">
            <label htmlFor={FIELD_IDS.relay} className="block text-xs font-medium tracking-wide text-[color:var(--mn-ivoire-2)]">
              Code postal de recherche
            </label>
            <div className="flex gap-2">
              <Input
                id={FIELD_IDS.relay}
                value={relayPostalCode}
                onChange={(e) => setRelayPostalCode(e.target.value.replace(/\D/g, "").slice(0, 5))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSearchRelayPoints();
                  }
                }}
                onBlur={() => onFieldBlur("relay")}
                placeholder="44000"
                inputMode="numeric"
                autoComplete="postal-code"
                maxLength={5}
                aria-invalid={errors.relay ? true : undefined}
                aria-describedby={errors.relay ? "co-relay-erreur" : undefined}
                className="h-11 rounded-[2px] border-[color:var(--mn-ligne)] bg-black/40 focus-visible:ring-1 focus-visible:ring-[color:var(--mn-or-clair)] focus-visible:ring-offset-0"
              />
              <button
                type="button"
                onClick={handleSearchRelayPoints}
                disabled={relayLoading || relayPostalCode.length !== 5}
                className="btn-luxury flex h-11 shrink-0 items-center gap-2 px-4 text-xs disabled:opacity-50"
              >
                {relayLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Search className="h-4 w-4" aria-hidden="true" />}
                Rechercher
              </button>
            </div>
          </div>

          <div aria-live="polite">{relayError && <p className="text-xs text-red-400">{relayError}</p>}</div>

          {relayPoints.length > 0 && (
            <fieldset className="max-h-72 space-y-2 overflow-y-auto pr-1">
              <legend className="sr-only">Points relais trouvés</legend>
              {relayPoints.map((point) => {
                const checked = details.relayPointId === point.id;
                return (
                  <label key={point.id} className={cn(optionClass(checked), "p-3")}>
                    <input
                      type="radio"
                      name="co-relay"
                      value={point.id}
                      checked={checked}
                      onChange={() => handleSelectRelay(point)}
                      className="sr-only"
                    />
                    <Store className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">{point.name}</span>
                      <span className="block text-xs text-muted-foreground">{point.address}</span>
                      <span className="block text-xs text-muted-foreground">
                        {point.postalCode} {point.city}
                      </span>
                      {point.distance > 0 && (
                        <span className="mt-1 block text-xs text-primary">
                          {point.distance < 1000 ? `${point.distance} m` : `${(point.distance / 1000).toFixed(1).replace(".", ",")} km`}
                        </span>
                      )}
                    </span>
                    {checked && <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />}
                  </label>
                );
              })}
            </fieldset>
          )}

          {details.relayPointId && details.relayPointName && (
            <div className="rounded-[2px] border border-primary/30 bg-primary/10 p-3" role="status">
              <p className="flex items-center gap-2 text-sm font-medium text-primary">
                <Check className="h-4 w-4" aria-hidden="true" />
                {details.relayPointName}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{details.relayPointAddress}</p>
            </div>
          )}
          <InlineError id="co-relay-erreur" message={errors.relay} />
        </div>
      )}

      {/* ---------- créneau (main propre, facultatif) ---------- */}
      {isPersonal && (
        <div className="space-y-3">
          <SectionTitle icon={<CalendarIcon className="h-4 w-4" aria-hidden="true" />}>
            Créneau souhaité <span className="normal-case tracking-normal text-muted-foreground">(facultatif)</span>
          </SectionTitle>
          <p className="-mt-1 text-xs text-muted-foreground">Nous vous appelons pour confirmer le rendez-vous.</p>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex h-11 w-full items-center gap-2 rounded-[2px] border border-[color:var(--mn-ligne)] bg-black/40 px-3 text-left text-sm",
                  details.scheduledDate ? "text-foreground" : "text-muted-foreground",
                )}
                aria-label={
                  details.scheduledDate
                    ? `Date souhaitée : ${format(details.scheduledDate, "EEEE d MMMM yyyy", { locale: fr })}. Modifier`
                    : "Choisir une date"
                }
              >
                <CalendarIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {details.scheduledDate ? format(details.scheduledDate, "EEEE d MMMM yyyy", { locale: fr }) : "Choisir une date"}
              </button>
            </PopoverTrigger>
            {/* z-[70] : au-dessus du tiroir du panier (z-[60]) */}
            <PopoverContent className="z-[70] w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={details.scheduledDate}
                onSelect={(date) => {
                  onChange({ scheduledDate: date });
                  setCalendarOpen(false);
                }}
                disabled={(date) => isBefore(startOfDay(date), startOfDay(minDate))}
                initialFocus
                locale={fr}
                className="pointer-events-auto p-3"
              />
            </PopoverContent>
          </Popover>
          <fieldset className="grid grid-cols-1 gap-2">
            <legend className="mb-2 flex items-center gap-1 text-xs text-[color:var(--mn-ivoire-2)]">
              <Clock className="h-3 w-3" aria-hidden="true" />
              Créneau horaire
            </legend>
            {TIME_SLOTS.map((slot) => {
              const checked = details.scheduledTime === slot.value;
              return (
                <label key={slot.value} className={cn(optionClass(checked), "items-center p-3 text-sm")}>
                  <input
                    type="radio"
                    name="co-slot"
                    value={slot.value}
                    checked={checked}
                    onChange={() => onChange({ scheduledTime: slot.value })}
                    className="sr-only"
                  />
                  <RadioDot checked={checked} />
                  <span className={checked ? "text-primary" : "text-muted-foreground"}>{slot.label}</span>
                </label>
              );
            })}
          </fieldset>
        </div>
      )}

      {/* ---------- coordonnées ---------- */}
      <div className="space-y-4">
        <SectionTitle icon={<UserRound className="h-4 w-4" aria-hidden="true" />}>Vos coordonnées</SectionTitle>
        <CheckoutField
          id={FIELD_IDS.fullName}
          label={deliveryType === "relay" ? "Prénom et nom (pour le retrait du colis)" : "Prénom et nom"}
          autoComplete="name"
          autoCapitalize="words"
          value={details.fullName}
          maxLength={200}
          onChange={(e) => onChange({ fullName: e.target.value })}
          onBlur={() => onFieldBlur("fullName")}
          error={errors.fullName}
          hint={
            isPersonal
              ? "Ce nom sera enregistré sur votre compte."
              : "Ce nom figurera sur l'étiquette du colis et sera enregistré sur votre compte."
          }
        />
        <CheckoutField
          id={FIELD_IDS.phone}
          label="Téléphone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={details.phone}
          maxLength={20}
          onChange={(e) => onChange({ phone: e.target.value })}
          onBlur={() => onFieldBlur("phone")}
          error={errors.phone}
          hint={
            <span className="inline-flex items-center gap-1">
              <Phone className="h-3 w-3" aria-hidden="true" />
              {deliveryType === "relay"
                ? "Un portable de préférence, pour l'avis d'arrivée du colis."
                : isPersonal
                  ? "Pour convenir du rendez-vous."
                  : "En cas de souci pendant la livraison."}
            </span>
          }
        />
      </div>
    </div>
  );
};

export default CheckoutDelivery;
