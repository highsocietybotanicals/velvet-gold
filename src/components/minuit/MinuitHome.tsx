// Accueil « Minuit Carat » : porte d'âge 3D, tunnel de lots, boulevard des carats, grille des prix,
// maison, preuves (pochon 3D), sommelier express. Panier, prix et catalogue = ceux du site.
import { useCallback, useEffect, useMemo, useRef, useState, type ImgHTMLAttributes } from "react";
import { Link } from "react-router-dom";
import Lenis from "lenis";
import { useCatalogProducts } from "@/hooks/useCatalogProducts";
import { useCart } from "@/contexts/CartContext";
import type { Product } from "@/data/products";
import emblemSvg from "@/assets/brand/hsb-emblem.svg?raw";
import type { MinuitScene } from "./minuitScene";
import { AMBIANCE, BAND, HERO_LOTS, LOT_ORDER, WEIGHTS, cutSources, edito, eur, gfmt, priceOf, shortName, typeLabel } from "./minuitData";
import "./minuit.css";

const AGE_KEY = "hsb-age-verified";
const readVerified = () => { try { return sessionStorage.getItem(AGE_KEY) === "true"; } catch { return false; } };
const prefersReduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Image qui passe à la source suivante si la première ne répond pas. */
const Img = ({ srcs, photoLast, className, ...rest }: { srcs: string[]; photoLast?: boolean } & ImgHTMLAttributes<HTMLImageElement>) => {
  const [i, setI] = useState(0);
  // is-photo : la photo de repli (fond noir) reçoit le fondu ; un détourage reste net
  const photo = photoLast && srcs.length > 1 && i === srcs.length - 1;
  return <img {...rest} className={[className, photo && "is-photo"].filter(Boolean).join(" ") || undefined} src={srcs[i]} onError={() => setI((v) => (v + 1 < srcs.length ? v + 1 : v))} />;
};

const PriceBlock = ({ p }: { p: Product }) => {
  const p10 = priceOf(p, 10);
  return (
    <div className="pr">
      <div><small>1 g</small><strong>{eur(priceOf(p, 1))}</strong></div>
      <div className="hi"><small>10 g</small><strong>{eur(p10)}</strong><em>{eur(p10 / 10)}/g · kit offert</em></div>
    </div>
  );
};

const giftCount = (w: number) => Math.floor(w / 10);
const nudgeHtml = (p: Product, w: number) => {
  if (w < 10) {
    const p10 = priceOf(p, 10);
    return `Passez à <b>10 g</b> : <b>${eur(p10)}</b>, soit ${eur(p10 / 10)} le gramme (−${Math.round((1 - p10 / (p.price * 10)) * 100)} %), avec <b>1 kit</b> et <b>1 échantillon de 1 g</b> offerts.`;
  }
  const next = WEIGHTS.find((x) => x > w);
  if (!next) return `Vous êtes au sommet de la grille : <b>${eur(priceOf(p, w) / w)} le gramme</b>.`;
  const pgN = priceOf(p, next) / next, gain = Math.round((1 - pgN / (priceOf(p, w) / w)) * 100), k = giftCount(next);
  return `À ${gfmt(next)}, le gramme passe à <b>${eur(pgN)}</b> (−${gain} %)${k > giftCount(w) ? ` et <b>${k} kits</b> offerts` : ""}.`;
};
const savingTxt = (p: Product, w: number) => {
  const full = p.price * w, s = full - priceOf(p, w);
  return s > 0.005 ? `Vous économisez ${eur(s)} (−${Math.round((s / full) * 100)} %) par rapport au prix du gramme.` : "Le prix du gramme, sans engagement.";
};

const FILTERS: [string, (p: Product) => boolean][] = [
  ["Tout", () => true],
  ["Fleurs", (p) => p.category === "fleur"],
  ["Résines", (p) => p.category === "resine"],
  ["Exotique", (p) => edito(p).gamme === "Exotique"],
  ["Force Noire", (p) => edito(p).gamme === "Force Noire"],
  ["Cali Genetics", (p) => edito(p).gamme === "Cali Genetics"],
  ["Artiste", (p) => edito(p).gamme === "Artiste"],
];

