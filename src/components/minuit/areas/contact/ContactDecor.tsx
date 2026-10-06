// « Le guichet de nuit » (page Contact) : décor purement visuel, aucune logique métier.
// Enseigne néon, guichet de laiton (vitre, hygiaphone, sonnette), carte de visite gravée, cachet de cire.
import { createElement, useEffect, useRef, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import emblemSvg from "@/assets/brand/hsb-emblem.svg?raw";
import { isLowEnd } from "@/components/minuit/minuitData";

/* ---------- emblème : un seul exemplaire du tracé, réutilisé par <use> ---------- */
const EMB_VIEWBOX = /viewBox="([^"]+)"/.exec(emblemSvg)?.[1] ?? "0 0 3300 3400";
const EMB_INNER = emblemSvg.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");

export const EmblemSprite = () => (
  <svg className="mnc-sprite" width="0" height="0" aria-hidden="true" focusable="false" style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}>
    <symbol id="mnc-emb" viewBox={EMB_VIEWBOX} dangerouslySetInnerHTML={{ __html: EMB_INNER }} />
  </svg>
);

export const Emb = ({ className }: { className?: string }) => (
  <svg className={className} viewBox={EMB_VIEWBOX} aria-hidden="true" focusable="false">
    <use href="#mnc-emb" />
  </svg>
);

/* ---------- visibilité : data-seen (vu une fois), data-vis (à l'écran), data-lite (petit téléphone) ---------- */
/* fallbackMs (filet) : si le seuil reste hors d'atteinte alors que le bloc est en partie à l'écran
   (fenêtre très basse…), ou si l'observateur ne répond jamais, data-seen est posé au bout de fallbackMs.
   Le minuteur ne court que bloc visible : la mise en scène ne se joue pas hors écran. */
const useMark = <T extends HTMLElement>(threshold: number, fallbackMs = 0) => {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (isLowEnd()) el.setAttribute("data-lite", "");
    const seen = () => el.setAttribute("data-seen", "");
    // Déjà à l'écran au montage : marquage immédiat. L'observateur peut tarder (onglet en arrière-plan, page chargée
    // pendant une transition) et l'allumage de l'enseigne ne doit jamais attendre.
    const r0 = el.getBoundingClientRect();
    if (r0.height > 0 && r0.bottom > 0 && r0.top < window.innerHeight) {
      el.setAttribute("data-vis", "");
      const ratio0 = (Math.min(r0.bottom, window.innerHeight) - Math.max(r0.top, 0)) / r0.height;
      if (ratio0 >= threshold - 0.01) seen();
    }
    if (typeof IntersectionObserver === "undefined") {
      seen();
      el.setAttribute("data-vis", "");
      return;
    }
    let heard = false;
    let partial = 0;
    const disarm = () => {
      window.clearTimeout(partial);
      partial = 0;
    };
    const io = new IntersectionObserver(
      (entries) => {
        heard = true;
        const e = entries[entries.length - 1];
        if (e.isIntersecting) {
          el.setAttribute("data-vis", "");
          // petite tolérance : le navigateur peut signaler le franchissement un rien sous le seuil (arrondi)
          if (e.intersectionRatio >= threshold - 0.01) {
            seen();
            disarm();
          } else if (fallbackMs > 0 && !partial) partial = window.setTimeout(seen, fallbackMs);
        } else {
          el.removeAttribute("data-vis");
          disarm();
        }
      },
      { threshold: fallbackMs > 0 && threshold > 0 ? [0, threshold] : threshold },
    );
    io.observe(el);
    const guard = fallbackMs > 0 ? window.setTimeout(() => { if (!heard) seen(); }, fallbackMs) : 0;
    return () => {
      io.disconnect();
      disarm();
      window.clearTimeout(guard);
    };
  }, [threshold, fallbackMs]);
  return ref;
};

interface LiveProps { tag?: "section" | "div"; className: string; threshold?: number; fallbackMs?: number; labelledBy?: string; children: ReactNode }
/** Enveloppe de mise en scène : les animations CSS démarrent à l'entrée dans l'écran, les boucles s'arrêtent hors écran. */
export const Live = ({ tag = "div", className, threshold = 0.2, fallbackMs = 0, labelledBy, children }: LiveProps) => {
  const ref = useMark<HTMLElement>(threshold, fallbackMs);
  return createElement(tag, { ref, className, "aria-labelledby": labelledBy }, children);
};

/* ---------- enseigne néon « Ouvert la nuit » ---------- */
/* Sur téléphone la façade fait plus de deux écrans : on lit la carte, enseigne hors champ.
   Les boucles de l'enseigne et de son halo ne tournent donc que si l'enseigne est à l'écran
   (marge de 160 px : le halo déborde de l'enseigne) — data-sign-off posé sur la façade. */
