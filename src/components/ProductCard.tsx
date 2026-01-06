import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Leaf, Sparkles, ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { Product } from "@/data/products";
interface TerpeneProfile {
  boise: number;
  fruite: number;
  epice: number;
  terreux: number;
}

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
    <div className="relative w-24 h-24">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full">
        {/* Background circles */}
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
        
        {/* Axis lines */}
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

        {/* Data polygon */}
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

        {/* Data points */}
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

      {/* Labels */}
      <span className="absolute -top-1 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground">
        Boisé
      </span>
      <span className="absolute top-1/2 -right-2 -translate-y-1/2 text-[10px] text-muted-foreground">
        Fruité
      </span>
      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground">
        Épicé
      </span>
      <span className="absolute top-1/2 -left-3 -translate-y-1/2 text-[10px] text-muted-foreground">
        Terreux
      </span>
    </div>
  );
};

const ProductCard = ({ product, index }: ProductCardProps) => {
  const { addToCart } = useCart();

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.15 }}
      className="group product-card bg-card rounded-lg border border-border/50 overflow-hidden relative"
    >
      <Link to={`/produit/${product.id}`}>
        {/* Image container */}
        <div className="relative aspect-square overflow-hidden bg-carbon-deep">
          <div className="absolute inset-0 bg-gradient-gold-radial opacity-0 group-hover:opacity-40 transition-opacity duration-500" />
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          
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
        <div className="p-6">
          {/* Title */}
          <div className="mb-4">
            <h3 className="font-display text-2xl text-primary mb-1">
              {product.name}
            </h3>
            <p className="text-sm text-muted-foreground italic">
              {product.subtitle}
            </p>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground mb-6 line-clamp-2 font-body">
            {product.description}
          </p>

          {/* Terpene radar and price */}
          <div className="flex items-end justify-between">
            <TerpeneRadar terpenes={product.terpenes} />
            
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                À partir de
              </p>
              <p className="font-display text-3xl text-gold-gradient">
                {product.price}€
              </p>
            </div>
          </div>
        </div>
      </Link>

      {/* Add to cart button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          addToCart(product);
        }}
        className="absolute bottom-6 right-6 p-3 bg-primary text-primary-foreground rounded-full opacity-0 group-hover:opacity-100 transition-all hover:glow-gold hover:scale-110"
      >
        <ShoppingCart className="w-5 h-5" />
      </button>
    </motion.div>
  );
};

export default ProductCard;
