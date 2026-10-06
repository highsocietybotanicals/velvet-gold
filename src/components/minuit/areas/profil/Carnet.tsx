// « Le carnet du membre » (espace Mon profil) : pièces purement visuelles.
// Aucune donnée n'est lue ni écrite ici : la page passe seulement des textes à afficher.
import { Fragment, useId, useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { MotionConfig } from "framer-motion";
import emblemSvg from "@/assets/brand/hsb-emblem.svg?raw";

/** Tracé de l'emblème (un seul chemin dans le SVG de la marque). */
const EMBLEM_D = (emblemSvg.match(/\sd="([^"]+)"/) || [])[1] || "";

const FOIL_STOPS: [number, string][] = [
  [0, "#7D6936"], [0.16, "#C9A24A"], [0.3, "#F4DC92"], [0.44, "#B8913E"],
  [0.56, "#FBE7A6"], [0.7, "#9C7A35"], [0.84, "#E9C977"], [1, "#7D6936"],
];

/** Emblème vectoriel en feuille d'or (dégradé propre à chaque instance). */
export const PfEmblem = ({ className }: { className?: string }) => {
  const gid = `pf-foil-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg className={className} viewBox="0 0 3300 3400" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          {FOIL_STOPS.map(([o, c]) => <stop key={o} offset={o} stopColor={c} />)}
        </linearGradient>
      </defs>
      <g transform="translate(0,3400) scale(0.1,-0.1)" fill={`url(#${gid})`}>
        <path d={EMBLEM_D} />
      </g>
    </svg>
  );
};

/**
 * Nom gravé à la feuille d'or, lettre à lettre.
 * Le texte réel est lu par les lecteurs d'écran ; les lettres animées sont décoratives.
 */
export const EngravedName = ({ text, className }: { text: string; className?: string }) => {
  const words = text.split(/\s+/).filter(Boolean);
  const n = Math.max(1, words.join("").length);
  const longest = words.reduce((m, w) => Math.max(m, w.length), 0);
  const size = longest > 20 ? "xs" : longest > 14 ? "s" : longest > 10 ? "m" : "l";
  let k = 0;
  return (
    <p className={[className, `pf-name-${size}`].filter(Boolean).join(" ")} style={{ "--n": n, "--fs": `${n * 100}%` } as CSSProperties}>
      <span className="sr-only">{text}</span>
      <span className="pf-glyphs" aria-hidden="true">
        {words.map((w, wi) => (
          <Fragment key={wi}>
            <span className="pf-word">
              {Array.from(w).map((ch) => {
                const i = k++;
                const pos = n > 1 ? (i / (n - 1)) * 100 : 50;
                return (
                  <span key={i} className="pf-ch" style={{ "--i": i, "--p": `${pos}%` } as CSSProperties}>
                    {ch}
                  </span>
                );
              })}
            </span>
            {wi < words.length - 1 ? " " : null}
          </Fragment>
        ))}
      </span>
      <span className="pf-name-rule" aria-hidden="true" />
    </p>
  );
};

/** Couverture de cuir noir (recto doré à chaud, verso guilloché avec ex-libris). Décor uniquement. */
export const CarnetCover = () => (
  <>
    <div className="pf-cover" aria-hidden="true">
      <div className="pf-face pf-front">
        <span className="pf-spine" />
        <span className="pf-tool" />
        <span className="pf-corner tl">✦</span>
        <span className="pf-corner tr">✦</span>
        <span className="pf-corner bl">✦</span>
        <span className="pf-corner br">✦</span>
        <span className="pf-cv-top">High Society</span>
        <PfEmblem className="pf-cv-emb" />
        <span className="pf-cv-title">Carnet du membre</span>
        <span className="pf-cv-sub">Collection N° 26</span>
      </div>
      <div className="pf-face pf-back">
        <div className="pf-exlibris">
          <span className="pf-ex-k">Ex-libris</span>
          <PfEmblem className="pf-ex-emb" />
          <span className="pf-ex-t">High Society Botanicals</span>
          <span className="pf-ex-s">Maison française · Abbaretz (44)</span>
        </div>
      </div>
    </div>
    <span className="pf-band" aria-hidden="true" />
  </>
);

/**
 * Révèle les pages du carnet (feuillet qui se pose) et imprime les tampons un à un
 * quand ils entrent à l'écran. Un seul IntersectionObserver ; les éléments ajoutés plus tard
 * (commandes chargées, détails ouverts) sont repérés par un MutationObserver.
 * Sans IntersectionObserver ou avec « réduire les animations » : tout reste affiché, immobile.
 */
export const CarnetReveal = ({ className, children }: { className?: string; children: ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root || typeof window === "undefined" || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    root.classList.add("pf-armed");
    // Un tampon ne s'imprime qu'une fois sa page posée : si la page vient d'apparaître (fondu 0,8 s,
    // bascule 1,15 s), on attend qu'elle soit stable ; si elle est déjà en place, on imprime aussitôt.
    const SETTLE_MS = 550;
    const revealedAt = new WeakMap<Element, number>();
    const settleWait = (stamp: Element, now: number) => {
      const page = stamp.parentElement?.closest("[data-pf-reveal]");
      if (!page) return 0;
      const t0 = revealedAt.get(page);
      if (t0 === undefined) return page.classList.contains("is-in") ? 0 : SETTLE_MS;
      return Math.max(0, Math.round(t0 + SETTLE_MS - now));
    };
    const io = new IntersectionObserver(
      (entries) => {
        let k = 0;
        const now = performance.now();
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          if (el.hasAttribute("data-pf-stamp")) el.style.setProperty("--pf-d", `${settleWait(el, now) + k++ * 170}ms`);
          else revealedAt.set(el, now);
          el.classList.add("is-in");
          io.unobserve(el);
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0 },
    );
    const seen = new WeakSet<Element>();
    const scan = () =>
      root.querySelectorAll("[data-pf-reveal], [data-pf-stamp]").forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        io.observe(el);
      });
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(root, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
      root.classList.remove("pf-armed");
    };
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <div ref={ref} className={className}>
        {children}
      </div>
    </MotionConfig>
  );
};
