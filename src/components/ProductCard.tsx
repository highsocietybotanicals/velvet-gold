import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Leaf, Sparkles, ShoppingCart, Zap, Crown, Gem } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useProducts } from "@/hooks/useProducts";
import { useProPrices } from "@/hooks/useProPrices";
import { Product, TerpeneProfile, PriceGroup } from "@/data/products";
import { Input } from "@/components/ui/input";
import { PRESET_WEIGHTS, calculatePrice, getLowestPricePerGram } from "@/lib/pricing";
import GoldParticles from "@/components/GoldParticles";


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
  const { isPro, isProValidated, profile } = useAuth();
  const { getPrice } = useProducts();
  const [selectedWeight, setSelectedWeight] = useState<number>(1);
  const [customWeight, setCustomWeight] = useState<string>("1");

  // Get dynamic price from database
  const dbPrice = getPrice(product.id);
  const basePrice = dbPrice?.price ?? product.price;
  const { getProPrice } = useProPrices();
  const proPrice = getProPrice(product.id);

  // Check if user qualifies for Pro HT pricing (requires VAT validated by admin)
  const isProWithValidatedVat = isPro && isProValidated && !!profile?.vat_number && profile?.is_vat_validated;

  // Get price group from product (default to A if not defined)
  const priceGroup: PriceGroup = product.priceGroup || "A";

  const priceInfo = useMemo(() => {
    if (isProWithValidatedVat && proPrice) {
      // Pro with validated VAT: flat HT price per gram, no tiered discounts
      const total = proPrice * selectedWeight;
      return {
        finalPrice: total.toFixed(2),
        rawPrice: (basePrice * selectedWeight).toFixed(2),
        discount: 0,
        discountLabel: "",
        savings: ((basePrice * selectedWeight) - total).toFixed(2),
        isHT: true,
      };
    }
    // Standard pricing with tiered discounts based on price group
    return {
      ...calculatePrice(basePrice, selectedWeight, priceGroup, product.id),
      isHT: false,
    };
  }, [basePrice, proPrice, selectedWeight, isProWithValidatedVat, priceGroup, product.id]);

  const lowestPerGram = useMemo(
    () => getLowestPricePerGram(basePrice, priceGroup, product.id),
    [basePrice, priceGroup, product.id]
  );




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
      className={`group product-card rounded-lg border overflow-hidden relative ${
        product.isExotique
          ? "bg-card border-purple-600/50 hover:border-purple-500 hover:shadow-[0_0_25px_rgba(168,85,247,0.4)]"
          : product.isNectarDivin
          ? "bg-black border-primary/50 hover:border-primary hover:shadow-[0_0_30px_rgba(212,175,55,0.35)]"
          : product.isForceNoire
          ? "bg-card border-red-900/50 hover:border-red-800/80 hover:shadow-[0_0_20px_rgba(127,29,29,0.3)]"
          : "bg-card border-border/50"
      }`}
    >
      {product.isNectarDivin && (
        <div className="absolute inset-0 pointer-events-none z-0 opacity-70">
          <GoldParticles />
        </div>
      )}
      {product.isExotique && (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute -inset-1 bg-gradient-to-tr from-purple-900/10 via-purple-500/5 to-fuchsia-600/10 animate-pulse" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-fuchsia-400/40 to-transparent" />
        </div>
      )}
      <Link to={`/produit/${product.id}`} className="relative z-10 block">
        {/* Image container with pochon overlay */}
        <div className={`relative aspect-square overflow-hidden ${product.isNectarDivin ? "bg-black" : "bg-carbon-deep"}`}>
          <div className="absolute inset-0 bg-gradient-gold-radial opacity-0 group-hover:opacity-40 transition-opacity duration-500" />
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            onError={(e) => {
              e.currentTarget.src = '/placeholder.svg';
            }}
          />

          {/* Rupture de stock — "Victime de son succès" */}
          {product.isOutOfStock && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/70 backdrop-blur-[2px]">
              <div className="border border-primary/60 bg-black/80 px-6 py-4 rounded-sm shadow-[0_0_30px_rgba(212,175,55,0.35)] text-center mx-4">
                <span className="block text-[10px] uppercase tracking-[0.3em] text-primary/80 mb-1">
                  Rupture de stock
                </span>
                <span className="font-display text-lg text-primary italic">
                  Victime de son succès
                </span>
                <span className="block text-[10px] text-muted-foreground mt-1 tracking-wider">
                  Bientôt de retour
                </span>
              </div>
            </div>
          )}

          {/* Exotique badge (priorité absolue) */}
          {product.isExotique && (
            <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-gradient-to-r from-purple-950/90 to-purple-700/30 backdrop-blur-sm px-3 py-1.5 rounded-full border border-purple-500/70 shadow-[0_0_18px_rgba(168,85,247,0.5)]">
              <Gem className="w-3 h-3 text-purple-300" />
              <span className="text-xs font-bold text-purple-200 tracking-wider uppercase">Exotique</span>
            </div>
          )}

          {/* Nectar Divin badge (priorité) */}
          {product.isNectarDivin && (
            <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-gradient-to-r from-black/90 to-primary/30 backdrop-blur-sm px-3 py-1.5 rounded-full border border-primary/70 shadow-[0_0_15px_rgba(212,175,55,0.4)]">
              <Crown className="w-3 h-3 text-primary" />
              <span className="text-xs font-bold text-primary tracking-wider uppercase">Nectar Divin</span>
            </div>
          )}

          {/* Force Noire badge */}
          {!product.isNectarDivin && !product.isExotique && product.isForceNoire && (
            <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-gradient-to-r from-red-950/90 to-black/90 backdrop-blur-sm px-3 py-1.5 rounded-full border border-red-800/60">
              <Zap className="w-3 h-3 text-red-400" />
              <span className="text-xs font-bold text-red-300 tracking-wider uppercase">Force Noire</span>
            </div>
          )}

          {/* Badge produit (Cali Genetics, etc.) - only if NOT Force Noire / Nectar Divin */}
          {!product.isForceNoire && !product.isNectarDivin && !product.isExotique && (product as any).badge && (
            <div className={`absolute top-4 left-4 flex items-center gap-2 backdrop-blur-sm px-3 py-1.5 rounded-full border ${
              (product as any).badge === "Cali Genetics"
                ? "bg-gradient-to-r from-yellow-500/20 to-primary/20 border-yellow-500/50 text-yellow-400"
                : "bg-background/90 border-primary/30 text-primary"
            }`}>
              <Sparkles className="w-3 h-3" />
              <span className="text-xs font-medium">{(product as any).badge}</span>
            </div>
          )}

          {/* CBD/molecule badge */}
          <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-3 py-1.5 rounded-full">
            <span className="text-xs font-bold">{product.isForceNoire || product.isNectarDivin || product.isExotique || product.cbdPercentage.includes('CBD') ? product.cbdPercentage : `${product.cbdPercentage} CBD`}</span>
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
                {isProWithValidatedVat && proPrice ? "Prix/g HT" : "À partir de"}
              </p>
              <p className="font-display text-lg text-primary">
                {isProWithValidatedVat && proPrice
                  ? `${proPrice}€`
                  : `${lowestPerGram.toFixed(2)}€/g`}
              </p>
            </div>
          </div>
        </div>
      </Link>

      {/* Weight selection - outside Link */}
      {product.isOutOfStock ? (
        <div className="relative z-10 px-5 pb-5" onClick={(e) => e.stopPropagation()}>
          <div className="border border-primary/30 rounded-md bg-primary/5 px-4 py-3 text-center">
            <p className="font-display text-sm text-primary italic">Victime de son succès</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Cette variété est momentanément épuisée — réapprovisionnement en cours.
            </p>
          </div>
        </div>
      ) : (
      <div className="relative z-10 px-5 pb-5 space-y-3" onClick={(e) => e.stopPropagation()}>
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
              {priceInfo.isHT && (
                <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">
                  HT
                </span>
              )}
              {!priceInfo.isHT && priceInfo.discount > 0 && (
                <>
                  <span className="text-sm text-muted-foreground line-through">
                    {priceInfo.rawPrice}€
                  </span>
                  <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">
                    {priceInfo.discountLabel}
                  </span>
                </>
              )}
            </div>
            {priceInfo.isHT && (
              <span className="text-xs text-primary">
                Économie: {priceInfo.savings}€ vs TTC
              </span>
            )}
            {!priceInfo.isHT && priceInfo.discount > 0 && (
              <span className="text-xs text-primary">
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

      </div>
    </motion.div>
  );
};

export default ProductCard;