export const NeonSign = () => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    const front = el?.closest<HTMLElement>(".mnc-front");
    if (!el || !front || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => front.toggleAttribute("data-sign-off", !entries[entries.length - 1].isIntersecting),
      { rootMargin: "160px 0px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      front.removeAttribute("data-sign-off");
    };
  }, []);
  return (
    <div ref={ref} className="mnc-sign" aria-hidden="true">
      <span className="mnc-wire mnc-wire-l" />
      <span className="mnc-wire mnc-wire-r" />
      <div className="mnc-board">
        <i className="mnc-screw" />
        <i className="mnc-screw" />
        <i className="mnc-screw" />
        <i className="mnc-screw" />
        {/* .mnc-neon s'allume (scintillement), .mnc-glow bourdonne : une seule animation d'opacité par élément */}
        <span className="mnc-neon mnc-neon-a">
          <span className="mnc-glow">Ouvert</span>
        </span>
        <span className="mnc-neon mnc-neon-b">
          <span className="mnc-glow">
            <svg className="mnc-moon" viewBox="0 0 40 40">
              <path d="M24 5.5A15 15 0 1 0 34.5 24A12 12 0 0 1 24 5.5Z" />
            </svg>
            <span>
              la nui<span className="mnc-bad">t</span>
            </span>
          </span>
        </span>
        <span className="mnc-board-cap">High Society · Collection N° 26</span>
      </div>
    </div>
  );
};

/* ---------- sonnette de comptoir ---------- */
const Bell = () => (
  <span className="mnc-bell">
    <span className="mnc-bell-waves"><i /><i /></span>
    <span className="mnc-bell-waves mnc-h"><i /><i /></span>
    <span className="mnc-bell-top">
      <span className="mnc-bell-ring">
        <span className="mnc-bell-pin" />
        <span className="mnc-bell-dome" />
      </span>
    </span>
    <span className="mnc-bell-base" />
  </span>
);

/* ---------- guichet de laiton : vitre, rideau, hygiaphone, comptoir ---------- */
export const Guichet = () => (
  <div className="mnc-booth" aria-hidden="true">
    <div className="mnc-frame">
      <div className="mnc-glass">
        <div className="mnc-room">
          <span className="mnc-shelf" />
          <Emb className="mnc-plaque" />
        </div>
        <span className="mnc-lamp" />
        <div className="mnc-shutter"><span>Sonnez</span></div>
        <svg className="mnc-arc" viewBox="0 0 400 130">
          <defs>
            <linearGradient id="mnc-foil-g" x1="0" y1="0" x2="1" y2=".25">
              <stop offset="0" stopColor="#7D6936" />
              <stop offset=".22" stopColor="#F4DC92" />
              <stop offset=".44" stopColor="#B8913E" />
              <stop offset=".6" stopColor="#FBE7A6" />
              <stop offset=".8" stopColor="#9C7A35" />
              <stop offset="1" stopColor="#E9C977" />
            </linearGradient>
            <path id="mnc-arc-p" d="M34 124A166 108 0 0 1 366 124" />
          </defs>
          <text>
            <textPath href="#mnc-arc-p" startOffset="50%" textAnchor="middle">GUICHET DE NUIT</textPath>
          </text>
        </svg>
        <div className="mnc-hygia"><span /></div>
        <span className="mnc-sheen" />
      </div>
    </div>
    <div className="mnc-counter">
      <span className="mnc-tray" />
      <span className="mnc-nose">Guichet N° 26</span>
      <Bell />
    </div>
  </div>
);

/* ---------- carte de visite gravée, glissée sous la vitre ---------- */
export const EngravedCard = ({ children }: { children: ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);
  /* Mesuré (perf/contact, trace Chrome) : laissé tel quel. Chrome aligne pointermove sur l'image : ce
     getBoundingClientRect lit des styles déjà à jour (0 recalcul forcé). Le déplacer dans un rAF le faisait
     passer APRÈS les autres rAF de la page (curseur…) qui salissent les styles : +25 % de recalculs. */
  const move = (ev: ReactPointerEvent<HTMLDivElement>) => {
    if (ev.pointerType !== "mouse") return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (ev.clientX - r.left) / r.width - 0.5;
    const y = (ev.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--ry", `${(x * 12).toFixed(2)}deg`);
    el.style.setProperty("--rx", `${(-y * 9).toFixed(2)}deg`);
    el.style.setProperty("--gx", (x * 160).toFixed(1));
  };
  const leave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--gx", "-170");
  };
  return (
    <div className="mnc-slot">
      <div className="mnc-out">
        <div ref={ref} className="mnc-card" onPointerMove={move} onPointerLeave={leave}>
          <span className="mnc-guilloche" aria-hidden="true" />
          {children}
          <span className="mnc-glint" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
};

/* ---------- cachet de cire doré à l'emblème ---------- */
const SEAL_PATH = (() => {
  const n = 24;
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const r = 45 + Math.sin(i * 2.3) * 1.8 + Math.cos(i * 3.7) * 1.3 + (i === 4 ? 4.5 : i === 13 ? 3.5 : i === 19 ? 5 : 0);
    pts.push([50 + Math.cos(a) * r, 50 + Math.sin(a) * r]);
  }
  const f = (v: number) => v.toFixed(2);
  const mid = (p: [number, number], q: [number, number]) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  const m0 = mid(pts[n - 1], pts[0]);
  let d = `M${f(m0[0])} ${f(m0[1])}`;
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const m = mid(p, pts[(i + 1) % n]);
    d += `Q${f(p[0])} ${f(p[1])} ${f(m[0])} ${f(m[1])}`;
  }
  return d + "Z";
})();
const SPECKS = [0, 52, 104, 155, 208, 258, 310];

