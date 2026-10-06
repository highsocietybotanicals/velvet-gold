// Le Coffre : un produit = un casier de coffre (métal sombre brossé, plaque de laiton gravée, serrure à cadran).
// Le lot détouré flotte dans un faisceau de lumière. Données et prix : exactement les mêmes sources que la carte
// produit du site (useProducts.getPrice, useProPrices.getProPrice, getLowestPricePerGram, calculatePrice),
// mêmes liens vers la fiche, même aperçu vidéo au survol, même bandeau de rupture de stock.
import { forwardRef, useCallback, useMemo, useRef, useState, type CSSProperties } from "react";
import { useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { Crown, Gem, Sparkles, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProducts } from "@/hooks/useProducts";
import { useProPrices } from "@/hooks/useProPrices";
import { allProducts as staticCatalog, type PriceGroup, type Product, type TerpeneProfile } from "@/data/products";
import { calculatePrice, getLowestPricePerGram } from "@/lib/pricing";
import { responsiveProductSrcSet } from "@/lib/responsiveProductImage";
import GoldParticles from "@/components/GoldParticles";
import { LOT_ORDER, cutSources, edito, eur, typeLabel } from "@/components/minuit/minuitData";
import { useInViewAttr, useRevealOnce } from "./useInViewAttr";

interface CoffreLockerProps {
  product: Product;
  index: number;
  layout?: "grid" | "list";
}

/**
 * Numéros gravés, calculés une fois sur le catalogue statique (ordre fixe) : celui du lot de la
 * Collection N° 26, puis la suite pour les autres variétés. Ils ne bougent donc pas quand l'ordre
 * venu de la base (display_order) remplace l'ordre initial après le chargement.
 */
const LOCKER_NO = new Map<string, number>();
LOT_ORDER.forEach((id, i) => LOCKER_NO.set(id, i + 1));
staticCatalog
  .filter((p) => !LOT_ORDER.includes(p.id))
  .forEach((p, j) => LOCKER_NO.set(p.id, LOT_ORDER.length + j + 1));

/** Serrure à cadran : le profil aromatique du lot, gravé comme une combinaison. */
const Dial = ({ t }: { t: TerpeneProfile }) => {
  const axes = [t.boise, t.fruite, t.epice, t.terreux];
  const pts = axes
    .map((v, k) => {
      const a = ((k * 90 - 90) * Math.PI) / 180;
      const r = 2 + (Math.max(0, Math.min(100, v)) / 100) * 11;
      return `${(20 + r * Math.cos(a)).toFixed(2)},${(20 + r * Math.sin(a)).toFixed(2)}`;
    })
    .join(" ");
  return (
    <span
      className="cf-dial"
      role="img"
      aria-label={`Profil aromatique : boisé ${t.boise}, fruité ${t.fruite}, épicé ${t.epice}, terreux ${t.terreux} sur 100`}
      title="Profil aromatique"
    >
      <svg viewBox="0 0 40 40" aria-hidden="true">
        <g className="tk">
          <circle cx="20" cy="20" r="17.4" />
        </g>
        <path className="ix" d="M20 1.4 21.5 4.2 18.5 4.2Z" />
        <path className="ax" d="M20 7V33M7 20H33" />
        <polygon className="pg" points={pts} />
        <circle className="pin" cx="20" cy="20" r="1.5" />
      </svg>
    </span>
  );
};

const cbdText = (p: Product) =>
  p.isForceNoire || p.isNectarDivin || p.isExotique || p.cbdPercentage.includes("CBD") ? p.cbdPercentage : `${p.cbdPercentage} CBD`;

const CoffreLocker = forwardRef<HTMLElement, CoffreLockerProps>(({ product, index, layout = "grid" }, ref) => {
  const { isPro, isProValidated, profile } = useAuth();
  const { getPrice } = useProducts();
  const { getProPrice } = useProPrices();
  const previewRef = useRef<HTMLVideoElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  useInViewAttr(bodyRef);

  // Entrée du casier (fondu + bascule) : même déclencheur que l'ancien whileInView, jouée en CSS (cf-lk-in).
  // La référence transmise par AnimatePresence (popLayout) reste posée sur le même <article>.
  const lkRef = useRef<HTMLElement | null>(null);
  const setLkRef = useCallback(
    (el: HTMLElement | null) => {
      lkRef.current = el;
      if (typeof ref === "function") ref(el);
      else if (ref) ref.current = el;
    },
    [ref],
  );
  useRevealOnce(lkRef, !reduce);

  // mêmes calculs que la carte produit du site
  const basePrice = getPrice(product.id)?.price ?? product.price;
  const proPrice = getProPrice(product.id);
  const isProWithValidatedVat = isPro && isProValidated && !!profile?.vat_number && profile?.is_vat_validated;
  const priceGroup: PriceGroup = product.priceGroup || "A";
  const lowestPerGram = useMemo(() => getLowestPricePerGram(basePrice, priceGroup, product.id), [basePrice, priceGroup, product.id]);
  const p1 = Number(calculatePrice(basePrice, 1, priceGroup, product.id).finalPrice);
  const p10 = Number(calculatePrice(basePrice, 10, priceGroup, product.id).finalPrice);

  // détourage du lot, puis photo produit, puis visuel neutre
  const sources = useMemo(() => [...cutSources(product), "/placeholder.svg"], [product]);
  const [srcIdx, setSrcIdx] = useState(0);
  const src = sources[Math.min(srcIdx, sources.length - 1)];
  const isPhoto = src === product.image || src === "/placeholder.svg";
  const srcSet = src === product.image ? responsiveProductSrcSet(product.image) : undefined;

  const no = LOCKER_NO.get(product.id);
  const nn = no ? String(no).padStart(2, "0") : "26";
  const notes = edito(product).notes;
  const tone = product.isExotique ? "exo" : product.isNectarDivin ? "nectar" : product.isForceNoire ? "noire" : "or";

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

  const gammeBadge = product.isExotique ? (
    <span className="cf-pill exo"><Gem aria-hidden="true" />Exotique</span>
  ) : product.isNectarDivin ? (
    <span className="cf-pill or"><Crown aria-hidden="true" />Nectar Divin</span>
  ) : product.isForceNoire ? (
    <span className="cf-pill noire"><Zap aria-hidden="true" />Force Noire</span>
  ) : product.badge === "Cali Genetics" ? (
    <span className="cf-pill or"><Crown aria-hidden="true" />Cali Genetics</span>
  ) : product.badge ? (
    <span className="cf-pill"><Sparkles aria-hidden="true" />{product.badge}</span>
  ) : null;

  return (
    <article
      ref={setLkRef}
      style={{ "--lk-d": `${(index % 4) * 70}ms` } as CSSProperties}
      onMouseEnter={handlePreviewEnter}
      onMouseLeave={handlePreviewLeave}
      className={`cf-lk ${tone}${layout === "list" ? " is-list" : ""}${product.isOutOfStock ? " is-out" : ""}`}
    >
      <div ref={bodyRef} className="cf-lk-body" style={{ "--n": index % 7 } as CSSProperties}>
        {product.isNectarDivin && (
          <div className="cf-lk-fx" aria-hidden="true">
            <GoldParticles />
          </div>
        )}

        <div className="cf-lk-head">
          <span className="cf-plate" aria-hidden="true">
            <small>Casier</small>
            <b>N° {nn}</b>
          </span>
          <span className="cf-kind">{typeLabel(product)}</span>
          <Dial t={product.terpenes} />
        </div>

        <Link to={`/produit/${product.id}`} className="cf-lk-link" aria-label={`Découvrir ${product.name}`}>
          <div className={`cf-niche${isPhoto ? " is-ph" : ""}`}>
            <span className="cf-wallg" aria-hidden="true" />
            <span className="cf-numbg" aria-hidden="true">{nn}</span>
            <span className="cf-beam" aria-hidden="true" />
            <div className="cf-lot">
              <img
                key={src}
                src={src}
                srcSet={srcSet}
                sizes={srcSet ? "(min-width: 1280px) 24vw, (min-width: 1024px) 31vw, (min-width: 600px) 47vw, 92vw" : undefined}
                alt={product.name}
                loading="lazy"
                decoding="async"
                draggable={false}
                className={isPhoto ? "ph" : "cut"}
                onError={() => setSrcIdx((i) => (i + 1 < sources.length ? i + 1 : i))}
              />
            </div>
            <span className="cf-ring" aria-hidden="true" />
            <span className="cf-haze" aria-hidden="true" />
            {product.video && (
              <video ref={previewRef} src={product.video} muted loop playsInline preload="none" className="cf-vid" aria-hidden="true" />
            )}
            {/* étiquettes du casier : une seule rangée, elles se partagent la largeur sans jamais se chevaucher */}
            <div className="cf-tags">
              <div className="cf-badges">
                {gammeBadge}
                {product.molecule && <span className="cf-pill mol">{product.molecule}</span>}
              </div>
              <span className="cf-cbd">{cbdText(product)}</span>
            </div>
            {product.isOutOfStock && (
              <div className="cf-seal">
                <div className="cf-seal-in">
                  <span className="k">Rupture de stock</span>
                  <span className="t">Victime de son succès</span>
                </div>
              </div>
            )}
          </div>

          <div className="cf-info">
            <h3>{product.name}</h3>
            <p className="cf-sub">{product.subtitle}</p>
            {layout === "list" && notes && notes !== product.subtitle && <p className="cf-notes">{notes}</p>}
            {isProWithValidatedVat && proPrice ? (
              <div className="cf-px pro">
                <span className="hi">
                  <small>Prix pro</small>
                  <b>{eur(proPrice)}</b>
                  <em>le gramme · HT</em>
                </span>
              </div>
            ) : (
              <div className="cf-px">
                <span>
                  <small>1 g</small>
                  <b>{eur(p1)}</b>
                </span>
                <span className="hi">
                  <small>10 g</small>
                  <b>{eur(p10)}</b>
                  <em>kit offert</em>
                </span>
                <span className="from">
                  À partir de <b>{eur(lowestPerGram)}/g</b>
                </span>
              </div>
            )}
          </div>
        </Link>

        <div className="cf-lk-foot">
          <Link to={`/produit/${product.id}`} className="cf-cta">
            Choisir mon grammage
          </Link>
        </div>
      </div>
    </article>
  );
});
CoffreLocker.displayName = "CoffreLocker";

export default CoffreLocker;
