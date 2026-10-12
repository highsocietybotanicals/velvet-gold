import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, ShoppingBag, Trash2, Gift, Package, Leaf, Sparkles, CreditCard, Loader2, Tag, Check, Flame, FileText, ArrowLeft, ArrowRight, Lock } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { useCart, type CartItem, type AccessoryCartItem, type SampleItem } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useProPrices } from "@/hooks/useProPrices";
import { Input } from "@/components/ui/input";
import { calculateItemPrice, getDiscountLabel, getGifts, calculateAccessoryPrice, calculateProItemPrice } from "@/lib/pricing";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import CheckoutAccount from "./checkout/CheckoutAccount";
import CheckoutDelivery from "./checkout/CheckoutDelivery";
import {
  EMPTY_DETAILS,
  FIELD_IDS,
  FIELD_ORDER,
  buildDeliveryAddress,
  cleanSpaces,
  firstErrorField,
  missingSummary,
  normalizePhone,
  tidyPhone,
  validateDetails,
  type CheckoutDetails,
  type DeliveryType,
  type DetailErrors,
  type DetailField,
} from "./checkout/checkoutValidation";
import {
  CART_RETURN_PARAM,
  clearAccountDraft,
  clearCheckoutResume,
  clearPendingPromo,
  hasPendingCheckoutResume,
  readPendingPromo,
  savePendingPromo,
} from "./checkout/checkoutResume";

type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

// Étapes du tiroir : panier → compte (si non connecté) → livraison et paiement.
type CheckoutStep = "cart" | "account" | "delivery";

const STEP_TITLES: Record<CheckoutStep, string> = {
  cart: "Mon Panier",
  account: "Votre compte",
  delivery: "Livraison et paiement",
};

// Message clair à la cliente quand le serveur refuse la commande pour une raison qu'elle peut corriger.
const readPaymentServerMessage = async (error: unknown): Promise<string | null> => {
  try {
    const ctx = (error as { context?: unknown } | null)?.context;
    if (ctx instanceof Response) {
      const payload = await ctx.clone().json();
      const msg = typeof payload?.error === "string" ? payload.error : "";
      if (msg.startsWith("Produit indisponible")) return `${msg}. Retirez-le du panier pour continuer.`;
    }
  } catch {
    /* corps de réponse illisible : message générique */
  }
  return null;
};

interface PaymentButtonProps {
  items: CartItem[];
  accessoryItems: AccessoryCartItem[];
  sampleItems: SampleItem[];
  totalPrice: number;
  totalFlowerWeight: number;
  deliveryType: DeliveryType;
  details: CheckoutDetails;
  promoCode: string;
  canPay: boolean;
  /** Clic alors qu'il manque des informations : affiche les erreurs et place le curseur sur la première. */
  onBlocked: () => void;
  onNeedAccount: () => void;
  /** Enregistre nom, téléphone et adresse dans le profil avant de partir vers le paiement (n'échoue jamais). */
  beforePayment: () => Promise<void>;
  describedBy?: string;
}

const PaymentButton = ({ items, accessoryItems, sampleItems, totalPrice, totalFlowerWeight, deliveryType, details, promoCode, canPay, onBlocked, onNeedAccount, beforePayment, describedBy }: PaymentButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const blocked = !canPay || totalPrice <= 0;

  const handlePayment = async () => {
    if (isLoading) return;
    if (!user) {
      onNeedAccount();
      return;
    }
    if (blocked) {
      onBlocked();
      return;
    }
    (window as any).__isNavigatingAway = true;
    setIsLoading(true);
    try {
      await beforePayment();

      const orderItems = [
        ...items.map((item) => ({
          productId: item.product.id,
          productName: item.product.name,
          productType: item.product.category || "fleur",
          weight: item.weight,
          quantity: null,
          unitPrice: item.product.price,
          totalPrice: item.weight * item.product.price,
        })),
        ...accessoryItems.map((item) => ({
          productId: item.accessory.id,
          productName: item.accessory.name,
          productType: "accessoire",
          weight: null,
          quantity: item.quantity,
          unitPrice: item.accessory.price,
          totalPrice: item.accessory.price * item.quantity,
        })),
      ];

      // Build sample items for the order
      const sampleOrderItems = sampleItems.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
      }));

      const isPersonal = deliveryType === "personal";
      const isRelay = deliveryType === "relay";
      const body = {
        amount: totalPrice,
        items: orderItems,
        sampleItems: sampleOrderItems,
        deliveryType,
        deliveryAddress: buildDeliveryAddress(details, deliveryType) || null,
        // Date locale (et non UTC) : un créneau choisi le 13 reste le 13.
        deliveryDate: isPersonal && details.scheduledDate ? format(details.scheduledDate, "yyyy-MM-dd") : null,
        deliveryTime: isPersonal && details.scheduledTime ? details.scheduledTime : null,
        contactPhone: tidyPhone(details.phone) || null,
        totalFlowerWeight,
        promoCode: promoCode || null,
        // Point relais transmis seulement pour une livraison en relais (sinon l'étiquette partirait au relais).
        relayPointId: isRelay ? details.relayPointId || null : null,
        relayPointName: isRelay ? details.relayPointName || null : null,
        relayPointAddress: isRelay ? details.relayPointAddress || null : null,
      };

      const { data, error } = await supabase.functions.invoke("create-viva-payment", {
        body,
      });

      if (error) {
        const serverMessage = await readPaymentServerMessage(error);
        throw Object.assign(new Error("create-viva-payment failed"), { cause: error, userMessage: serverMessage });
      }
      if (data?.checkoutUrl && typeof data.checkoutUrl === "string" && data.checkoutUrl.startsWith("https://")) {
        // Store order info for payment verification on return
        if (data.orderId && data.orderCode) {
          try {
            localStorage.setItem("pending_payment", JSON.stringify({
              orderId: data.orderId,
              vivaOrderCode: data.orderCode,
            }));
          } catch (storageError) {
            console.error("pending_payment non enregistré :", storageError);
          }
        }
        window.location.replace(data.checkoutUrl);
      } else {
        throw new Error("Invalid or missing checkout URL");
      }
    } catch (err: any) {
      (window as any).__isNavigatingAway = false;
      console.error("Payment error:", err);
      toast.error(err?.userMessage || "Erreur lors de la création du paiement. Veuillez réessayer.");
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handlePayment}
      disabled={isLoading}
      aria-disabled={blocked || undefined}
      aria-describedby={describedBy}
      className={cn(
        "w-full btn-luxury py-4 flex items-center justify-center gap-2 disabled:opacity-50",
        blocked && "opacity-50 cursor-not-allowed",
      )}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Redirection...
        </>
      ) : (
        <>
          <CreditCard className="w-5 h-5" />
          Payer {totalPrice.toFixed(2)}€ par carte
        </>
      )}
    </button>
  );
};

