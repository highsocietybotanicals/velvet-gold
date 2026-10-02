import { useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Leaf, Sparkles, Zap, Crown, Gem } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProducts } from "@/hooks/useProducts";
import { useProPrices } from "@/hooks/useProPrices";
import { Product, TerpeneProfile, PriceGroup } from "@/data/products";
import { getLowestPricePerGram } from "@/lib/pricing";
import { responsiveProductSrcSet } from "@/lib/responsiveProductImage";
import { Button } from "@/components/ui/button";
import GoldParticles from "@/components/GoldParticles";

interface ProductCardProps {
  product: Product;
  index: number;
}

const CardTerpeneRadar = ({ terpenes }: { terpenes: TerpeneProfile }) => {
  const labels = [
    { key: "boise", label: "Boisé", angle: 0 },
    { key: "fruite", label: "Fruité", angle: 90 },
    { key: "epice", label: "Épicé", angle: 180 },
    { key: "terreux", label: "Terreux", angle: 270 },
  ];
  const size = 100;
  const center = size / 2;
  const maxRadius = 35;
  const point = (angle: number, value: number) => {
    const radian = (angle - 90) * (Math.PI / 180);
    const radius = (value / 100) * maxRadius;
    return { x: center + radius * Math.cos(radian), y: center + radius * Math.sin(radian) };
  };
  const points = labels.map((label) => point(label.angle, terpenes[label.key as keyof TerpeneProfile]));
  const path = `${points.map((p, i) => `${i ? "L" : "M"} ${p.x} ${p.y}`).join(" ")} Z`;

  return (
    <div className="relative h-20 w-20" aria-label="Profil terpénique">
      <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
        {[25, 50, 75, 100].map((radius) => <circle key={radius} cx={center} cy={center} r={(radius / 100) * maxRadius} fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.3" />)}
        {labels.map((label) => { const end = point(label.angle, 100); return <line key={label.key} x1={center} y1={center} x2={end.x} y2={end.y} stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.3" />; })}
        <path d={path} fill="hsl(var(--primary) / 0.2)" stroke="hsl(var(--primary))" strokeWidth="1.5" />
        {points.map((p, index) => <circle key={labels[index].key} cx={p.x} cy={p.y} r="2.5" fill="hsl(var(--primary))" />)}
      </svg>
      <span className="absolute -top-1 left-1/2 -translate-x-1/2 text-[8px] text-muted-foreground">Boisé</span>
      <span className="absolute top-1/2 -right-1 -translate-y-1/2 text-[8px] text-muted-foreground">Fruité</span>
      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] text-muted-foreground">Épicé</span>
      <span className="absolute top-1/2 -left-2 -translate-y-1/2 text-[8px] text-muted-foreground">Terreux</span>
    </div>
  );
};

const ProductCard = ({ product, index }: ProductCardProps) => {
  const { isPro, isProValidated, profile } = useAuth();
  const { getPrice } = useProducts();
  const { getProPrice } = useProPrices();
  const previewRef = useRef<HTMLVideoElement>(null);
  const basePrice = getPrice(product.id)?.price ?? product.price;
  const proPrice = getProPrice(product.id);
  const isProWithValidatedVat = isPro && isProValidated && !!profile?.vat_number && profile?.is_vat_validated;
  const priceGroup: PriceGroup = product.priceGroup || "A";
  const lowestPerGram = useMemo(() => getLowestPricePerGram(basePrice, priceGroup, product.id), [basePrice, priceGroup, product.id]);
  const srcSet = responsiveProductSrcSet(product.image);

  const handlePreviewEnter = () => {
    const video = previewRef.current;
    if (!video || !window.matchMedia("(hover: hover)").matches) return;
    video.play().catch(() => undefined);
  };
  const handlePreviewLeave = () => {
    const video = previewRef.current;
    if (!video) return;
    video.pause();
    video.currentTime = 0;
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, delay: (index % 3) * 0.08 }}
      onMouseEnter={handlePreviewEnter}
      onMouseLeave={handlePreviewLeave}
      className={`group product-card rounded-lg border overflow-hidden relative ${product.isExotique ? "bg-card border-purple-600/50 hover:border-purple-500" : product.isNectarDivin ? "bg-card border-primary/50 hover:border-primary" : product.isForceNoire ? "bg-card border-red-900/50 hover:border-red-800/80" : "bg-card border-border/50"}`}
    >
      {product.isNectarDivin && <div className="absolute inset-0 z-0 opacity-70 pointer-events-none"><GoldParticles /></div>}
      <Link to={`/produit/${product.id}`} className="relative z-10 block" aria-label={`Découvrir ${product.name}`}>
        <div className="relative aspect-square overflow-hidden bg-carbon-deep">
          <img src={product.image} srcSet={srcSet} sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw" alt={product.name} loading="lazy" width={1200} height={1200} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" onError={(event) => { event.currentTarget.src = "/placeholder.svg"; event.currentTarget.removeAttribute("srcset"); }} />
          {product.video && <video ref={previewRef} src={product.video} muted loop playsInline preload="none" className="absolute inset-0 hidden h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none md:block" />}
          <div className="absolute inset-0 bg-gradient-to-t from-card/70 via-transparent to-transparent" />
          {product.isOutOfStock && <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/75 backdrop-blur-[2px]"><div className="mx-4 border border-primary/60 bg-background/85 px-5 py-4 text-center"><span className="block text-[10px] uppercase tracking-[0.3em] text-primary/80">Rupture de stock</span><span className="mt-1 block font-display text-lg italic text-primary">Victime de son succès</span></div></div>}
          {product.isExotique ? <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full border border-purple-500/70 bg-card/90 px-3 py-1.5"><Gem className="h-3 w-3 text-purple-300" /><span className="text-xs font-bold uppercase tracking-wider text-purple-200">Exotique</span></div> : product.isNectarDivin ? <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full border border-primary/70 bg-card/90 px-3 py-1.5"><Crown className="h-3 w-3 text-primary" /><span className="text-xs font-bold uppercase tracking-wider text-primary">Nectar Divin</span></div> : product.isForceNoire ? <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full border border-red-800/60 bg-card/90 px-3 py-1.5"><Zap className="h-3 w-3 text-red-400" /><span className="text-xs font-bold uppercase tracking-wider text-red-300">Force Noire</span></div> : product.badge && <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-primary/30 bg-background/90 px-3 py-1.5 text-primary"><Sparkles className="h-3 w-3" /><span className="text-xs font-medium">{product.badge}</span></div>}
          {product.molecule && <div className="absolute left-4 top-14 border border-primary/60 bg-background/85 px-3 py-1"><span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">{product.molecule}</span></div>}
          <div className="absolute right-4 top-4 rounded-full bg-primary px-3 py-1.5 text-primary-foreground"><span className="text-xs font-bold">{product.isForceNoire || product.isNectarDivin || product.isExotique || product.cbdPercentage.includes("CBD") ? product.cbdPercentage : `${product.cbdPercentage} CBD`}</span></div>
          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100"><div className="flex h-16 w-16 items-center justify-center rounded-full border border-primary/50 bg-background/30 backdrop-blur-sm"><Leaf className="h-7 w-7 text-primary" /></div></div>
        </div>
        <div className="p-5">
          <h3 className="font-display text-xl text-primary">{product.name}</h3>
          <p className="mt-1 text-xs italic text-muted-foreground">{product.subtitle}</p>
          <div className="mt-4 flex items-center justify-between">
            <CardTerpeneRadar terpenes={product.terpenes} />
            <div className="text-right"><p className="text-xs uppercase tracking-wider text-muted-foreground">À partir de</p><p className="mt-1 font-display text-lg text-primary">{isProWithValidatedVat && proPrice ? `${proPrice} €/g HT` : `${lowestPerGram.toFixed(2)} €/g`}</p></div>
          </div>
        </div>
      </Link>
      <div className="relative z-10 px-5 pb-5">
        <Button asChild variant="outline" className="h-11 w-full border-primary/50 text-primary hover:bg-primary/10 hover:text-primary">
          <Link to={`/produit/${product.id}`}>Choisir mon grammage</Link>
        </Button>
      </div>
    </motion.article>
  );
};

export default ProductCard;
