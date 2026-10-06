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

// Entrée des casiers : un second observateur partagé, mêmes réglages que l'ancien
// whileInView de framer-motion (viewport { once: true, margin: "-50px" }, seuil 0).
// Il pose data-in une seule fois ; l'animation elle-même est en CSS (coffre.css, cf-lk-in),
// donc jouée par le compositeur et non image par image en JavaScript.
let revealIo: IntersectionObserver | null = null;
const revealObserver = () => {
  if (!revealIo) {
    revealIo = new IntersectionObserver(
      (entries, o) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.setAttribute("data-in", "");
          o.unobserve(e.target);
        }),
      { rootMargin: "-50px", threshold: 0 },
    );
  }
  return revealIo;
};

/** enabled = false (mouvement réduit) : l'élément est montré tout de suite, sans entrée. */
export const useRevealOnce = (ref: RefObject<Element>, enabled = true) => {
  useEffect(() => {
    const el = ref.current;
    if (!el || el.hasAttribute("data-in")) return;
    if (!enabled || typeof IntersectionObserver === "undefined") {
      el.setAttribute("data-in", "");
      return;
    }
    const o = revealObserver();
    o.observe(el);
    return () => o.unobserve(el);
  }, [ref, enabled]);
};
