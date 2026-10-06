import { useEffect, useId, useRef, type CSSProperties, type ReactNode } from "react";
import { embStyle } from "./proEmblem";

/* Décors de l'Espace Pro « Le salon privé ». Purement visuels : aucune donnée, aucun état métier. */

/**
 * Enveloppe qui fait apparaître ses enfants [data-pr-reveal] à l'entrée dans l'écran.
 * Sans IntersectionObserver ou en mouvement réduit, tout reste visible (rien n'est masqué d'avance).
 */
export const ProReveal = ({ className, children }: { className?: string; children: ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root || !("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const els = Array.from(root.querySelectorAll<HTMLElement>("[data-pr-reveal]"));
    if (!els.length) return;
    root.classList.add("pr-armed");
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }),
      { rootMargin: "0px 0px -6% 0px", threshold: 0.08 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
};

/**
 * Chiffres façon tableau à palettes : chaque caractère bascule à son arrivée,
 * et seuls les caractères qui changent rebasculent (clé = position + caractère).
 */
export const ProFlap = ({ text, className }: { text: string; className?: string }) => (
  <span className={`pr-flap${className ? ` ${className}` : ""}`}>
    <span className="sr-only">{text}</span>
    <span aria-hidden="true">
      {Array.from(text).map((c, k) => (
        <span key={`${k}-${c}`} className="pr-flap-c" style={{ "--k": k } as CSSProperties}>
          {c === " " ? " " : c}
        </span>
      ))}
    </span>
  </span>
);

/**
 * Plaque de membre : petite plaque de laiton rivetée, gravée « PRO · N° 26 » comme la carte de membre,
 * vissée à l'apparition. Fait écho à la carte dans le panier et le registre des commandes.
 */
export const ProPlaque = ({ className }: { className?: string }) => (
  <div className={`pr-plaque${className ? ` ${className}` : ""}`} aria-hidden="true">
    <span className="pr-plaque-emb">
      <i style={embStyle} />
    </span>
    <span className="pr-plaque-t">
      <b>PRO · N° 26</b>
      <small>Salon privé</small>
    </span>
  </div>
);

/** Cordon de velours entre deux potelets de laiton : on entre au salon sur dossier. */
export const ProVelvetRope = ({ label }: { label: string }) => {
  const gid = `pr-rope-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <ProReveal className="pr-rope-wrap">
      <div className="pr-rope" data-pr-reveal="" aria-hidden="true">
        <i className="pr-post l" />
        <svg className="pr-rope-svg" viewBox="0 0 100 100" preserveAspectRatio="none" focusable="false">
          <defs>
            <linearGradient id={gid} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="#1d0b24" />
              <stop offset=".5" stopColor="#5a2370" />
              <stop offset="1" stopColor="#1d0b24" />
            </linearGradient>
          </defs>
          <path d="M3 18 C 30 96, 70 96, 97 18" stroke={`url(#${gid})`} className="rope" />
          <path d="M3 16 C 30 92, 70 92, 97 16" className="rope-hi" />
        </svg>
        <i className="pr-post r" />
        <span className="pr-rope-plate">{label}</span>
      </div>
    </ProReveal>
  );
};