/* Ombre portée du cachet, pré-dessinée (remplace filter: drop-shadow(0 7px 7px rgba(0,0,0,.65)), qui obligeait
   le compositeur à recalculer un flou à chaque image du coup de tampon) : 21 copies du contour, agrandies par
   quart d'écart-type de -2,5 σ à +2,5 σ et superposées, reproduisent le profil gaussien du flou (σ = 3,5 px).
   Chaque copie a l'opacité qui donne, bande par bande, 65 % × Φ(-d/σ). Pas (σ) et décalage (7 px) sont
   convertis en unités SVG selon la taille du cachet : voir --sg / --sdy dans contact.css. Raster unique. */
const SHADOW = (() => {
  // fonction de répartition de la loi normale (Abramowitz-Stegun 7.1.26, erreur < 1,5e-7)
  const phi = (x: number) => {
    const z = Math.abs(x) / Math.SQRT2;
    const t = 1 / (1 + 0.3275911 * z);
    const erf = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-z * z);
    return x >= 0 ? (1 + erf) / 2 : (1 - erf) / 2;
  };
  const n = 21;
  // transmission voulue dans la bande j (milieu de bande à (-2,625 + 0,25 j) σ du contour)
  const tr = (j: number) => (j >= n ? 1 : 1 - 0.65 * phi(2.625 - 0.25 * j));
  return Array.from({ length: n }, (_, j) => ({ n: -2.5 + 0.25 * j, a: (1 - tr(j) / tr(j + 1)).toFixed(4) }));
})();

export const WaxSeal = () => {
  const ref = useMark<HTMLDivElement>(0.6);
  return (
    <div ref={ref} className="mnc-seal-wrap" aria-hidden="true">
      <span className="mnc-ribbon mnc-ribbon-a" />
      <span className="mnc-ribbon mnc-ribbon-b" />
      <span className="mnc-seal-ring" />
      <span className="mnc-specks">
        {SPECKS.map((a) => <i key={a} style={{ "--a": `${a}deg` } as CSSProperties} />)}
      </span>
      <svg className="mnc-seal" viewBox="-6 -6 112 112">
        <defs>
          <radialGradient id="mnc-wax" cx=".38" cy=".32" r=".75">
            <stop offset="0" stopColor="#FBE7A6" />
            <stop offset=".3" stopColor="#DDB866" />
            <stop offset=".62" stopColor="#A8822F" />
            <stop offset=".88" stopColor="#6B5220" />
            <stop offset="1" stopColor="#4A3812" />
          </radialGradient>
          <radialGradient id="mnc-wax-in" cx=".44" cy=".4" r=".7">
            <stop offset="0" stopColor="#EBCB7B" />
            <stop offset=".7" stopColor="#B8913E" />
            <stop offset="1" stopColor="#8A6A2A" />
          </radialGradient>
          <path id="mnc-seal-p" d={SEAL_PATH} />
        </defs>
        <g className="mnc-seal-sh">
          {SHADOW.map((s) => (
            <use key={s.n} href="#mnc-seal-p" fillOpacity={s.a} style={{ "--n": s.n } as CSSProperties} />
          ))}
        </g>
        <path d={SEAL_PATH} fill="url(#mnc-wax)" />
        <circle cx="50" cy="50" r="34.6" fill="none" stroke="rgba(255,240,200,.38)" strokeWidth=".8" />
        <circle cx="50" cy="50" r="33.4" fill="url(#mnc-wax-in)" stroke="rgba(74,54,18,.75)" strokeWidth="1.6" />
        <circle cx="50" cy="50" r="29.5" fill="none" stroke="rgba(74,54,18,.55)" strokeWidth=".9" strokeDasharray=".1 2.3" strokeLinecap="round" />
        <use href="#mnc-emb" x="30.7" y="30.2" width="40" height="41" className="mnc-seal-hi" />
        <use href="#mnc-emb" x="30" y="29.4" width="40" height="41" className="mnc-seal-emb" />
      </svg>
    </div>
  );
};
