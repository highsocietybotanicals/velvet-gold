import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, Minus, ShoppingCart } from "lucide-react";
import { useCart, Accessory } from "@/contexts/CartContext";
import { calculateAccessoryPrice, ACCESSORY_BULK_THRESHOLD } from "@/lib/pricing";

interface AccessoryCardProps {
  accessory: Accessory;
  index: number;
}

const AccessoryCard = ({ accessory, index }: AccessoryCardProps) => {
  const { addAccessory } = useCart();
  const [quantity, setQuantity] = useState(1);

  const priceInfo = useMemo(() => {
    return calculateAccessoryPrice(accessory.price, quantity);
  }, [accessory.price, quantity]);

  const handleAddToCart = () => {
    addAccessory(accessory, quantity);
    setQuantity(1);
  };

  const increment = () => setQuantity((q) => Math.min(q + 1, 100));
  const decrement = () => setQuantity((q) => Math.max(q - 1, 1));

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="group bg-card rounded-lg border border-border/50 overflow-hidden"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-carbon-deep">
        <img
          src={accessory.image}
          alt={accessory.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => {
            e.currentTarget.src = "/placeholder.svg";
          }}
        />
        {quantity >= ACCESSORY_BULK_THRESHOLD && (
          <div className="absolute top-2 right-2 bg-green-500/90 text-white text-xs px-2 py-1 rounded-full font-medium">
            -33%
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        <div>
          <h4 className="font-display text-sm text-primary truncate">
            {accessory.name}
          </h4>
          <p className="text-xs text-muted-foreground truncate">
            {accessory.description}
          </p>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="font-display text-lg text-primary">
            {priceInfo.finalTotal.toFixed(2)}€
          </span>
          {priceInfo.discount > 0 && (
            <span className="text-xs text-muted-foreground line-through">
              {priceInfo.rawTotal.toFixed(2)}€
            </span>
          )}
        </div>

        {/* Unit price */}
        <p className="text-xs text-muted-foreground">
          {accessory.price.toFixed(2)}€ / unité
        </p>

        {/* Quantity controls */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <button
              onClick={decrement}
              className="p-1 hover:text-primary transition-colors bg-background rounded border border-border"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="w-8 text-center text-sm font-medium">{quantity}</span>
            <button
              onClick={increment}
              className="p-1 hover:text-primary transition-colors bg-background rounded border border-border"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          <button
            onClick={handleAddToCart}
            className="p-2 bg-primary text-primary-foreground rounded-full transition-all hover:glow-gold hover:scale-110"
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
        </div>

        {/* Bulk discount hint */}
        {quantity < ACCESSORY_BULK_THRESHOLD && (
          <p className="text-xs text-muted-foreground/70 text-center">
            -33% dès {ACCESSORY_BULK_THRESHOLD} unités
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default AccessoryCard;
