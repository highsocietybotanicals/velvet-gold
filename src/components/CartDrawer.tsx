import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, ShoppingBag, Trash2, Gift, Package } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { Input } from "@/components/ui/input";
import { calculateItemPrice, getDiscountLabel, getGifts } from "@/lib/pricing";

const CartDrawer = () => {
  const {
    items,
    removeFromCart,
    updateWeight,
    clearCart,
    totalItems,
    totalWeight,
    totalPrice,
    isCartOpen,
    setIsCartOpen,
  } = useCart();

  const totalGifts = getGifts(totalWeight);

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
                  ({totalItems} article{totalItems > 1 ? "s" : ""} · {totalWeight.toFixed(1)}g)
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
              {items.length === 0 ? (
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
                <div className="space-y-4">
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
                        className="flex gap-4 p-4 bg-muted/30 rounded-lg border border-border/50"
                      >
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-20 h-20 object-cover rounded-lg"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder.svg';
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-display text-foreground truncate">
                            {item.product.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {item.product.cbdPercentage} CBD · {item.product.price}€/g
                          </p>
                          
                          {/* Weight input */}
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => {
                                // Smarter decrement: use smaller steps for small weights
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
                              className="h-7 w-16 text-center text-sm border-primary/30"
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
                        <div className="flex flex-col items-end gap-2">
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="p-1 text-destructive hover:bg-destructive/10 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <div className="text-right">
                            <p className="font-display text-lg text-primary font-bold">
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
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-6 border-t border-border space-y-4">
                {/* Gifts display */}
                {totalGifts && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
                    {totalGifts.type === "kit" ? (
                      <Package className="w-5 h-5 text-primary" />
                    ) : (
                      <Gift className="w-5 h-5 text-primary" />
                    )}
                    <span className="text-sm text-primary font-medium">
                      + {totalGifts.label} offert{totalGifts.count > 1 ? "s" : ""}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total ({totalWeight.toFixed(1)}g)</span>
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
