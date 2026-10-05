// Fiche produit « Minuit Carat » : vitrine sous projecteur, ticket de grammage aux prix exacts du site,
// mot de la maison, profil aromatique, avis et lots de la même veine.
// Prix, prix pro HT, cadeaux et panier : logique d'origine conservée (calculatePrice, getGifts, addToCart).
import { useEffect, useMemo, useRef, useState, type ImgHTMLAttributes, type PointerEvent as ReactPointerEvent } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Product, PriceGroup } from "@/data/products";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useProducts } from "@/hooks/useProducts";
import { useCatalogProducts } from "@/hooks/useCatalogProducts";
import { useProPrices } from "@/hooks/useProPrices";
import { useLabReports, useOpenLabReport } from "@/hooks/useLabReports";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TerpeneRadar from "@/components/TerpeneRadar";
import ProductReviews from "@/components/ProductReviews";
import { calculatePrice, getGifts } from "@/lib/pricing";
import { getPochonImage, getPochonLabel } from "@/data/accessories";
import { LOT_ORDER, WEIGHTS, cutSources, edito, eur, gfmt, typeLabel } from "@/components/minuit/minuitData";
import "@/components/minuit/minuit.css";
import "@/components/minuit/minuitProduct.css";

// Calculate similarity between two products based on terpenes
const calculateTerpeneSimilarity = (
  terpenes1: { boise: number; fruite: number; epice: number; terreux: number },
  terpenes2: { boise: number; fruite: number; epice: number; terreux: number }
): number => {
  const keys = ["boise", "fruite", "epice", "terreux"] as const;
  let similarity = 0;

  keys.forEach((key) => {
    const val1 = terpenes1[key];
    const val2 = terpenes2[key];
    similarity += 1 - Math.abs(val1 - val2) / 100;
  });

  return similarity / keys.length;
};

const getSimilarProducts = (
  currentProduct: Product,
  catalog: Product[],
  count: number = 4
) => {
  const similarities = catalog
    .filter((p) => p.id !== currentProduct.id && !p.isOutOfStock)
    .map((p) => ({
      product: p,
      similarity: calculateTerpeneSimilarity(currentProduct.terpenes, p.terpenes),
    }))
    .sort((a, b) => b.similarity - a.similarity);

  return similarities.slice(0, count).map((s) => s.product);
};

const cbdLabel = (p: Product) =>
  p.isForceNoire || p.isNectarDivin || p.isExotique || p.cbdPercentage.includes("CBD") ? p.cbdPercentage : `${p.cbdPercentage} CBD`;

// Textes de gamme : arômes, sélection, rareté. Aucune allégation d'effet.
const GAMME_TXT: Record<string, string> = {
  "Force Noire": "Nos lots les plus denses, travaillés autour d'une molécule signature. Un registre de caractère, pensé pour les connaisseurs.",
  Exotique: "Des variétés rares aux profils aromatiques hors norme, sélectionnées lot par lot.",
  "Cali Genetics": "Des génétiques californiennes, choisies pour leur bouquet et la densité de leurs têtes.",
  Artiste: "Une édition signée, produite en série limitée.",
  "Nectar Divin": "La réserve de la maison : quelques lots d'exception, sortis au compte-gouttes.",
};

const TRUST = ["THC < 0,3 %", "Expédition discrète 48 h", "Main propre autour du 44", "Paiement sécurisé"];

/** Détourage du lot (bucket, puis code), sinon photo produit en plein cadre. */
const LotImg = ({ p, className, ...rest }: { p: Product } & ImgHTMLAttributes<HTMLImageElement>) => {
  const srcs = useMemo(() => cutSources(p), [p]);
  const [i, setI] = useState(0);
  return (
    <img
      decoding="async"
      {...rest}
      src={srcs[i]}
      className={[className, srcs[i] === p.image ? "ph" : "cut"].filter(Boolean).join(" ")}
      onError={(e) => {
        if (i + 1 < srcs.length) setI(i + 1);
        else if (!e.currentTarget.src.endsWith("/placeholder.svg")) e.currentTarget.src = "/placeholder.svg";
      }}
    />
  );
};

const ProductPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isPro, isProValidated, profile } = useAuth();
  const { getPrice } = useProducts();
  const { getProPrice } = useProPrices();
  const { all: catalogProducts, isLoading: catalogLoading } = useCatalogProducts();
  const { data: labReports } = useLabReports();
  const { open: openLabReport, openingId } = useOpenLabReport();

  // Seul le catalogue actif fait foi : une variété désactivée en base n'est plus consultable.
  const product = catalogProducts.find((p) => p.id === id);
  // 10 g par défaut : c'est le palier qui débloque le kit et l'échantillon offerts
  const [selectedWeight, setSelectedWeight] = useState<number>(10);
  const [customWeight, setCustomWeight] = useState<string>("10");
  const [showVideo, setShowVideo] = useState(false);
  const [barOn, setBarOn] = useState(false);
  const ctaRef = useRef<HTMLButtonElement>(null);
  const vitRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setShowVideo(false); }, [id]);

  // Get dynamic price from database
  const dbPrice = product ? getPrice(product.id) : null;
  const basePrice = dbPrice?.price ?? product?.price ?? 0;
  const proPrice = product ? getProPrice(product.id) : null;

  // Check if user qualifies for Pro HT pricing (requires VAT validated by admin)
  const isProWithValidatedVat = isPro && isProValidated && !!profile?.vat_number && profile?.is_vat_validated;

  // Get price group from product (default to A if not defined)
  const priceGroup: PriceGroup = product?.priceGroup || "A";

  /** Prix exact d'un grammage pour ce visiteur (TTC dégressif, ou HT à plat pour un pro validé). */
  const priceAt = (w: number) =>
    isProWithValidatedVat && proPrice ? proPrice * w : Number(calculatePrice(basePrice, w, priceGroup, product?.id).finalPrice);

  const priceInfo = useMemo(() => {
    if (!product) return null;
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
  }, [product, basePrice, proPrice, selectedWeight, isProWithValidatedVat, priceGroup]);

  const gifts = useMemo(() => {
    // No gifts for Pro users with validated VAT
    if (isProWithValidatedVat) return null;
    return getGifts(selectedWeight);
  }, [selectedWeight, isProWithValidatedVat]);

  const pochonImage = useMemo(() => getPochonImage(selectedWeight), [selectedWeight]);
  const pochonLabel = useMemo(() => getPochonLabel(selectedWeight), [selectedWeight]);

  // Barre d'achat mobile : visible tant que le bouton principal n'est pas à l'écran
  useEffect(() => {
    const el = ctaRef.current;
    if (!el) { setBarOn(false); return; }
    const io = new IntersectionObserver(([e]) => setBarOn(!e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, [product?.id, product?.isOutOfStock]);

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

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, selectedWeight);
    }
  };

  if (catalogLoading) {
    return <div className="min-h-screen" style={{ background: "#060508" }} />;
  }

  if (!product) {
    return (
      <div className="mcp-page">
        <Header />
        <div className="mc mcp-missing">
          <p className="kicker">Collection N° 26</p>
          <h1 className="serif-i">Variété indisponible</h1>
          <p>Cette variété n'est plus proposée pour le moment. Découvrez le reste de la collection.</p>
          <button onClick={() => navigate("/catalogue")} className="btn-or">Voir le catalogue</button>
        </div>
        <Footer />
      </div>
    );
  }

  const similarProducts = getSimilarProducts(product, catalogProducts, 4);
  const e = edito(product);
  const gamme = product.isNectarDivin ? "Nectar Divin" : e.gamme;
  const exo = gamme === "Exotique";
  const lotNo = LOT_ORDER.indexOf(product.id);
  const total = Number(priceInfo?.finalPrice ?? 0);
  const giftN = gifts?.count ?? 0;
  const reports = labReports?.[product.id] ?? [];

  // relance vers le palier suivant (10 g d'abord : il débloque les cadeaux)
  const nudge = (() => {
    if (isProWithValidatedVat) return null;
    const w = selectedWeight;
    if (w < 10) {
      const p10 = priceAt(10);
      return { to: 10, html: <>Passez à <b>10 g</b> : <b>{eur(p10)}</b>, soit {eur(p10 / 10)} le gramme (−{Math.round((1 - p10 / (basePrice * 10)) * 100)} %), avec <b>1 kit</b> et <b>1 échantillon de 1 g</b> offerts.</> };
    }
    const next = WEIGHTS.find((x) => x > w);
    if (!next) return { to: 0, html: <>Vous êtes au sommet de la grille : <b>{eur(priceAt(w) / w)} le gramme</b>.</> };
    const pgN = priceAt(next) / next, gain = Math.round((1 - pgN / (priceAt(w) / w)) * 100), k = Math.floor(next / 10);
    return { to: next, html: <>À {gfmt(next)}, le gramme passe à <b>{eur(pgN)}</b>{gain > 0 ? ` (−${gain} %)` : ""}{k > giftN ? <> et <b>{k} kits</b> offerts</> : null}.</> };
  })();

  const tilt = (ev: ReactPointerEvent<HTMLDivElement>) => {
    if (ev.pointerType !== "mouse") return;
    const r = ev.currentTarget.getBoundingClientRect();
    vitRef.current?.style.setProperty("--ry", `${((ev.clientX - r.left) / r.width - 0.5) * 22}deg`);
    vitRef.current?.style.setProperty("--rx", `${-((ev.clientY - r.top) / r.height - 0.5) * 14}deg`);
  };
  const untilt = () => { vitRef.current?.style.setProperty("--ry", "0deg"); vitRef.current?.style.setProperty("--rx", "0deg"); };

  return (
    <div className="mcp-page">
      <Header />

      {/* data-fx-off : la fiche gère ses propres animations (le kit hsb-fx décalerait la vitrine) */}
      <main className="mc mcp mcp-main" data-fx-off="">
        <nav className="mcp-crumb" aria-label="Fil d'Ariane">
          <button onClick={() => navigate(-1)}>← Retour</button>
          <span className="mono-s">Collection N° 26 · {typeLabel(product)}</span>
        </nav>

        <section className="mcp-hero" aria-labelledby="mcp-t">
          <div className="mcp-vit">
            <div ref={vitRef} className={`mcp-arch${exo ? " exo" : ""}${showVideo ? " vid" : ""}`} onPointerMove={tilt} onPointerLeave={untilt}>
              {!showVideo && <span className="mcp-num" aria-hidden="true">{lotNo >= 0 ? String(lotNo + 1).padStart(2, "0") : "26"}</span>}
              {showVideo && product.video ? (
                <video src={product.video} poster={product.image} controls autoPlay muted loop playsInline preload="metadata" />
              ) : (
                <>
                  <div className="mcp-stage">
                    <LotImg key={product.id} p={product} alt={`${product.name}, ${typeLabel(product).toLowerCase()} CBD`} draggable={false} />
                  </div>
                  <span className="mcp-ring" aria-hidden="true" />
                </>
              )}
            </div>
            <div className="mcp-vit-act">
              {e.vedette && <span className="mcp-badge">{e.vedette}</span>}
              {product.video && (
                <button className="btn-line" onClick={() => setShowVideo((v) => !v)}>
                  {showVideo ? "← Revenir au lot" : "▶ Le lot en vidéo"}
                </button>
              )}
            </div>
          </div>

          <div className="mcp-info">
            <div className="mcp-badges">
              <span className={`mcp-badge${exo ? " exo" : ""}`}>{gamme}</span>
              <span className="mcp-badge">{typeLabel(product)} CBD</span>
              <span className="mcp-badge">{cbdLabel(product)}</span>
              {product.molecule && <span className="mcp-badge or">Molécule {product.molecule}</span>}
            </div>
            <h1 id="mcp-t" className="serif-i">{product.name}</h1>
            <p className="mcp-sub">{product.subtitle}</p>
            {e.notes && e.notes !== product.subtitle && <p className="notes mcp-notes">{e.notes}</p>}

            {isProWithValidatedVat && proPrice ? (
              <div className="pr">
                <div className="hi"><small>Prix pro</small><strong>{eur(proPrice)}</strong><em>le gramme · HT</em></div>
              </div>
            ) : (
              <div className="pr">
                <div><small>1 g</small><strong>{eur(priceAt(1))}</strong></div>
                <div className="hi"><small>10 g</small><strong>{eur(priceAt(10))}</strong><em>{eur(priceAt(10) / 10)}/g · kit offert</em></div>
              </div>
            )}

            {product.isOutOfStock ? (
              <div className="ticket mcp-out">
                <p className="kicker">Rupture de stock</p>
                <p className="mcp-out-t serif-i">Victime de son succès</p>
                <p>Cette variété d'exception est momentanément épuisée. Réapprovisionnement en cours : elle sera bientôt de retour dans la collection.</p>
                <a className="btn-line" href="#veine">Les lots de la même veine ↓</a>
              </div>
            ) : (
              <div className="ticket mcp-ticket">
                <p className="kicker">Choisissez votre grammage</p>
                <div className="gr-w" role="radiogroup" aria-label="Grammage">
                  {WEIGHTS.map((w) => (
                    <button key={w} className={`wbtn${w >= 10 && !isProWithValidatedVat ? " gift" : ""}`} role="radio" aria-checked={w === selectedWeight} onClick={() => handlePresetClick(w)}>
                      <b>{String(w).replace(".", ",")}<span> g</span></b>
                      <small>{eur(priceAt(w))}</small>
                    </button>
                  ))}
                </div>
                <label className="mcp-custom">
                  Poids précis
                  <input type="number" inputMode="decimal" min="0.5" max="1000" step="0.5" value={customWeight} onChange={(ev) => handleCustomWeightChange(ev.target.value)} />
                  grammes
                </label>

                <div className="total">
                  <strong className="foil">{eur(total)}</strong>
                  <span>{gfmt(selectedWeight)} · soit {eur(total / selectedWeight)} le gramme{priceInfo?.isHT ? " · HT" : ""}</span>
                </div>
                {priceInfo?.isHT ? (
                  <p className="save">Prix professionnel HT appliqué · économie de {eur(Number(priceInfo.savings))} par rapport au TTC.</p>
                ) : priceInfo && priceInfo.discount > 0 ? (
                  <p className="save"><s>{eur(Number(priceInfo.rawPrice))}</s> · {priceInfo.discountLabel} · vous économisez {eur(Number(priceInfo.savings))}</p>
                ) : (
                  <p className="save">Le prix du gramme, sans engagement.</p>
                )}

                {!isProWithValidatedVat && (
                  <div className="gifts">
                    <span className={giftN ? "" : "off"}>✦ <b>{giftN || "Aucun"} kit{giftN > 1 ? "s" : ""} offert{giftN > 1 ? "s" : ""}</b> · briquet BIC et feuilles slim RAW</span>
                    <span className={giftN ? "" : "off"}>✦ <b>{giftN || "Aucun"} échantillon{giftN > 1 ? "s" : ""} de 1 g</b> au choix</span>
                  </div>
                )}
                {nudge && (
                  <p className="nudge mcp-nudge">
                    <span>{nudge.html}</span>
                    {nudge.to > 0 && <button onClick={() => handlePresetClick(nudge.to)}>Passer à {gfmt(nudge.to)}</button>}
                  </p>
                )}

                <button ref={ctaRef} className="btn-or" onClick={handleAddToCart}>Ajouter {gfmt(selectedWeight)} · {eur(total)}</button>

                <div className="mcp-pochon">
                  <img src={pochonImage} alt={pochonLabel} loading="lazy" />
                  <p><b>{pochonLabel} inclus</b>Votre lot voyage scellé, colis discret.</p>
                  <Link className="btn-line" to="/#accessoires">Un pochon en plus ?</Link>
                </div>
              </div>
            )}

            <ul className="mcp-trust">{TRUST.map((t) => <li key={t}>{t}</li>)}</ul>
          </div>
        </section>

        <section className="mcp-story" aria-label="Le lot en détail">
          <div>
            <p className="kicker">Le mot de la maison</p>
            <p className="mcp-desc">{product.description}</p>
            {GAMME_TXT[gamme] && (
              <div className={`mcp-gamme${exo ? " exo" : ""}`}>
                <span className="neon">{gamme}</span>
                <p>Collection {gamme} · {GAMME_TXT[gamme]}</p>
              </div>
            )}
            <div className="mcp-lab">
              <p className="kicker">Analyse laboratoire</p>
              {reports.length ? (
                reports.map((r) => (
                  <button key={r.id} className="btn-line" disabled={openingId === r.id} onClick={() => openLabReport(r.id, r.storage_path)}>
                    {openingId === r.id ? "Ouverture…" : `${r.label} ↗`}
                  </button>
                ))
              ) : (
                <p>THC inférieur à 0,3 %, conforme à la réglementation française. Analyse disponible sur simple demande : <Link to="/contact">écrivez-nous</Link>.</p>
              )}
            </div>
          </div>
          <div className="mcp-radar">
            <p className="kicker">Profil aromatique</p>
            <TerpeneRadar terpenes={product.terpenes} size={240} />
            {product.mood && <p className="mcp-mood">Ambiance · <b>{product.mood}</b></p>}
          </div>
        </section>

        {!product.isOutOfStock && (
          <div className={`mcp-bar${barOn ? " on" : ""}`} aria-hidden={!barOn}>
            <div><small>{gfmt(selectedWeight)}</small><strong>{eur(total)}</strong></div>
            <button className="btn-or" tabIndex={barOn ? 0 : -1} onClick={handleAddToCart}>Ajouter au panier</button>
          </div>
        )}
      </main>

      {/* Avis : hors du périmètre .mc pour garder le style des formulaires du site */}
      <div className="container mx-auto px-6 mcp-reviews">
        <ProductReviews productId={product.id} />
      </div>

      {similarProducts.length > 0 && (
        <section id="veine" className="mc mcp mcp-veine" data-fx-off="" aria-labelledby="mcp-veine-t">
          <p className="kicker">Même profil aromatique</p>
          <h2 id="mcp-veine-t" className="serif-i">Dans la même<span className="choc foil">veine</span></h2>
          <div className="mcp-grid">
            {similarProducts.map((s) => {
              const sp = getPrice(s.id)?.price ?? s.price;
              const at = (w: number) => Number(calculatePrice(sp, w, s.priceGroup || "A", s.id).finalPrice);
              return (
                <Link key={s.id} to={`/produit/${s.id}`} className={`mcp-card${edito(s).gamme === "Exotique" ? " exo" : ""}`}>
                  <div className="v"><LotImg p={s} alt={s.name} loading="lazy" /></div>
                  <p className="tag">{edito(s).gamme} · {typeLabel(s)}</p>
                  <h3>{s.name}</h3>
                  <p className="px"><span>1 g · <b>{eur(at(1))}</b></span><span>10 g · <b>{eur(at(10))}</b></span></p>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
};

export default ProductPage;
