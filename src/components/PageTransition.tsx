import { createContext, ReactNode, useContext, useLayoutEffect, useRef } from "react";

/**
 * Transition de page en CSS pur (classes .page-transition / .page-transition-exit dans index.css) :
 * même rendu qu'avant avec framer-motion — entrée en fondu + montée de 20 px, sortie en fondu,
 * 0,4 s, courbe cubic-bezier(.25,.46,.45,.94) — mais jouée par le compositeur, sans JavaScript à chaque image.
 * La sortie est orchestrée par AnimatedRoutes (équivalent d'AnimatePresence mode="wait").
 */
export interface PagePresence {
  exiting: boolean;
  /** signale qu'une page avec sortie en fondu est montée ; renvoie la fonction de retrait */
  register: () => () => void;
  /** appelé quand le fondu de sortie est terminé */
  exitDone: () => void;
}

export const PagePresenceContext = createContext<PagePresence | null>(null);

interface PageTransitionProps {
  children: ReactNode;
}

const DURATION_MS = 400;
const EASE = "cubic-bezier(.25,.46,.45,.94)";

const PageTransition = ({ children }: PageTransitionProps) => {
  const presence = useContext(PagePresenceContext);
  useLayoutEffect(() => (presence ? presence.register() : undefined), [presence?.register]);
  const exiting = !!presence?.exiting;

  const ref = useRef<HTMLDivElement>(null);
  const wasExiting = useRef(false);
  const settle = useRef<Animation | null>(null);

  // Les classes de sortie sont posées ici (avant l'affichage) et non par React : au retour sur cette page pendant
  // son fondu de sortie, on peut ainsi lire l'opacité atteinte avant de retirer la sortie, puis repartir de cette
  // opacité jusqu'à 1 (comme framer-motion) au lieu de rejouer toute l'entrée depuis 0.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || exiting === wasExiting.current) return;
    wasExiting.current = exiting;

    if (exiting) {
      // nouvelle sortie alors qu'un retour en fondu est en cours : elle part de l'opacité courante, pas de 1
      const s = settle.current;
      settle.current = null;
      if (s) {
        if (s.playState === "running") {
          try { s.commitStyles(); } catch { /* navigateur sans commitStyles : départ à 1 */ }
        }
        s.cancel();
      }
      el.classList.remove("page-transition-settled");
      el.classList.add("page-transition-exit");
      return;
    }

    // retour sur cette page pendant sa sortie : reprise depuis l'opacité courante, sans rejouer l'entrée
    const from = parseFloat(window.getComputedStyle(el).opacity);
    el.classList.remove("page-transition-exit");
    el.classList.add("page-transition-settled");
    el.style.opacity = "";
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (from < 1 && !reduce && typeof el.animate === "function") {
      const a = el.animate([{ opacity: from }, { opacity: 1 }], { duration: DURATION_MS, easing: EASE });
      settle.current = a;
      a.onfinish = () => { if (settle.current === a) settle.current = null; };
    }
  }, [exiting]);

  return (
    <div
      ref={ref}
      className="page-transition"
      style={{ width: "100%" }}
      onAnimationEnd={
        exiting
          ? (e) => {
              if (e.target === e.currentTarget && e.animationName === "hsb-page-out") presence?.exitDone();
            }
          : undefined
      }
    >
      {children}
    </div>
  );
};

export default PageTransition;
