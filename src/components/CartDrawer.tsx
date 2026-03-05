import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, ShoppingBag, Trash2, Gift, Package, Leaf, Sparkles, CreditCard, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useProPrices } from "@/hooks/useProPrices";
import { Input } from "@/components/ui/input";
import { calculateItemPrice, getDiscountLabel, getGifts, calculateAccessoryPrice, calculateProItemPrice } from "@/lib/pricing";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import DeliverySection from "./DeliverySection";

// Import corrected accessory images from accessories data
import { pochonMoyen, feuillesSlim, briquetHSB } from "@/data/accessories";

const PaymentButton = ({ items, accessoryItems, totalPrice, totalFlowerWeight, deliveryType, address, scheduledDate, scheduledTime, contactPhone, guestEmail, guestName, guestPhone }: any) => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const handlePayment = async () => {
    if (!user && (!guestEmail || !guestEmail.includes("@"))) {
      toast.error("Veuillez renseigner un email valide pour commander");
      return;
    }
    if (totalPrice <= 0) return;
    setIsLoading(true);
    try {
      const orderItems = [
        ...items.map((item: any) => ({
          productId: item.product.id,
          productName: item.product.name,
          productType: item.product.type || "flower",
          weight: item.weight,
          quantity: null,
          unitPrice: item.product.price,
          totalPrice: item.weight * item.product.price,
        })),
        ...accessoryItems.map((item: any) => ({
          productId: item.accessory.id,
          productName: item.accessory.name,
          productType: "accessory",
          weight: null,
          quantity: item.quantity,
          unitPrice: item.accessory.price,
          totalPrice: item.accessory.price * item.quantity,
        })),
      ];

      const body: any = {
        amount: totalPrice,
        items: orderItems,
        deliveryType,
        deliveryAddress: address || null,
        deliveryDate: scheduledDate?.toISOString()?.split("T")[0] || null,
        deliveryTime: scheduledTime || null,
        contactPhone: contactPhone || null,
        totalFlowerWeight,
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
      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      toast.error("Erreur lors de la création du paiement. Veuillez réessayer.");
    } finally {
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
  } = useCart();

  // Delivery state
  const [deliveryType, setDeliveryType] = useState<"postal" | "personal">("postal");
  const [isWithin100km, setIsWithin100km] = useState(false);
  const [address, setAddress] = useState("");
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>();
  const [scheduledTime, setScheduledTime] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  // No gifts for Pro users with validated VAT
  const totalGifts = isProWithValidatedVat ? null : getGifts(totalFlowerWeight);
  
  // Calculate sample allowance - no samples for Pro users with validated VAT
  const sampleAllowance = isProWithValidatedVat ? 0 : Math.floor(totalFlowerWeight / 12);
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

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
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
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-primary/20">
                          <div className="flex items-center gap-2">
                            <img src={pochonMoyen} alt="Pochon" className="w-8 h-8 rounded object-cover" />
                            <div>
                              <p className="text-xs text-foreground">{totalGifts.contents.pochonMoyen}x Pochon Moyen</p>
                              <p className="text-xs text-green-400 font-medium">OFFERT</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <img src={feuillesSlim} alt="Feuilles" className="w-8 h-8 rounded object-cover" />
                            <div>
                              <p className="text-xs text-foreground">{totalGifts.contents.feuillesSlim}x Feuilles Slim</p>
                              <p className="text-xs text-green-400 font-medium">OFFERT</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <img src={briquetHSB} alt="Briquet" className="w-8 h-8 rounded object-cover" />
                            <div>
                              <p className="text-xs text-foreground">{totalGifts.contents.briquetHSB}x Briquet HSB</p>
                              <p className="text-xs text-green-400 font-medium">OFFERT</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center">
                              <span className="text-primary text-xs">🎀</span>
                            </div>
                            <div>
                              <p className="text-xs text-foreground">{totalGifts.contents.elastique}x Élastique</p>
                              <p className="text-xs text-green-400 font-medium">OFFERT</p>
                            </div>
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

                <div className="pt-4 border-t border-border">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-display text-2xl text-primary">
                      {totalPrice.toFixed(2)}€
                    </span>
                  </div>
                  {isProActive && (
                    <p className="text-xs text-primary mt-1">Prix professionnel appliqué</p>
                  )}
                </div>
                <PaymentButton
                  items={items}
                  accessoryItems={accessoryItems}
                  totalPrice={totalPrice}
                  totalFlowerWeight={totalFlowerWeight}
                  deliveryType={deliveryType}
                  address={address}
                  scheduledDate={scheduledDate}
                  scheduledTime={scheduledTime}
                  contactPhone={contactPhone}
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
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