const CartDrawer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isPro, isProValidated, profile, user, loading: authLoading } = useAuth();
  const { getProPrice, isProActive } = useProPrices();

  // Check if user is Pro with validated VAT (no gifts for them)
  const isProWithValidatedVat = isPro && isProValidated && !!profile?.vat_number && profile?.is_vat_validated;
  const {
    items,
    accessoryItems,
    sampleItems,
    removeFromCart,
    removeAccessory,
    removeSample,
    updateWeight,
    updateAccessoryQuantity,
    clearCart,
    totalItems,
    totalFlowerWeight,
    isCartOpen,
    setIsCartOpen,
    promoCode,
    setPromoCode,
    promoDiscount,
    setPromoDiscount,
    freeShipping,
    setFreeShipping,
  } = useCart();

  const hasItems = items.length > 0 || accessoryItems.length > 0;

  // Promo code state
  const [promoInput, setPromoInput] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [promoAutoChecked, setPromoAutoChecked] = useState(false);
  // BIENVENUE15 saisi avant connexion : appliqué dès que la cliente est connectée.
  // Gardé dans le navigateur : il survit au rechargement après une connexion Google / Apple ou par lien e-mail.
  const [pendingPromo, setPendingPromoState] = useState<string>(() => readPendingPromo());
  const setPendingPromo = useCallback((code: string) => {
    setPendingPromoState(code);
    if (code) savePendingPromo(code);
    else clearPendingPromo();
  }, []);

  // Checkout state (compte obligatoire, adresse exigée pour tous les modes)
  const [step, setStep] = useState<CheckoutStep>("cart");
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("postal");
  const [details, setDetails] = useState<CheckoutDetails>(EMPTY_DETAILS);
  const [touched, setTouched] = useState<Partial<Record<DetailField, boolean>>>({});
  const [revealAll, setRevealAll] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const previousUserId = useRef<string | null>(null);

  const patchDetails = useCallback((patch: Partial<CheckoutDetails>) => {
    setDetails((d) => ({ ...d, ...patch }));
  }, []);

  // No gifts for Pro users with validated VAT
  const totalGifts = isProWithValidatedVat ? null : getGifts(totalFlowerWeight);

  // Calculate sample allowance - no samples for Pro users with validated VAT
  const sampleAllowance = isProWithValidatedVat ? 0 : Math.floor(totalFlowerWeight / 10);
  const samplesChosen = sampleItems.length;
  const samplesRemaining = sampleAllowance - samplesChosen;

  // Calculate total price based on Pro status
  const totalPrice =
    items.reduce((sum, item) => {
      const proPrice = getProPrice(item.product.id);
      if (isProActive && proPrice !== null) {
        // Pro: fixed price, no discount
        const { finalPrice } = calculateProItemPrice(proPrice, item.weight);
        return sum + finalPrice;
      } else {
        // Regular: with weight-based discounts
        const { finalPrice } = calculateItemPrice(item.product.price, item.weight, item.product.priceGroup || "A", item.product.id);
        return sum + finalPrice;
      }
    }, 0) +
    accessoryItems.reduce((sum, item) => {
      const { finalTotal } = calculateAccessoryPrice(item.accessory.price, item.quantity);
      return sum + finalTotal;
    }, 0);

  const handleGoToSampleSelection = () => {
    setIsCartOpen(false);
    navigate("/echantillon");
  };

  // ---------- étapes du tunnel ----------

  // Fermer le tiroir ramène au panier (les saisies sont conservées)
  useEffect(() => {
    if (!isCartOpen) {
      setStep("cart");
      setRevealAll(false);
    }
  }, [isCartOpen]);

  // Panier vidé pendant la commande : retour au panier
  useEffect(() => {
    if (!hasItems) setStep("cart");
  }, [hasItems]);

  // Connexion / déconnexion pendant la commande (y compris depuis un autre onglet)
  useEffect(() => {
    if (authLoading) return;
    setStep((s) => (user && s === "account" ? "delivery" : !user && s === "delivery" ? "account" : s));
  }, [user, authLoading]);

  // Retour d'une connexion Google / Apple ou d'un lien reçu par e-mail : on rouvre le tiroir à l'étape livraison
  useEffect(() => {
    if (authLoading || !user || !hasPendingCheckoutResume()) return;
    clearCheckoutResume();
    if (!hasItems) return;
    setStep("delivery");
    setIsCartOpen(true);
  }, [user, authLoading, hasItems, setIsCartOpen]);

  // ?panier=1 dans l'adresse (retour depuis la page Mon compte, lien e-mail, Google / Apple) : tiroir rouvert,
  // paramètre retiré. On attend que la session soit lue (authLoading faux) : les jetons de connexion arrivent
  // dans l'adresse (#access_token=…) et l'adresse ne doit pas être réécrite avant leur lecture.
  // L'adresse nettoyée part de window.location (l'adresse réelle, déjà débarrassée des jetons) et garde le hash.
  useEffect(() => {
    if (authLoading) return;
    if (new URLSearchParams(location.search).get(CART_RETURN_PARAM) !== "1") return;
    const params = new URLSearchParams(window.location.search);
    params.delete(CART_RETURN_PARAM);
    const search = params.toString();
    navigate({ pathname: location.pathname, search: search ? `?${search}` : "", hash: window.location.hash }, { replace: true });
    if (!hasItems) return;
    setIsCartOpen(true);
    if (user) {
      clearCheckoutResume();
      setStep("delivery");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, authLoading]);

  // À chaque étape : retour en haut, titre annoncé aux lecteurs d'écran
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
    if (step !== "cart") titleRef.current?.focus({ preventScroll: true });
  }, [step]);

  // Déconnexion ou changement de compte : on efface les coordonnées saisies
  useEffect(() => {
    const id = user?.id ?? null;
    if (previousUserId.current && previousUserId.current !== id) {
      setDetails(EMPTY_DETAILS);
      setTouched({});
      setRevealAll(false);
    }
    if (id) clearAccountDraft(); // connectée : le brouillon de l'étape compte ne sert plus
    previousUserId.current = id;
  }, [user?.id]);

  // Pré-remplissage depuis le compte (profil, puis données d'inscription / Google) : seulement les champs vides
  useEffect(() => {
    if (!user) return;
    const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
    const metaText = (key: string) => (typeof meta[key] === "string" ? (meta[key] as string) : "");
    setDetails((d) => {
      const next = { ...d };
      if (!d.fullName.trim()) next.fullName = profile?.full_name || metaText("full_name") || metaText("name") || "";
      if (!d.phone.trim()) next.phone = profile?.phone || metaText("phone") || "";
      const addressEmpty = !d.street.trim() && !d.complement.trim() && !d.postalCode.trim() && !d.city.trim();
      if (addressEmpty && profile?.address_line1) {
        next.street = profile.address_line1;
        next.complement = profile.address_line2 || "";
        next.postalCode = /^\d{5}$/.test(profile.postal_code ?? "") ? (profile.postal_code as string) : "";
        next.city = profile.city || "";
      }
      const changed = (Object.keys(next) as (keyof CheckoutDetails)[]).some((k) => next[k] !== d[k]);
      return changed ? next : d;
    });
  }, [user, profile]);

  const goToCheckout = () => setStep(user ? "delivery" : "account");

  const handleAuthenticated = useCallback((prefill: { fullName?: string; phone?: string }) => {
    setDetails((d) => ({
      ...d,
      fullName: d.fullName.trim() ? d.fullName : prefill.fullName ?? d.fullName,
      phone: d.phone.trim() ? d.phone : prefill.phone ?? d.phone,
    }));
    clearCheckoutResume();
    setStep("delivery");
  }, []);

  const handleProSignup = () => {
    const back = location.pathname === "/auth" ? "/" : location.pathname;
    setIsCartOpen(false);
    navigate(`/auth?retour=panier&next=${encodeURIComponent(back)}`);
  };

  // ---------- validation livraison ----------

  const personalIsProActive = isPro && isProValidated;
  const detailErrors = useMemo(
    () => validateDetails(details, deliveryType, { isProActive: personalIsProActive, totalFlowerWeight }),
    [details, deliveryType, personalIsProActive, totalFlowerWeight],
  );
  const visibleErrors = useMemo(() => {
    const out: DetailErrors = {};
    for (const field of FIELD_ORDER) {
      const message = detailErrors[field];
      if (message && (revealAll || touched[field] || field === "mode")) out[field] = message;
    }
    return out;
  }, [detailErrors, revealAll, touched]);
  const detailsValid = Object.keys(detailErrors).length === 0;
  const missing = missingSummary(detailErrors);

  const handleFieldBlur = useCallback((field: DetailField) => {
    setTouched((t) => (t[field] ? t : { ...t, [field]: true }));
  }, []);

  const revealErrors = () => {
    setRevealAll(true);
    const first = firstErrorField(detailErrors);
    if (!first) return;
    const el = document.getElementById(FIELD_IDS[first]);
    if (el) {
      el.scrollIntoView({ block: "center", behavior: "smooth" });
      el.focus({ preventScroll: true });
    }
  };

  // Profil complété avant le paiement : nom (étiquette Colissimo), téléphone, et adresse si aucune n'est enregistrée.
  // L'adresse n'est reprise que pour un envoi postal : un lieu de rendez-vous (main propre) ne doit jamais devenir
  // l'adresse de domicile pré-remplie à la commande suivante.
  // Un échec n'empêche pas de payer : la commande transporte déjà l'adresse et le téléphone.
  const persistProfileDetails = async () => {
    if (!user) return;
    const updates: ProfileUpdate = {};
    const name = cleanSpaces(details.fullName);
    const phone = tidyPhone(details.phone);
    if (name && name !== cleanSpaces(profile?.full_name ?? "")) updates.full_name = name;
    if (phone && normalizePhone(phone) !== normalizePhone(profile?.phone ?? "")) updates.phone = phone;
    const hasSavedAddress = !!profile?.address_line1?.trim();
    if (profile && !hasSavedAddress && deliveryType === "postal") {
      updates.address_line1 = cleanSpaces(details.street);
      updates.address_line2 = cleanSpaces(details.complement) || null;
      updates.postal_code = details.postalCode.trim();
      updates.city = cleanSpaces(details.city);
    }
    if (Object.keys(updates).length === 0) return;
    try {
      const { error } = await supabase.from("profiles").update(updates).eq("id", user.id);
      if (error) console.error("Profil non mis à jour avant paiement :", error);
    } catch (err) {
      console.error("Profil non mis à jour avant paiement :", err);
    }
  };

  // ---------- codes promo ----------

  // Auto-check BIENVENUE15 eligibility for logged-in users
  useEffect(() => {
    if (!user || promoAutoChecked || promoCode) return;
    setPromoAutoChecked(true);

    (async () => {
      try {
        // Check if user already used BIENVENUE15
        const { data: usage } = await supabase
          .from("promo_code_usage")
          .select("id")
          .eq("user_id", user.id)
          .eq("code", "BIENVENUE15")
          .maybeSingle();

        if (usage) return; // Already used

        // Check if user has exactly 1 paid order (2nd order = eligible)
        const { count } = await supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("payment_status", "paid");

        if ((count || 0) === 1) {
          // Has 1 paid order → this will be their 2nd → auto-apply
          setPromoCode("BIENVENUE15");
          setPromoDiscount(15);
          setPromoInput("BIENVENUE15");
        }
      } catch (err) {
        console.error("Promo auto-check error:", err);
      }
    })();
  }, [user, promoAutoChecked, promoCode]);

  // BIENVENUE15 noté avant la connexion : vérifié puis appliqué dès que la cliente est connectée
  useEffect(() => {
    if (!user || !pendingPromo) return;
    const code = pendingPromo;
    setPendingPromo("");
    if (promoCode) {
      // Un code est déjà appliqué (BIENVENUE15 trouvé automatiquement, ou autre code) : on ne le remplace pas.
      if (promoCode !== code) toast.info(`Le code ${promoCode} est déjà appliqué : ${code} n'a pas été ajouté.`);
      return;
    }
    (async () => {
      try {
        const { data: usage, error } = await supabase
          .from("promo_code_usage")
          .select("id")
          .eq("user_id", user.id)
          .eq("code", code)
          .maybeSingle();
        if (error) throw error;
        if (usage) {
          toast.error(`Vous avez déjà utilisé le code ${code}.`);
          return;
        }
        setPromoCode(code);
        setPromoDiscount(15);
        setPromoInput(code);
        toast.success(`Code ${code} appliqué : -15 %`);
      } catch (err) {
        console.error("Pending promo check error:", err);
        toast.error(`Le code ${code} n'a pas pu être vérifié : saisissez-le de nouveau dans le panier.`);
      }
    })();
  }, [user, pendingPromo, promoCode, setPendingPromo, setPromoCode, setPromoDiscount]);

  const handleApplyPromo = async () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;

    setPromoLoading(true);
    setPromoError("");

    try {
      // Special hardcoded codes first
      if (code === "DEMI160") {
        if (totalFlowerWeight !== 50) {
          setPromoError("Ce code est valable uniquement pour exactement 50g au total");
          setPromoLoading(false);
          return;
        }
        const { data: globalUsage } = await supabase
          .from("promo_code_usage")
          .select("id")
          .eq("code", "DEMI160")
          .maybeSingle();
        if (globalUsage) {
          setPromoError("Ce code a déjà été utilisé");
          setPromoLoading(false);
          return;
        }
        if (totalPrice <= 160) {
          setPromoError("Le total est déjà inférieur à 160€");
          setPromoLoading(false);
          return;
        }
        const discountPercent = Math.round(((totalPrice - 160) / totalPrice) * 10000) / 100;
        setPromoCode("DEMI160");
        setPromoDiscount(discountPercent);
        setFreeShipping(true);
        toast.success("Code DEMI160 appliqué ! 50g à 160€ + livraison offerte 🎉");
      } else if (code === "NUAGE90") {
        const nuageWeight = items
          .filter((i) => i.product.id === "nuage-de-mousseux")
          .reduce((s, i) => s + i.weight, 0);
        const otherFlowerWeight = items
          .filter((i) => i.product.id !== "nuage-de-mousseux")
          .reduce((s, i) => s + i.weight, 0);
        if (nuageWeight !== 20 || otherFlowerWeight !== 0) {
          setPromoError("Ce code donne 20g de Nuage de Mousseux pour 90€ (uniquement ce produit)");
          setPromoLoading(false);
          return;
        }
        const { data: globalUsage } = await supabase
          .from("promo_code_usage")
          .select("id")
          .eq("code", "NUAGE90")
          .maybeSingle();
        if (globalUsage) {
          setPromoError("Ce code a déjà été utilisé");
          setPromoLoading(false);
          return;
        }
        if (totalPrice <= 90) {
          setPromoError("Le total est déjà inférieur à 90€");
          setPromoLoading(false);
          return;
        }
        const discountPercent = Math.round(((totalPrice - 90) / totalPrice) * 10000) / 100;
        setPromoCode("NUAGE90");
        setPromoDiscount(discountPercent);
        setFreeShipping(true);
        toast.success("Code NUAGE90 appliqué ! 20g de Nuage de Mousseux à 90€ + livraison offerte 🎉");
      } else if (code === "BIENVENUE15") {
        if (!user) {
          // Compte obligatoire : le code est retenu et appliqué juste après la connexion
          setPendingPromo("BIENVENUE15");
          setPromoInput("");
          toast.success("Code BIENVENUE15 retenu : il sera appliqué après la connexion, à l'étape suivante.");
          setPromoLoading(false);
          return;
        }
        const { data: usage } = await supabase
          .from("promo_code_usage")
          .select("id")
          .eq("user_id", user.id)
          .eq("code", "BIENVENUE15")
          .maybeSingle();
        if (usage) {
          setPromoError("Vous avez déjà utilisé ce code.");
          setPromoLoading(false);
          return;
        }
        setPromoCode("BIENVENUE15");
        setPromoDiscount(15);
        toast.success("Code promo BIENVENUE15 appliqué ! -15% 🎉");
      } else {
        // Validate promo code server-side via RPC
        const { data: result, error } = await supabase.rpc("validate_promo_code" as any, {
          p_code: code,
          p_user_id: user?.id || null,
          p_flower_weight: totalFlowerWeight,
          p_product_ids: items.map((i) => i.product.id),
        });

        if (error || !result || !(result as any).valid) {
          setPromoError((result as any)?.error || "Code promo invalide");
          setPromoLoading(false);
          return;
        }

        const validResult = result as any;
        setPromoCode(validResult.code);
        setPromoDiscount(validResult.discount_percent);
        toast.success(`Code ${validResult.code} appliqué ! -${validResult.discount_percent}% 🎉`);
      }
    } catch (err) {
      setPromoError("Erreur lors de la vérification");
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromo = () => {
    setPromoCode("");
    setPromoDiscount(0);
    setPromoInput("");
    setPromoError("");
    setFreeShipping(false);
  };

  // Calculate discounted total
  const discountedTotal = promoCode === "DEMI160"
    ? 160
    : promoCode === "NUAGE90"
      ? 90
      : promoDiscount > 0
        ? Math.round(totalPrice * (1 - promoDiscount / 100) * 100) / 100
        : totalPrice;
  const discountAmount = totalPrice - discountedTotal;

  const canPay = !!user && detailsValid && discountedTotal > 0;

  const totalsBlock = (
    <div>
      {promoDiscount > 0 && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-muted-foreground">Sous-total</span>
          <span className="text-sm text-muted-foreground line-through">{totalPrice.toFixed(2)}€</span>
        </div>
      )}
      {promoDiscount > 0 && promoCode !== "DEMI160" && promoCode !== "NUAGE90" && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-primary">Réduction -{promoDiscount}%</span>
          <span className="text-sm text-primary">-{discountAmount.toFixed(2)}€</span>
        </div>
      )}
      {promoCode === "DEMI160" && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-primary">Offre DEMI160</span>
          <span className="text-sm text-primary">-{discountAmount.toFixed(2)}€</span>
        </div>
      )}
      {promoCode === "NUAGE90" && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-primary">Offre NUAGE90</span>
          <span className="text-sm text-primary">-{discountAmount.toFixed(2)}€</span>
        </div>
      )}
      {freeShipping && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-primary">🚚 Livraison</span>
          <span className="text-sm text-primary font-medium">OFFERTE</span>
        </div>
      )}
      <div className="flex justify-between items-center">
        <span className="text-muted-foreground">Total</span>
        <span className="font-display text-2xl text-primary">
          {discountedTotal.toFixed(2)}€
        </span>
      </div>
      {isProActive && (
        <p className="text-xs text-primary mt-1">Prix professionnel appliqué</p>
      )}
    </div>
  );

  const stepIndex = step === "cart" ? 0 : step === "account" ? 1 : 2;
  const stepItems: { key: CheckoutStep; label: string }[] = [
    { key: "cart", label: "Panier" },
    { key: "account", label: "Compte" },
    { key: "delivery", label: "Livraison" },
  ];

  return (
    <AnimatePresence>
      {isCartOpen && (
        <motion.div
          key="cart-drawer-container"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 1 }}
          className="contents"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-card border-l border-border z-[60] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-2 p-6 border-b border-border">
              <div className="flex items-center gap-3 min-w-0">
                {step === "cart" ? (
                  <ShoppingBag className="w-6 h-6 text-primary shrink-0" />
                ) : (
                  <button
                    type="button"
                    onClick={() => setStep("cart")}
                    aria-label="Revenir au panier"
                    className="-ml-2 p-2 hover:bg-muted rounded-full transition-colors shrink-0"
                  >
                    <ArrowLeft className="w-5 h-5 text-primary" />
                  </button>
                )}
                <h2 ref={titleRef} tabIndex={-1} className="font-display text-xl text-foreground truncate outline-none">
                  {STEP_TITLES[step]}
                </h2>
                {step === "cart" && (
                  <span className="text-sm text-muted-foreground shrink-0">
                    ({totalItems} article{totalItems > 1 ? "s" : ""})
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                aria-label="Fermer le panier"
                className="p-2 hover:bg-muted rounded-full transition-colors shrink-0"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Étapes de la commande */}
            {hasItems && (
              <nav aria-label="Étapes de la commande" className="px-6 py-2.5 border-b border-border">
                <ol className="flex items-center gap-2 text-[10px] uppercase tracking-[.16em]">
                  {stepItems.map((s, i) => {
                    const done = i < stepIndex || (s.key === "account" && !!user);
                    const current = i === stepIndex;
                    return (
                      <li key={s.key} className="flex items-center gap-2" aria-current={current ? "step" : undefined}>
                        <span
                          className={cn(
                            "flex h-5 w-5 items-center justify-center rounded-full border text-[10px] tracking-normal",
                            current
                              ? "border-primary bg-primary text-primary-foreground"
                              : done
                                ? "border-primary/60 text-primary"
                                : "border-border text-muted-foreground",
                          )}
                          aria-hidden="true"
                        >
                          {done && !current ? <Check className="h-3 w-3" /> : i + 1}
                        </span>
                        <span className={current ? "text-[color:var(--mn-or-clair)]" : "text-muted-foreground"}>
                          {s.label}
                          {done && !current && <span className="sr-only"> (fait)</span>}
                        </span>
                        {i < stepItems.length - 1 && <span className="h-px w-4 sm:w-8 bg-border" aria-hidden="true" />}
                      </li>
                    );
                  })}
                </ol>
              </nav>
            )}

            {/* Cart Items */}
            <div ref={bodyRef} className="flex-1 overflow-y-auto p-6">
              {step === "account" && hasItems ? (
                <CheckoutAccount onAuthenticated={handleAuthenticated} onProSignup={handleProSignup} />
              ) : step === "delivery" && hasItems ? (
                <CheckoutDelivery
                  deliveryType={deliveryType}
                  onDeliveryTypeChange={setDeliveryType}
                  details={details}
                  onChange={patchDetails}
                  errors={visibleErrors}
                  onFieldBlur={handleFieldBlur}
                  ctx={{ isProActive: personalIsProActive, totalFlowerWeight }}
                  accountEmail={user?.email ?? profile?.email ?? null}
                />
              ) : items.length === 0 && accessoryItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <ShoppingBag className="w-16 h-16 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">
                    Votre panier est vide
                  </p>
                  <p className="text-sm text-muted-foreground/70 mt-2">
                    Découvrez notre collection de produits d'exception
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* FLOWERS SECTION */}
                  {items.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Leaf className="w-4 h-4 text-primary" />
                        <h3 className="text-sm font-medium text-foreground uppercase tracking-wider">
                          Fleurs ({totalFlowerWeight.toFixed(1)}g)
                        </h3>
                      </div>
                      <div className="space-y-3">
                        {items.map((item) => {
                          const proPrice = getProPrice(item.product.id);
                          const useProPricing = isProActive && proPrice !== null;

                          const priceInfo = useProPricing
                            ? calculateProItemPrice(proPrice, item.weight)
                            : calculateItemPrice(item.product.price, item.weight, item.product.priceGroup || "A", item.product.id);
                          const discountLabel = useProPricing ? null : getDiscountLabel(item.weight, item.product.priceGroup || "A", item.product.id, item.product.price);
                          const hasDiscount = !useProPricing && 'discount' in priceInfo && (priceInfo as { discount: number }).discount > 0;

                          return (
                            <motion.div
                              key={item.product.id}
                              layout
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              className="flex gap-3 p-3 bg-muted/30 rounded-lg border border-border/50"
                            >
                              <img
                                src={item.product.image}
                                alt={item.product.name}
                                width={64}
                                height={64}
                                loading="lazy"
                                decoding="async"
                                className="w-16 h-16 object-cover rounded-lg"
                                onError={(e) => {
                                  e.currentTarget.src = '/placeholder.svg';
                                }}
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-display text-sm text-foreground truncate">
                                  {item.product.name}
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                  {useProPricing ? (
                                    <span className="text-primary font-medium">{proPrice}€/g PRO</span>
                                  ) : (
                                    <>{item.product.price}€/g</>
                                  )}
                                </p>

                                {/* Weight controls */}
                                <div className="flex items-center gap-2 mt-2">
                                  <button
                                    onClick={() => {
                                      const decrement = item.weight <= 2.5 ? 0.5 : 2.5;
                                      updateWeight(item.product.id, Math.max(0.5, item.weight - decrement));
                                    }}
                                    aria-label={`Retirer du poids : ${item.product.name}`}
                                    className="p-1 hover:text-primary transition-colors bg-background rounded border border-border"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <Input
                                    type="number"
                                    min="0.5"
                                    max="1000"
                                    step="0.5"
                                    value={item.weight}
                                    aria-label={`Poids en grammes : ${item.product.name}`}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value);
                                      if (!isNaN(val) && val > 0) {
                                        updateWeight(item.product.id, val);
                                      }
                                    }}
                                    className="h-6 w-14 text-center text-xs border-primary/30"
                                  />
                                  <span className="text-xs text-muted-foreground">g</span>
                                  <button
                                    onClick={() => updateWeight(item.product.id, item.weight + 2.5)}
                                    aria-label={`Ajouter du poids : ${item.product.name}`}
                                    className="p-1 hover:text-primary transition-colors bg-background rounded border border-border"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <button
                                  onClick={() => removeFromCart(item.product.id)}
                                  aria-label={`Retirer du panier : ${item.product.name}`}
                                  className="p-1 text-destructive hover:bg-destructive/10 rounded transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                                <p className="font-display text-sm text-primary font-bold">
                                  {priceInfo.finalPrice.toFixed(2)}€
                                </p>
                                {hasDiscount && discountLabel && (
                                  <>
                                    <p className="text-xs text-muted-foreground line-through">
                                      {priceInfo.rawPrice.toFixed(2)}€
                                    </p>
                                    <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">
                                      {discountLabel}
                                    </span>
                                  </>
                                )}
                                {useProPricing && (
                                  <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">
                                    PRO
                                  </span>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* SAMPLE SELECTION CARD */}
                  {sampleAllowance > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <h3 className="text-sm font-medium text-foreground uppercase tracking-wider">
                          Cadeau Spécial - Échantillon
                        </h3>
                      </div>

                      {/* Clickable card to choose samples */}
                      {samplesRemaining > 0 && (
                        <motion.button
                          onClick={handleGoToSampleSelection}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full p-4 rounded-lg bg-gradient-to-r from-primary/20 to-primary/10 border-2 border-dashed border-primary/50 hover:border-primary transition-all text-left"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                              <Gift className="w-6 h-6 text-primary" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-foreground">
                                {samplesRemaining} échantillon{samplesRemaining > 1 ? "s" : ""} gratuit{samplesRemaining > 1 ? "s" : ""} à choisir !
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Cliquez pour sélectionner 1g de la fleur de votre choix
                              </p>
                            </div>
                            <div className="text-primary">→</div>
                          </div>
                        </motion.button>
                      )}

                      {/* Display chosen samples */}
                      {sampleItems.length > 0 && (
                        <div className="space-y-2 mt-3">
                          {sampleItems.map((item) => (
                            <motion.div
                              key={`sample-${item.product.id}`}
                              layout
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg border border-green-500/30"
                            >
                              <img
                                src={item.product.image}
                                alt={item.product.name}
                                width={40}
                                height={40}
                                loading="lazy"
                                decoding="async"
                                className="w-10 h-10 object-cover rounded-lg"
                                onError={(e) => {
                                  e.currentTarget.src = '/placeholder.svg';
                                }}
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm text-foreground truncate">
                                  {item.product.name}
                                </h4>
                                <p className="text-xs text-green-400 font-medium">
                                  1g - GRATUIT
                                </p>
                              </div>
                              <button
                                onClick={() => removeSample(item.product.id)}
                                aria-label={`Retirer l'échantillon : ${item.product.name}`}
                                className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </motion.div>
                          ))}
                        </div>
                      )}

                      {/* Progress indicator */}
                      <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                        <span>Échantillons choisis</span>
                        <span className="font-medium text-primary">
                          {samplesChosen} / {sampleAllowance}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* ACCESSORIES SECTION */}
                  {accessoryItems.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Package className="w-4 h-4 text-primary" />
                        <h3 className="text-sm font-medium text-foreground uppercase tracking-wider">
                          Accessoires
                        </h3>
                      </div>
                      <div className="space-y-3">
                        {accessoryItems.map((item) => {
                          const priceInfo = calculateAccessoryPrice(item.accessory.price, item.quantity);

                          return (
                            <motion.div
                              key={item.accessory.id}
                              layout
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              className="flex gap-3 p-3 bg-muted/30 rounded-lg border border-border/50"
                            >
                              <img
                                src={item.accessory.image}
                                alt={item.accessory.name}
                                width={48}
                                height={48}
                                loading="lazy"
                                decoding="async"
                                className="w-12 h-12 object-cover rounded-lg"
                                onError={(e) => {
                                  e.currentTarget.src = '/placeholder.svg';
                                }}
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-display text-sm text-foreground truncate">
                                  {item.accessory.name}
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                  {item.accessory.price.toFixed(2)}€/unité
                                </p>

                                {/* Quantity controls */}
                                <div className="flex items-center gap-2 mt-1">
                                  <button
                                    onClick={() => updateAccessoryQuantity(item.accessory.id, item.quantity - 1)}
                                    aria-label={`Retirer une unité : ${item.accessory.name}`}
                                    className="p-1 hover:text-primary transition-colors bg-background rounded border border-border"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="w-6 text-center text-xs font-medium">{item.quantity}</span>
                                  <button
                                    onClick={() => updateAccessoryQuantity(item.accessory.id, item.quantity + 1)}
                                    aria-label={`Ajouter une unité : ${item.accessory.name}`}
                                    className="p-1 hover:text-primary transition-colors bg-background rounded border border-border"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <button
                                  onClick={() => removeAccessory(item.accessory.id)}
                                  aria-label={`Retirer du panier : ${item.accessory.name}`}
                                  className="p-1 text-destructive hover:bg-destructive/10 rounded transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                                <p className="font-display text-sm text-primary font-bold">
                                  {priceInfo.finalTotal.toFixed(2)}€
                                </p>
                                {priceInfo.discount > 0 && (
                                  <>
                                    <p className="text-xs text-muted-foreground line-through">
                                      {priceInfo.rawTotal.toFixed(2)}€
                                    </p>
                                    <span className="text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">
                                      {priceInfo.discountLabel}
                                    </span>
                                  </>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* FREE GIFTS SECTION */}
                  {totalGifts && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Gift className="w-4 h-4 text-primary" />
                        <h3 className="text-sm font-medium text-foreground uppercase tracking-wider">
                          Cadeaux Offerts
                        </h3>
                      </div>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-lg bg-primary/10 border border-primary/20 space-y-3"
                      >
                        <div className="flex items-center gap-2">
                          {totalGifts.type === "kit" ? (
                            <Package className="w-5 h-5 text-primary" />
                          ) : (
                            <Gift className="w-5 h-5 text-primary" />
                          )}
                          <span className="text-sm text-primary font-medium">
                            {totalGifts.label}
                          </span>
                        </div>

                        {/* Gift contents detail */}
                        <div className="space-y-2 pt-2 border-t border-primary/20">
                          <div className="flex items-center gap-3">
                            <FileText className="w-4 h-4 text-primary shrink-0" />
                            <p className="text-sm text-foreground">
                              {totalGifts.contents.feuillesSlim}x Feuilles Slim + Carton RAW
                            </p>
                            <span className="ml-auto text-xs text-green-400 font-semibold tracking-wide">OFFERT</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Flame className="w-4 h-4 text-primary shrink-0" />
                            <p className="text-sm text-foreground">
                              {totalGifts.contents.briquetBIC}x Briquet BIC Noir
                            </p>
                            <span className="ml-auto text-xs text-green-400 font-semibold tracking-wide">OFFERT</span>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer — étape panier : code promo, total, passer commande */}
            {hasItems && step === "cart" && (
              <div className="p-6 border-t border-border space-y-4 max-h-[50vh] overflow-y-auto">
                {/* Promo Code Section */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">Code promo</span>
                  </div>
                  {promoCode ? (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/30">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-primary" />
                        <span className="text-sm font-mono font-bold text-primary">{promoCode}</span>
                        {promoCode === "DEMI160" ? (
                          <span className="text-xs text-muted-foreground">50g à 160€ tout compris</span>
                        ) : promoCode === "NUAGE90" ? (
                          <span className="text-xs text-muted-foreground">20g Nuage de Mousseux à 90€</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">(-{promoDiscount}%)</span>
                        )}
                      </div>
                      <button onClick={handleRemovePromo} aria-label="Retirer le code promo" className="p-1 text-muted-foreground hover:text-destructive">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : pendingPromo ? (
                    <div className="flex items-center justify-between gap-2 p-3 rounded-lg bg-primary/10 border border-primary/30">
                      <p className="text-xs text-muted-foreground">
                        <span className="font-mono font-bold text-primary">{pendingPromo}</span> sera appliqué après la connexion.
                      </p>
                      <button onClick={() => setPendingPromo("")} aria-label="Retirer le code promo" className="p-1 text-muted-foreground hover:text-destructive">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="BIENVENUE15"
                        aria-label="Code promo"
                        value={promoInput}
                        onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoError(""); }}
                        className="h-9 min-w-0 flex-1 text-sm font-mono uppercase"
                        maxLength={20}
                      />
                      <button
                        onClick={handleApplyPromo}
                        disabled={promoLoading || !promoInput.trim()}
                        className="shrink-0 px-3 h-9 text-xs btn-luxury disabled:opacity-50 whitespace-nowrap"
                      >
                        {promoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Appliquer"}
                      </button>
                    </div>
                  )}
                  {promoError && (
                    <p className="text-xs text-destructive mt-1" role="alert">{promoError}</p>
                  )}
                </div>

                <div className="pt-4 border-t border-border">{totalsBlock}</div>

                <button
                  type="button"
                  onClick={goToCheckout}
                  disabled={discountedTotal <= 0}
                  className="w-full btn-luxury py-4 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  Passer commande
                  <ArrowRight className="w-5 h-5" />
                </button>
                {!user && (
                  <p className="text-center text-xs text-muted-foreground -mt-1">
                    Étape suivante : votre compte (création en 30 secondes), puis la livraison.
                  </p>
                )}
                <button
                  onClick={clearCart}
                  className="w-full text-sm text-muted-foreground hover:text-destructive transition-colors"
                >
                  Vider le panier
                </button>
              </div>
            )}

            {/* Footer — étape compte : rappel du total */}
            {hasItems && step === "account" && (
              <div className="px-6 py-4 border-t border-border flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total de votre panier</span>
                <span className="font-display text-xl text-primary">{discountedTotal.toFixed(2)}€</span>
              </div>
            )}

            {/* Footer — étape livraison : total et paiement */}
            {hasItems && step === "delivery" && (
              <div className="p-6 border-t border-border space-y-3">
                {totalsBlock}
                <PaymentButton
                  items={items}
                  accessoryItems={accessoryItems}
                  sampleItems={sampleItems}
                  totalPrice={discountedTotal}
                  totalFlowerWeight={totalFlowerWeight}
                  deliveryType={deliveryType}
                  details={details}
                  promoCode={promoCode}
                  canPay={canPay}
                  onBlocked={revealErrors}
                  onNeedAccount={() => setStep("account")}
                  beforePayment={persistProfileDetails}
                  describedBy={!detailsValid ? "co-pay-manque" : undefined}
                />
                <div aria-live="polite">
                  {!detailsValid ? (
                    <p id="co-pay-manque" className="text-xs text-amber-400 text-center">
                      Pour payer, complétez : {missing}.
                    </p>
                  ) : (
                    <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
                      <Lock className="w-3 h-3" aria-hidden="true" />
                      Paiement sécurisé par carte bancaire (Viva Wallet)
                    </p>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
