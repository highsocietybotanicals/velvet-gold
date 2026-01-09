import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, ShoppingBag, Trash2, Gift, Package, Leaf, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { Input } from "@/components/ui/input";
import { calculateItemPrice, getDiscountLabel, getGifts, calculateAccessoryPrice } from "@/lib/pricing";

// Import corrected accessory images from accessories data
import { pochonMoyen, feuillesSlim, briquetHSB } from "@/data/accessories";

const CartDrawer = () => {
  const navigate = useNavigate();
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
    totalPrice,
    isCartOpen,
    setIsCartOpen,
  } = useCart();

  const totalGifts = getGifts(totalFlowerWeight);
  
  // Calculate sample allowance
  const sampleAllowance = Math.floor(totalFlowerWeight / 12);
  const samplesChosen = sampleItems.length;
  const samplesRemaining = sampleAllowance - samplesChosen;

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
                          const priceInfo = calculateItemPrice(item.product.price, item.weight);
                          const discountLabel = getDiscountLabel(item.weight);
                          
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
                                  {item.product.price}€/g
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
                                {priceInfo.discount > 0 && (
                                  <>
                                    <p className="text-xs text-muted-foreground line-through">
                                      {priceInfo.rawPrice.toFixed(2)}€
                                    </p>
                                    <span className="text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">
                                      {discountLabel}
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
              <div className="p-6 border-t border-border space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-display text-2xl text-primary">
                    {totalPrice.toFixed(2)}€
                  </span>
                </div>
                <button className="w-full btn-luxury py-4">
                  Procéder au paiement
                </button>
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
