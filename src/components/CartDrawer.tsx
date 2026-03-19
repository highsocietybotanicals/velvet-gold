import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, ShoppingBag, Trash2, Gift, Package, Leaf, Sparkles, CreditCard, Loader2, Tag, Check, Flame, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useProPrices } from "@/hooks/useProPrices";
import { Input } from "@/components/ui/input";
import { calculateItemPrice, getDiscountLabel, getGifts, calculateAccessoryPrice, calculateProItemPrice } from "@/lib/pricing";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import DeliverySection from "./DeliverySection";


const PaymentButton = ({ items, accessoryItems, sampleItems, totalPrice, totalFlowerWeight, deliveryType, address, scheduledDate, scheduledTime, contactPhone, guestEmail, guestName, guestPhone, promoCode }: any) => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const handlePayment = async () => {
    if (!user && (!guestEmail || !guestEmail.includes("@"))) {
      toast.error("Veuillez renseigner un email valide pour commander");
      return;
    }
    if (!user && (!guestName || guestName.trim().length === 0)) {
      toast.error("Veuillez renseigner votre nom pour commander");
      return;
    }
    if (deliveryType === "postal" && (!address || address.trim().length < 10)) {
      toast.error("Veuillez renseigner une adresse de livraison complète (rue, code postal, ville)");
      return;
    }
    if (totalPrice <= 0) return;
    (window as any).__isNavigatingAway = true;
    setIsLoading(true);
    try {
      const orderItems = [
        ...items.map((item: any) => ({
          productId: item.product.id,
          productName: item.product.name,
          productType: item.product.category || "fleur",
          weight: item.weight,
          quantity: null,
          unitPrice: item.product.price,
          totalPrice: item.weight * item.product.price,
        })),
        ...accessoryItems.map((item: any) => ({
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
      const sampleOrderItems = sampleItems.map((item: any) => ({
        productId: item.product.id,
        productName: item.product.name,
      }));

      const body: any = {
        amount: totalPrice,
        items: orderItems,
        sampleItems: sampleOrderItems,
        deliveryType,
        deliveryAddress: address || null,
        deliveryDate: scheduledDate?.toISOString()?.split("T")[0] || null,
        deliveryTime: scheduledTime || null,
        contactPhone: contactPhone || null,
        totalFlowerWeight,
        promoCode: promoCode || null,
      };

      // Add guest info if not authenticated
      if (!user) {
        body.guestEmail = guestEmail;
        body.guestName = guestName || null;
        body.guestPhone = guestPhone || null;
      }

      const { data, error } = await supabase.functions.invoke("create-viva-payment", {
        body,
      });

      if (error) throw error;
      if (data?.checkoutUrl && typeof data.checkoutUrl === "string" && data.checkoutUrl.startsWith("https://")) {
        // Store order info for payment verification on return
        if (data.orderId && data.orderCode) {
          localStorage.setItem("pending_payment", JSON.stringify({
            orderId: data.orderId,
            vivaOrderCode: data.orderCode,
          }));
        }
        window.location.replace(data.checkoutUrl);
      } else {
        throw new Error("Invalid or missing checkout URL");
      }
    } catch (err: any) {
      (window as any).__isNavigatingAway = false;
      console.error("Payment error:", err);
      toast.error("Erreur lors de la création du paiement. Veuillez réessayer.");
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={isLoading || totalPrice <= 0}
      className="w-full btn-luxury py-4 flex items-center justify-center gap-2 disabled:opacity-50"
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
  const { isPro, isProValidated, profile, user } = useAuth();
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

  // Promo code state
  const [promoInput, setPromoInput] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [promoAutoChecked, setPromoAutoChecked] = useState(false);

  // Delivery state
  const [deliveryType, setDeliveryType] = useState<"postal" | "personal">("postal");
  const [isWithin100km, setIsWithin100km] = useState(false);
  const [address, setAddress] = useState("");
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>();
  const [scheduledTime, setScheduledTime] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  // Guest checkout state
  const [guestEmail, setGuestEmail] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");

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
        const { finalPrice } = calculateItemPrice(item.product.price, item.weight);
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

  const handleApplyPromo = async () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    
    if (code !== "BIENVENUE15") {
      setPromoError("Code promo invalide");
      return;
    }

    if (!user) {
      setPromoError("Connecte-toi pour utiliser un code promo");
      return;
    }

    setPromoLoading(true);
    setPromoError("");

    try {
      // Check if already used
      const { data: usage } = await supabase
        .from("promo_code_usage")
        .select("id")
        .eq("user_id", user.id)
        .eq("code", "BIENVENUE15")
        .maybeSingle();

      if (usage) {
        setPromoError("Tu as déjà utilisé ce code 😅");
        setPromoLoading(false);
        return;
      }

      setPromoCode("BIENVENUE15");
      setPromoDiscount(15);
      toast.success("Code promo BIENVENUE15 appliqué ! -15% 🎉");
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
  };

  // Calculate discounted total
  const discountedTotal = promoDiscount > 0
    ? Math.round(totalPrice * (1 - promoDiscount / 100) * 100) / 100
    : totalPrice;
  const discountAmount = totalPrice - discountedTotal;

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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-card border-l border-border z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-6 h-6 text-primary" />
                <h2 className="font-display text-xl text-foreground">
                  Mon Panier
                </h2>
                <span className="text-sm text-muted-foreground">
                  ({totalItems} article{totalItems > 1 ? "s" : ""})
                </span>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6">
              {items.length === 0 && accessoryItems.length === 0 ? (
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
                            : calculateItemPrice(item.product.price, item.weight);
                          const discountLabel = useProPricing ? null : getDiscountLabel(item.weight);
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
                                      const step = item.weight <= 2.5 ? 0.5 : 2.5;
                                      updateWeight(item.product.id, Math.max(0.5, item.weight - step));
                                    }}
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
                                    className="p-1 hover:text-primary transition-colors bg-background rounded border border-border"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <button
                                  onClick={() => removeFromCart(item.product.id)}
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
                                    className="p-1 hover:text-primary transition-colors bg-background rounded border border-border"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="w-6 text-center text-xs font-medium">{item.quantity}</span>
                                  <button
                                    onClick={() => updateAccessoryQuantity(item.accessory.id, item.quantity + 1)}
                                    className="p-1 hover:text-primary transition-colors bg-background rounded border border-border"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <button
                                  onClick={() => removeAccessory(item.accessory.id)}
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

            {/* Footer */}
            {(items.length > 0 || accessoryItems.length > 0) && (
              <div className="p-6 border-t border-border space-y-4 max-h-[50vh] overflow-y-auto">
                {/* Delivery Section */}
                <DeliverySection
                  deliveryType={deliveryType}
                  setDeliveryType={setDeliveryType}
                  isWithin100km={isWithin100km}
                  setIsWithin100km={setIsWithin100km}
                  address={address}
                  setAddress={setAddress}
                  scheduledDate={scheduledDate}
                  setScheduledDate={setScheduledDate}
                  scheduledTime={scheduledTime}
                  setScheduledTime={setScheduledTime}
                  contactPhone={contactPhone}
                  setContactPhone={setContactPhone}
                />

                {/* Guest checkout form */}
                {!user && (
                  <div className="pt-4 border-t border-border space-y-3">
                    <h4 className="text-sm font-medium text-foreground">Vos coordonnées</h4>
                    <Input
                      type="email"
                      placeholder="Email *"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      className="h-9 text-sm"
                      required
                    />
                    <Input
                      type="text"
                      placeholder="Nom *"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="h-9 text-sm"
                      required
                    />
                    <Input
                      type="tel"
                      placeholder="Téléphone (optionnel)"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                )}

                {/* Promo Code Section */}
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">Code promo</span>
                  </div>
                  {promoCode ? (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/30">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-primary" />
                        <span className="text-sm font-mono font-bold text-primary">{promoCode}</span>
                        <span className="text-xs text-muted-foreground">(-{promoDiscount}%)</span>
                      </div>
                      <button onClick={handleRemovePromo} className="p-1 text-muted-foreground hover:text-destructive">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="BIENVENUE15"
                        value={promoInput}
                        onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoError(""); }}
                        className="h-9 text-sm font-mono uppercase"
                        maxLength={20}
                      />
                      <button
                        onClick={handleApplyPromo}
                        disabled={promoLoading || !promoInput.trim()}
                        className="px-4 h-9 text-sm btn-luxury disabled:opacity-50 whitespace-nowrap"
                      >
                        {promoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Appliquer"}
                      </button>
                    </div>
                  )}
                  {promoError && (
                    <p className="text-xs text-destructive mt-1">{promoError}</p>
                  )}
                </div>

                <div className="pt-4 border-t border-border">
                  {promoDiscount > 0 && (
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-muted-foreground">Sous-total</span>
                      <span className="text-sm text-muted-foreground line-through">{totalPrice.toFixed(2)}€</span>
                    </div>
                  )}
                  {promoDiscount > 0 && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-primary">Réduction -{promoDiscount}%</span>
                      <span className="text-sm text-primary">-{discountAmount.toFixed(2)}€</span>
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
                <PaymentButton
                  items={items}
                  accessoryItems={accessoryItems}
                  sampleItems={sampleItems}
                  totalPrice={discountedTotal}
                  totalFlowerWeight={totalFlowerWeight}
                  deliveryType={deliveryType}
                  address={address}
                  scheduledDate={scheduledDate}
                  scheduledTime={scheduledTime}
                  contactPhone={contactPhone}
                  guestEmail={guestEmail}
                  guestName={guestName}
                  guestPhone={guestPhone}
                  promoCode={promoCode}
                />
                <button
                  onClick={clearCart}
                  className="w-full text-sm text-muted-foreground hover:text-destructive transition-colors"
                >
                  Vider le panier
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
