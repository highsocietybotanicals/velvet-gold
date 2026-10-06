// Le Coffre : un seul IntersectionObserver partagé pour toute la page.
// Il pose data-on sur les éléments visibles : les boucles CSS (lot qui flotte, rayons, néon)
// ne tournent que là, et s'arrêtent dès que l'élément sort de l'écran.
// Attribut (et non classe) : React ne le réécrit jamais lors d'un nouveau rendu.
import { useEffect, type RefObject } from "react";
import { isLowEnd } from "@/components/minuit/minuitData";

/** Téléphone modeste : aucune boucle d'animation, état final statique. */
export const LITE =
  typeof window !== "undefined" && window.matchMedia("(max-width: 899px)").matches && isLowEnd();

let io: IntersectionObserver | null = null;
const observer = () => {
  if (!io) {
    io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.setAttribute("data-on", "");
          else e.target.removeAttribute("data-on");
        }),
      { rootMargin: "60px 0px" },
    );
  }
  return io;
};

export const useInViewAttr = (ref: RefObject<Element>, enabled = true) => {
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled || LITE) return;
    if (typeof IntersectionObserver === "undefined") {
      el.setAttribute("data-on", "");
      return;
    }
    const o = observer();
    o.observe(el);
    return () => {
      o.unobserve(el);
      el.removeAttribute("data-on");
    };
  }, [ref, enabled]);
};
