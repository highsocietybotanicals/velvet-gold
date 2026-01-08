import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Leaf, Sparkles, ShoppingCart, Gift, Package, ChevronDown } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { Product, TerpeneProfile } from "@/data/products";
import { Input } from "@/components/ui/input";
import { PRESET_WEIGHTS, calculatePrice, getGifts } from "@/lib/pricing";
import { getPochonImage, getPochonLabel } from "@/data/accessories";

interface ProductCardProps {
  product: Product;
  index: number;
}

const TerpeneRadar = ({ terpenes }: { terpenes: TerpeneProfile }) => {
  const labels = [
    { key: "boise", label: "Boisé", angle: 0 },
    { key: "fruite", label: "Fruité", angle: 90 },
    { key: "epice", label: "Épicé", angle: 180 },
    { key: "terreux", label: "Terreux", angle: 270 },
  ];

  const size = 100;
  const center = size / 2;
  const maxRadius = 35;

  const getPoint = (angle: number, value: number) => {
    const radian = (angle - 90) * (Math.PI / 180);
    const radius = (value / 100) * maxRadius;
    return {
      x: center + radius * Math.cos(radian),
      y: center + radius * Math.sin(radian),
    };
  };

  const points = labels.map((l) => {
    const value = terpenes[l.key as keyof TerpeneProfile];
    return getPoint(l.angle, value);
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ") + " Z";

  return (
    <div className="relative w-20 h-20">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full">
        {[25, 50, 75, 100].map((r) => (
          <circle
            key={r}
            cx={center}
            cy={center}
            r={(r / 100) * maxRadius}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth="0.5"
            opacity="0.3"
          />
        ))}
        
        {labels.map((l) => {
          const end = getPoint(l.angle, 100);
          return (
            <line
              key={l.key}
              x1={center}
              y1={center}
              x2={end.x}
              y2={end.y}
              stroke="hsl(var(--border))"
              strokeWidth="0.5"
              opacity="0.3"
            />
          );
        })}

        <motion.path
          d={pathD}
          fill="hsl(var(--primary) / 0.2)"
          stroke="hsl(var(--primary))"
          strokeWidth="1.5"
          initial={{ opacity: 0, scale: 0 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          style={{ transformOrigin: "center" }}
        />

        {points.map((p, i) => (
          <motion.circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="3"
            fill="hsl(var(--primary))"
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.5 + i * 0.1 }}
          />
        ))}
      </svg>

      <span className="absolute -top-1 left-1/2 -translate-x-1/2 text-[8px] text-muted-foreground">
        Boisé
      </span>
      <span className="absolute top-1/2 -right-1 -translate-y-1/2 text-[8px] text-muted-foreground">
        Fruité
      </span>
      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] text-muted-foreground">
        Épicé
      </span>
      <span className="absolute top-1/2 -left-2 -translate-y-1/2 text-[8px] text-muted-foreground">
        Terreux
      </span>
    </div>
  );
};

const ProductCard = ({ product, index }: ProductCardProps) => {
  const { addToCart } = useCart();
  const [selectedWeight, setSelectedWeight] = useState<number>(2.5);
  const [customWeight, setCustomWeight] = useState<string>("2.5");

  const priceInfo = useMemo(() => {
    return calculatePrice(product.price, selectedWeight);
  }, [product.price, selectedWeight]);

  const gifts = useMemo(() => {
    return getGifts(selectedWeight);
  }, [selectedWeight]);

  const pochonImage = useMemo(() => {
    return getPochonImage(selectedWeight);
  }, [selectedWeight]);

  const pochonLabel = useMemo(() => {
    return getPochonLabel(selectedWeight);
  }, [selectedWeight]);

  const handlePresetClick = (weight: number) => {
    setSelectedWeight(weight);
    setCustomWeight(weight.toString());
  };

  const handleCustomWeightChange = (value: string) => {
    setCustomWeight(value);
    // Allow empty or zero temporarily for typing
    if (value === '' || value === '0') {
      return;
    }
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0 && numValue <= 1000) {
      setSelectedWeight(numValue);
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, selectedWeight);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.15 }}
      className="group product-card bg-card rounded-lg border border-border/50 overflow-hidden relative"
    >
      <Link to={`/produit/${product.id}`}>
        {/* Image container with pochon overlay */}
        <div className="relative aspect-square overflow-hidden bg-carbon-deep">
          <div className="absolute inset-0 bg-gradient-gold-radial opacity-0 group-hover:opacity-40 transition-opacity duration-500" />
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            onError={(e) => {
              e.currentTarget.src = '/placeholder.svg';
            }}
          />
          
          {/* Pochon indicator - bottom right */}
          <motion.div
            key={pochonImage}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="absolute bottom-3 right-3 bg-background/90 backdrop-blur-sm rounded-lg p-1.5 border border-primary/30"
          >
            <img
              src={pochonImage}
              alt={pochonLabel}
              className="w-10 h-10 object-cover rounded"
            />
            <p className="text-[8px] text-center text-primary mt-0.5 font-medium truncate max-w-12">
              {pochonLabel}
            </p>
          </motion.div>
          
          {/* Mood badge */}
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-full border border-primary/30">
            <Sparkles className="w-3 h-3 text-primary" />
            <span className="text-xs text-primary font-medium">{product.mood}</span>
          </div>

          {/* CBD badge */}
          <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-3 py-1.5 rounded-full">
            <span className="text-xs font-bold">{product.cbdPercentage} CBD</span>
          </div>

          {/* Magnifier overlay on hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-20 h-20 rounded-full border-2 border-primary/50 flex items-center justify-center bg-background/20 backdrop-blur-sm">
              <Leaf className="w-8 h-8 text-primary" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Title */}
          <div className="mb-3">
            <h3 className="font-display text-xl text-primary mb-1">
              {product.name}
            </h3>
            <p className="text-xs text-muted-foreground italic">
              {product.subtitle}
            </p>
          </div>

          {/* Terpene radar */}
          <div className="flex items-start justify-between mb-4">
            <TerpeneRadar terpenes={product.terpenes} />
            
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Prix/g
              </p>
              <p className="font-display text-lg text-primary">
                {product.price}€
              </p>
            </div>
          </div>
        </div>
      </Link>

      {/* Weight selection - outside Link */}
      <div className="px-5 pb-5 space-y-3" onClick={(e) => e.stopPropagation()}>
        {/* Preset weight buttons */}
        <div className="flex flex-wrap gap-1.5">
          {PRESET_WEIGHTS.map((weight) => (
            <button
              key={weight}
              onClick={() => handlePresetClick(weight)}
              className={`px-2.5 py-1.5 text-xs rounded-md border transition-all ${
                selectedWeight === weight
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border/50 text-muted-foreground hover:border-primary/50 hover:text-primary"
              }`}
            >
              {weight}g
            </button>
          ))}
        </div>

        {/* Custom weight input */}
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min="0.5"
            max="1000"
            step="0.5"
            value={customWeight}
            onChange={(e) => handleCustomWeightChange(e.target.value)}
            className="h-9 text-sm border-primary/30 focus:border-primary bg-background/50"
            placeholder="Poids exact..."
          />
          <span className="text-sm text-muted-foreground">g</span>
        </div>

        {/* Price display */}
        <div className="flex items-center justify-between pt-2 border-t border-border/30">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-2xl text-primary font-bold">
                {priceInfo.finalPrice}€
              </span>
              {priceInfo.discount > 0 && (
                <>
                  <span className="text-sm text-muted-foreground line-through">
                    {priceInfo.rawPrice}€
                  </span>
                  <span className="text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">
                    {priceInfo.discountLabel}
                  </span>
                </>
              )}
            </div>
            {priceInfo.discount > 0 && (
              <span className="text-xs text-green-400">
                Économie: {priceInfo.savings}€
              </span>
            )}
          </div>

          {/* Add to cart button */}
          <button
            onClick={handleAddToCart}
            className="p-3 bg-primary text-primary-foreground rounded-full transition-all hover:glow-gold hover:scale-110"
          >
            <ShoppingCart className="w-5 h-5" />
          </button>
        </div>

        {/* Gifts display */}
        {gifts && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-2 rounded-md bg-primary/10 border border-primary/20"
          >
            <div className="flex items-center gap-2">
              {gifts.type === "kit" ? (
                <Package className="w-4 h-4 text-primary" />
              ) : (
                <Gift className="w-4 h-4 text-primary" />
              )}
              <span className="text-xs text-primary font-medium">
                + {gifts.label} offert{gifts.count > 1 ? "s" : ""}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 ml-6">
              ({gifts.contents.pochonMoyen}x Pochon, {gifts.contents.feuillesSlim}x Slim, {gifts.contents.briquetHSB}x Briquet)
            </p>
          </motion.div>
        )}

        {/* Link to accessories */}
        <a
          href="#accessoires"
          className="flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors pt-1"
        >
          Besoin d'un pochon en plus ?
          <ChevronDown className="w-3 h-3" />
        </a>
      </div>
    </motion.div>
  );
};

export default ProductCard;