const QUIZ = [
  { k: "type", q: "Votre format", o: [["Fleur", "fleur"], ["Résine", "resine"], ["Peu importe", "*"]] },
  { k: "pal", q: "Votre palette aromatique", o: [["Fruité, exotique", "fruite"], ["Boisé, pin", "boise"], ["Frais, mentholé", "frais"], ["Gourmand, épicé", "gourmand"]] },
  { k: "gam", q: "Votre registre", o: [["Découverte · 11 à 12 €", "dec"], ["Prestige · 13 à 17 €", "pre"], ["Laissez-moi surprendre", "*"]] },
] as const;

const MinuitHome = ({ onEnter }: { onEnter: () => void }) => {
  const { all } = useCatalogProducts();
  const { addToCart } = useCart();
  const lots = useMemo(() => {
    const live = all.filter((p) => !p.isOutOfStock || LOT_ORDER.includes(p.id));
    const rank = (p: Product) => { const i = LOT_ORDER.indexOf(p.id); return i < 0 ? 99 : i; };
    return [...live].sort((a, b) => rank(a) - rank(b));
  }, [all]);
  const heroLots = useMemo(() => HERO_LOTS.map((id) => lots.find((p) => p.id === id)).filter(Boolean) as Product[], [lots]);

  const rootRef = useRef<HTMLDivElement>(null), heroRef = useRef<HTMLElement>(null), canvasRef = useRef<HTMLCanvasElement>(null);
  const sloganRef = useRef<HTMLDivElement>(null), sideRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null), trackRef = useRef<HTMLDivElement>(null), waveRef = useRef<SVGPathElement>(null);
  const maisonRef = useRef<HTMLElement>(null), archRef = useRef<HTMLDivElement>(null), pouchRef = useRef<HTMLElement>(null), pouchCanvas = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<MinuitScene | null>(null), lenisRef = useRef<Lenis | null>(null), pinMax = useRef(0);

  const [lit, setLit] = useState(readVerified);
  const [glOk, setGlOk] = useState(true);
  const [isDesk, setIsDesk] = useState(false);
  const [station, setStation] = useState(0);
  const [capShow, setCapShow] = useState(false);
  const [gateMsg, setGateMsg] = useState("");
  const [filter, setFilter] = useState(0);
  const [grid, setGrid] = useState({ id: "platinum-og", w: 10 });
  const [quiz, setQuiz] = useState<Record<string, string>>({ type: "*", pal: "fruite", gam: "*" });

  // ---- scène 3D : three.js est chargé à part, après l'affichage de la page ----
  const litRef = useRef(lit);
  litRef.current = lit;
  useEffect(() => {
    let cancelled = false;
    import("./minuitScene")
      .then(({ createMinuitScene }) => {
        const c = canvasRef.current;
        if (cancelled || !c || sceneRef.current) return;
        try {
          sceneRef.current = createMinuitScene(c, {
            lots: heroLots.map(cutSources), emblemSvg,
            mobile: window.matchMedia("(max-width: 899px)").matches, reduce: prefersReduced(),
          });
          // porte déjà passée (session) ou franchie pendant le chargement : rideau levé d'office
          if (litRef.current) sceneRef.current.lift(true);
        } catch {
          setGlOk(false);
        }
      })
      .catch(() => setGlOk(false));
    return () => { cancelled = true; sceneRef.current?.dispose(); sceneRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- porte : défilement bloqué tant qu'elle est fermée ----
  useEffect(() => {
    document.documentElement.style.overflow = lit ? "" : "hidden";
    if (lit) lenisRef.current?.start(); else lenisRef.current?.stop();
    return () => { document.documentElement.style.overflow = ""; };
  }, [lit]);
  const enter = () => {
    try { sessionStorage.setItem(AGE_KEY, "true"); } catch { /* navigation privée */ }
    window.scrollTo(0, 0);
    setLit(true); onEnter();
    sceneRef.current?.lift(prefersReduced());
  };

  // ---- défilement : tunnel, boulevard épinglé, rideau de la maison ----
  const onScroll = useCallback(() => {
    const hero = heroRef.current;
    if (hero) {
      const r = hero.getBoundingClientRect(), p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - window.innerHeight)));
      sceneRef.current?.setProgress(p);
      // pendant la porte, la feuille de style garde le slogan caché (aucun style en ligne)
      const fade = litRef.current ? String(1 - Math.min(1, p / 0.06)) : "";
      if (sloganRef.current) { sloganRef.current.style.opacity = fade; sloganRef.current.style.pointerEvents = p > 0.05 ? "none" : ""; }
      if (sideRef.current) sideRef.current.style.opacity = fade;
      setCapShow(p > 0.04);
      setStation(Math.min(2, Math.round(p * 2)));
    }
    const pin = pinRef.current, track = trackRef.current;
    if (pin && track && pinMax.current) {
      const r = pin.getBoundingClientRect(), p = Math.min(1, Math.max(0, -r.top / (r.height - window.innerHeight)));
      track.style.transform = `translate3d(${-p * pinMax.current}px,0,0)`;
      const w = waveRef.current;
      if (w) w.style.strokeDashoffset = String(Number(w.dataset.len || 0) * (1 - p));
    }
    const m = maisonRef.current, arch = archRef.current;
    if (m && arch) {
      const r = m.getBoundingClientRect(), mp = Math.min(1, Math.max(0, (window.innerHeight * 0.55 - r.top) / (r.height * 0.8)));
      arch.style.setProperty("--mp", prefersReduced() ? "1" : mp.toFixed(3));
    }
  }, []);

  const layoutPin = useCallback(() => {
    const desk = window.matchMedia("(min-width: 900px)").matches && !prefersReduced();
    setIsDesk(desk);
    requestAnimationFrame(() => {
      const pin = pinRef.current, track = trackRef.current, wave = waveRef.current;
      if (!pin || !track) return;
      track.style.transform = "";
      if (desk) { pinMax.current = Math.max(0, track.scrollWidth - window.innerWidth); pin.style.height = `${pinMax.current + window.innerHeight}px`; }
      else { pinMax.current = 0; pin.style.height = ""; }
      if (wave) {
        const w = track.scrollWidth, svg = wave.ownerSVGElement!;
        svg.setAttribute("width", String(w)); svg.setAttribute("viewBox", `0 0 ${w} 120`);
        let d = "M0 60"; for (let x = 0; x <= w; x += 40) d += ` L${x} ${60 + Math.sin(x / 260) * 34 + Math.sin(x / 97) * 8}`;
        wave.setAttribute("d", d);
        const len = wave.getTotalLength(); wave.dataset.len = String(len);
        wave.style.strokeDasharray = String(len); wave.style.strokeDashoffset = desk ? String(len) : "0";
      }
      onScroll();
    });
  }, [onScroll]);

  useEffect(() => {
    layoutPin();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", layoutPin);
    let raf = 0;
    if (window.matchMedia("(min-width: 900px)").matches && !prefersReduced()) {
      const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
      lenisRef.current = lenis;
      if (!readVerified()) lenis.stop();
      const loop = (t: number) => { lenis.raf(t); raf = requestAnimationFrame(loop); };
      raf = requestAnimationFrame(loop);
    }
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.15 });
    rootRef.current?.querySelectorAll(".rv").forEach((el) => io.observe(el));
    return () => {
      window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", layoutPin);
      cancelAnimationFrame(raf); lenisRef.current?.destroy(); lenisRef.current = null; io.disconnect();
    };
  }, [layoutPin, onScroll]);
  useEffect(() => { layoutPin(); }, [filter, lots.length, lit, layoutPin]);

  // ---- pochon 3D ----
  const [pouchFail, setPouchFail] = useState(false);
  useEffect(() => {
    let dispose: (() => void) | undefined, cancelled = false;
    import("./pouchScene")
      .then(({ createPouchScene }) => {
        const card = pouchRef.current, c = pouchCanvas.current;
        if (cancelled || !card || !c) return;
        try { dispose = createPouchScene(card, c, AMBIANCE.pochonFace, AMBIANCE.pochonDos, () => setPouchFail(true)); }
        catch { setPouchFail(true); }
      })
      .catch(() => setPouchFail(true));
    return () => { cancelled = true; dispose?.(); };
  }, []);

  const go = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (lenisRef.current) lenisRef.current.scrollTo(el); else el.scrollIntoView({ behavior: prefersReduced() ? "auto" : "smooth" });
  };

  const capLot = heroLots[Math.min(station, heroLots.length - 1)];
  const shown = lots.filter(FILTERS[filter][1]);
  const gLot = lots.find((p) => p.id === grid.id) ?? lots[0];
  const reco = useMemo(() => {
    const key = ({ fruite: "fruite", boise: "boise", frais: "boise", gourmand: "epice" } as const)[quiz.pal as "fruite"] ?? "fruite";
    let best: Product | undefined, bs = -1e9;
    lots.filter((p) => !p.isOutOfStock).forEach((p) => {
      let s = (p.terpenes?.[key] ?? 50) + (edito(p).tags.includes(quiz.pal) ? 60 : 0);
      if (quiz.type !== "*" && p.category !== quiz.type) s -= 1000;
      if (quiz.gam === "dec") s += p.price <= 12 ? 40 : -40;
      if (quiz.gam === "pre") s += p.price >= 13 ? 40 : -40;
      if (s > bs) { bs = s; best = p; }
    });
    return best;
  }, [lots, quiz]);

  const cls = ["mc", lit && "lit", !glOk && "no-gl", isDesk && "is-desk"].filter(Boolean).join(" ");

  return (
    // data-fx-off : le kit hsb-fx n'anime pas ces sections (sa transformation 3D casse l'épinglage du tunnel et du boulevard)
    <div ref={rootRef} className={cls} data-fx-off="">
      <section ref={heroRef} className="hero" aria-label="Entrée de la maison">
        <div className="stage">
          <canvas ref={canvasRef} aria-hidden="true" />
          {!lit && (
            <div className="gate" role="dialog" aria-modal="true" aria-labelledby="mc-gate-t">
              <p className="kicker">Maison de nuit · Collection N° 26</p>
              <h1 id="mc-gate-t" className="serif-i">L'excellence botanique<em>réservée aux initiés</em></h1>
              <p className="gate-legal">Ce site est réservé aux personnes majeures. En entrant, vous confirmez avoir 18 ans ou plus.</p>
              <div className="gate-actions">
                <button className="btn-or" onClick={enter}>J'ai 18 ans ou plus · Lever le rideau</button>
                <button className="btn-ghost" onClick={() => setGateMsg("La maison vous ouvrira ses portes à votre majorité.")}>J'ai moins de 18 ans</button>
              </div>
              <p className="gate-msg" role="status">{gateMsg}</p>
            </div>
          )}
          <div className="ov sign" aria-hidden="true"><h2 className="neon">High Society</h2><p>Botanicals · Maison de nuit</p></div>
          <div className="ov slogan" ref={sloganRef}>
            <h2><span className="l1 serif-i">L'or pousse</span><span className="l2 choc foil">la nuit.</span></h2>
            <p className="m-sub">Fleurs et résines CBD triées à la main · dès 12 € le gramme</p>
            <a className="btn-or m-cta" href="#collection" onClick={(e) => { e.preventDefault(); go("collection"); }}>Voir les lots · dès 12 €</a>
          </div>
          <div className="ov side" ref={sideRef}>
            <p>Fleurs et résines CBD triées à la main, présentées comme des pièces de joaillerie. <b>Lot n° 01 : Platinum OG</b>, la porte d'entrée de la maison, dès 12 € le gramme.</p>
            <a className="enter" href="#collection" onClick={(e) => { e.preventDefault(); go("collection"); }}>Entrer dans la nuit <span className="coin" aria-hidden="true">→</span></a>
            <a className="btn-line" style={{ marginTop: 18 }} href="#sommelier" onClick={(e) => { e.preventDefault(); go("sommelier"); }}>Indécis ? Le Sommelier choisit en 3 questions →</a>
          </div>
          <div className="ov hint" aria-hidden="true">Défilez<i /></div>
          {capLot && (
            <div className={`ov lotcap${capShow && lit ? " show" : ""}`} aria-live="polite">
              <div className="no"><span className="kicker">{edito(capLot).gamme} · {typeLabel(capLot)}</span><span className="mono-s">Lot {String(LOT_ORDER.indexOf(capLot.id) + 1).padStart(2, "0")} / {LOT_ORDER.length}</span></div>
              <h3 className="serif-i">{capLot.name}</h3>
              <p className="notes">{edito(capLot).notes}</p>
              <PriceBlock p={capLot} />
              <div className="cap-act">
                <button className="btn-or" disabled={capLot.isOutOfStock} onClick={() => addToCart(capLot, 10)}>{capLot.isOutOfStock ? "Bientôt de retour" : `Ajouter 10 g · ${eur(priceOf(capLot, 10))}`}</button>
                <Link className="btn-line" to={`/produit/${capLot.id}`}>Autre grammage</Link>
              </div>
            </div>
          )}
          <div className={`ov prog${capShow ? " show" : ""}`} aria-hidden="true">{heroLots.map((p, i) => <i key={p.id} className={i === station ? "on" : ""} />)}</div>
          <p className="ov foot-line"><b>THC &lt; 0,3 %</b> · Réservé aux majeurs · Maison de Loire-Atlantique</p>
        </div>
      </section>

      <div className="band" aria-label="Nos engagements"><div className="band-in">{[...BAND, ...BAND].map((t, i) => <span key={i}>{t}</span>)}</div></div>

      <section id="collection" className="sec collection" aria-labelledby="mc-col-t">
        <div className="pin" ref={pinRef}>
          <div className="pin-sticky">
            <div className="track" ref={trackRef}>
              <svg className="wave" aria-hidden="true"><path ref={waveRef} /></svg>
              <div className="intro">
                <p className="kicker">Collection N° 26 — Automne</p>
                <h2 className="h-ed serif-i" id="mc-col-t">Le Boulevard<span className="choc">des carats</span></h2>
                <p className="lead">Dix lots sous les projecteurs. Le premier gramme fixe le prix, le dixième vous offre le kit et un échantillon.</p>
                <div className="filters" role="group" aria-label="Filtrer la collection">
                  {FILTERS.map(([n], i) => <button key={n} className="chip" aria-pressed={i === filter} onClick={() => setFilter(i)}>{n}</button>)}
                </div>
                <a className="btn-line" style={{ alignSelf: "flex-start" }} href="#sommelier" onClick={(e) => { e.preventDefault(); go("sommelier"); }}>Indécis ? Le Sommelier choisit en 3 questions →</a>
              </div>
              {shown.map((p) => {
                const e = edito(p), n = LOT_ORDER.indexOf(p.id);
                return (
                  <article key={p.id} className={`lot${e.gamme === "Exotique" ? " exo" : ""}`}
                    onPointerMove={(ev) => { const r = ev.currentTarget.getBoundingClientRect(), img = ev.currentTarget.querySelector<HTMLImageElement>(".lot-vis img"); if (img) { img.style.setProperty("--ry", `${((ev.clientX - r.left) / r.width - 0.5) * 26}deg`); img.style.setProperty("--rx", `${-((ev.clientY - r.top) / r.height - 0.5) * 18}deg`); } }}
                    onPointerLeave={(ev) => { const img = ev.currentTarget.querySelector<HTMLImageElement>(".lot-vis img"); img?.style.setProperty("--ry", "0deg"); img?.style.setProperty("--rx", "0deg"); }}>
                    <span className="num" aria-hidden="true">{String((n < 0 ? 0 : n) + 1).padStart(2, "0")}</span>
                    {e.vedette && <span className="vedette">{e.vedette}</span>}
                    <div className="lot-vis"><Img photoLast srcs={cutSources(p)} alt={`${p.name}, ${typeLabel(p).toLowerCase()} CBD`} loading="lazy" draggable={false} /></div>
                    <div className="floor" aria-hidden="true"><Img photoLast srcs={cutSources(p)} alt="" loading="lazy" /></div>
                    <div className="meta">
                      <p className="tag">{e.gamme} · {typeLabel(p)}</p>
                      <h3>{p.name}</h3>
                      <p className="notes">{e.notes} <span style={{ color: "var(--or)" }}>{e.mol}</span></p>
                      <PriceBlock p={p} />
                      <div className="actions">
                        {p.isOutOfStock ? <span className="rupture">Bientôt de retour</span> : <button className="btn-or" onClick={() => addToCart(p, 10)}>Ajouter 10 g · {eur(priceOf(p, 10))}</button>}
                        <Link className="btn-line" to={`/produit/${p.id}`}>Autre grammage</Link>
                      </div>
                    </div>
                  </article>
                );
              })}
              <div className="outro">
                <p className="kicker">Fin du boulevard</p>
                <p className="h-ed serif-i" style={{ fontSize: "clamp(40px,4vw,64px)" }}>Votre lot<br />vous attend.</p>
                <Link className="btn-line" to="/catalogue">Tout le catalogue →</Link>
                <a className="btn-line" href="#grille" onClick={(e) => { e.preventDefault(); go("grille"); }}>Voir la grille des carats →</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {gLot && (
        <section id="grille" className="sec grille" aria-labelledby="mc-gr-t">
          <div className="sec-hd rv">
            <div><p className="kicker">Plus de carats, moins par gramme</p><h2 className="h-ed serif-i" id="mc-gr-t">La grille<span className="choc foil">des carats</span></h2></div>
            <p className="lead">Les prix exacts de la maison, palier par palier. Choisissez un lot, montez en grammes : l'économie et les cadeaux s'affichent en direct.</p>
          </div>
          <div className="gr">
            <div>
              <div className="gr-pick" role="radiogroup" aria-label="Choisir un lot">
                {lots.filter((p) => !p.isOutOfStock).map((p) => <button key={p.id} className="chip" role="radio" aria-checked={p.id === gLot.id} aria-pressed={p.id === gLot.id} onClick={() => setGrid((g) => ({ ...g, id: p.id }))}>{shortName(p)}</button>)}
              </div>
              <div className="gr-w" role="radiogroup" aria-label="Choisir un grammage">
                {WEIGHTS.map((w) => <button key={w} className={`wbtn${w >= 10 ? " gift" : ""}`} role="radio" aria-checked={w === grid.w} onClick={() => setGrid((g) => ({ ...g, w }))}><b>{String(w).replace(".", ",")}<span> g</span></b><small>{eur(priceOf(gLot, w))}</small></button>)}
              </div>
              <div className="bars" aria-hidden="true">
                {WEIGHTS.map((w) => { const pg = priceOf(gLot, w) / w, mx = priceOf(gLot, 1); return <div key={w} className={w === grid.w ? "on" : ""} style={{ height: `${Math.max(8, (pg / mx) * 100)}%` }}><span>{eur(pg).replace(" €", "")}</span></div>; })}
              </div>
              <div className="bars-l"><span>Prix au gramme, du plus cher au plus doux</span><span>✦ = cadeaux</span></div>
            </div>
            <div className="ticket">
              <p className="kicker">{edito(gLot).gamme} · {typeLabel(gLot)} · {edito(gLot).mol}</p>
              <p className="lname">{gLot.name}</p>
              <div className="total"><strong className="foil">{eur(priceOf(gLot, grid.w))}</strong><span>{gfmt(grid.w)} · soit {eur(priceOf(gLot, grid.w) / grid.w)} le gramme</span></div>
              <p className="save">{savingTxt(gLot, grid.w)}</p>
              <div className="gifts">
                <span className={giftCount(grid.w) ? "" : "off"}>✦ <b>{giftCount(grid.w) || "Aucun"} kit{giftCount(grid.w) > 1 ? "s" : ""} offert{giftCount(grid.w) > 1 ? "s" : ""}</b> · briquet et feuilles</span>
                <span className={giftCount(grid.w) ? "" : "off"}>✦ <b>{giftCount(grid.w) || "Aucun"} échantillon{giftCount(grid.w) > 1 ? "s" : ""} de 1 g</b> au choix</span>
              </div>
              <p className="nudge" dangerouslySetInnerHTML={{ __html: nudgeHtml(gLot, grid.w) }} />
              <button className="btn-or" onClick={() => addToCart(gLot, grid.w)}>Ajouter {gfmt(grid.w)} · {eur(priceOf(gLot, grid.w))}</button>
            </div>
          </div>
        </section>
      )}

      <section ref={maisonRef} id="maison" className="sec maison" aria-labelledby="mc-ma-t">
        <div className="m-sticky">
          <div className="m-txt">
            <p className="kicker">La maison — Abbaretz, 44</p>
            <h2 className="h-ed serif-i" id="mc-ma-t" style={{ fontSize: "clamp(44px,5.6vw,86px)" }}>Le rideau<br />se lève<span className="choc">à la nuit.</span></h2>
            <p>Une maison française née entre les lignes haute tension et la rue. On choisit chaque lot comme un joaillier choisit une pierre : à l'œil, à la main, sans compromis. Le reste, c'est de l'aplomb.</p>
          </div>
          <div className="arch" ref={archRef}>
            <Img srcs={AMBIANCE.duo} alt="Deux têtes de fleur CBD, l'une givrée blanche, l'autre violette naturelle, sur un socle d'onyx" loading="lazy" />
            <div className="shutter" aria-hidden="true"><div className="emb" dangerouslySetInnerHTML={{ __html: emblemSvg }} /><span className="stamp">Maison de nuit</span></div>
          </div>
          <div className="gammes">
            <p className="kicker">Les quatre gammes</p>
            {([["Exotique", "fleurs rares, profils fruités", 3], ["Force Noire", "résines denses, caractère", 4], ["Cali Genetics", "génétiques californiennes", 5], ["Artiste", "éditions signées", 6]] as const).map(([n, s, f], i) => (
              <button key={n} onClick={() => { setFilter(f); go("collection"); }}><span className={`neon${i % 2 ? " dim" : ""}`}>{n}</span><small>{s}</small></button>
            ))}
          </div>
        </div>
      </section>

      <section className="sec preuves" aria-label="Le savoir-faire">
        <article className="preuve rv"><Img srcs={AMBIANCE.givree} alt="Tête de fleur CBD couverte de trichomes blancs, sur un socle de marbre noir" loading="lazy" /><p className="kicker">Sélection</p><h3>Trié à la main</h3><p>Des têtes denses, givrées jusqu'au cœur. Chaque lot est choisi à l'œil, gramme après gramme, avant d'entrer dans la collection.</p></article>
        <article className={`preuve${pouchFail ? "" : " preuve-3d"} rv`} ref={pouchRef}>
          {pouchFail ? <img src={AMBIANCE.pochonPhoto} alt="Le pochon High Society" loading="lazy" /> : <canvas ref={pouchCanvas} aria-label="Le Pochon Royal High Society en 3D" />}
          <p className="kicker">Le Pochon Royal</p><h3>Damas noir et or, 48 h</h3>
          <p>Votre lot voyage dans notre pochon scellé. Colis discret par La Poste ou en point relais, et livraison en main propre autour du 44.</p>
          {!pouchFail && <small className="turn">↻ Faites-le tourner</small>}
        </article>
        <article className="preuve rv"><Img srcs={AMBIANCE.trichomes} alt="Macro de trichomes sur une fleur violette naturelle" loading="lazy" /><p className="kicker">Transparence</p><h3>Analysé en labo</h3><p>Analyse consultable sur chaque fiche. THC inférieur à 0,3 %, conforme à la réglementation française.</p></article>
      </section>

      <section id="sommelier" className="sec sommelier" aria-labelledby="mc-so-t">
        <div className="sec-hd rv">
          <div><p className="kicker">Trois questions, un lot</p><h2 className="h-ed serif-i" id="mc-so-t">Le Sommelier<span className="choc">express</span></h2></div>
          <p className="lead">Comme un sommelier vous parle d'une robe et d'un nez, le nôtre part de vos arômes préférés. <Link to="/sommelier" style={{ color: "var(--or-clair)" }}>Le grand Sommelier →</Link></p>
        </div>
        <div className="so">
          <div>
            {QUIZ.map((q, i) => (
              <div className="q" key={q.k}>
                <h4><span>0{i + 1}</span>{q.q}</h4>
                <div className="opts" role="radiogroup">{q.o.map(([l, v]) => <button key={v} className="chip" role="radio" aria-checked={quiz[q.k] === v} aria-pressed={quiz[q.k] === v} onClick={() => setQuiz((s) => ({ ...s, [q.k]: v }))}>{l}</button>)}</div>
              </div>
            ))}
          </div>
          {reco && (
            <div className="reco" aria-live="polite">
              <Img photoLast srcs={cutSources(reco)} alt={reco.name} loading="lazy" />
              <div>
                <p className="kicker">Le Sommelier vous sert</p>
                <h3>{reco.name}</h3>
                <p>{edito(reco).notes}</p>
                <PriceBlock p={reco} />
                <div className="row">
                  <button className="btn-or" onClick={() => addToCart(reco, 10)}>Ajouter 10 g · {eur(priceOf(reco, 10))}</button>
                  <Link className="btn-line" to={`/produit/${reco.id}`}>Voir le lot</Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="final" aria-labelledby="mc-fi-t" style={{ backgroundImage: `radial-gradient(ellipse 46% 50% at 50% 50%, rgba(6,5,8,.82), rgba(6,5,8,.35) 75%, rgba(6,5,8,.6) 100%), url(${AMBIANCE.violette[0]}), url(${AMBIANCE.violette[1]})` }}>
        <p className="kicker">Collection N° 26</p>
        <h2 className="serif-i" id="mc-fi-t">Le premier gramme<span className="choc foil">à 12 €.</span></h2>
        <p>Dès 10 g, un kit (briquet et feuilles) et un échantillon de 1 g sont offerts, à chaque tranche de 10 g. À la deuxième commande, BIENVENUE15 s'applique tout seul.</p>
        <a className="btn-or" href="#collection" onClick={(e) => { e.preventDefault(); go("collection"); }}>Entrer dans la collection</a>
      </section>
    </div>
  );
};

export default MinuitHome;
