import { useLayoutEffect, type RefObject } from "react";
import { isLowEnd } from "@/components/minuit/minuitData";

// Mise en scène du manifeste (/societe), purement visuelle : classes posées sur la racine, aucun état React.
//  - impulsions dorées le long des câbles : stroke-dashoffset piloté par le défilement,
//    écouteurs branchés seulement quand le manifeste est à l'écran (IntersectionObserver) ;
//  - rideaux de fer : chaque chapitre reçoit .is-open en entrant dans l'écran ;
//  - .is-powered quand la lecture arrive au bout : le néon et la ville s'allument.
// Mouvement réduit (ou navigateur sans IntersectionObserver) : état final statique, tout est ouvert.

const TRAVEL = 2600; // distance parcourue par les impulsions sur toute la lecture (unités du viewBox)
const INTRO = 760; // élan des impulsions à l'arrivée sur la page
const PHASES = [0, 190, 95, 280, 45, 330, 150, 240, 20, 300, 120, 210];
const POWER_AT = 0.94;
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export const useManifesto = (rootRef: RefObject<HTMLElement>) => {
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const cables = Array.from(root.querySelectorAll<SVGGElement>(".so-cable"))
      .map((g) => ({ els: Array.from(g.querySelectorAll<SVGPathElement>(".so-pulse")), far: g.classList.contains("so-line-b") }))
      .filter((c) => c.els.length)
      .map((c, i) => ({ ...c, phase: PHASES[i % PHASES.length] }));
    const desk = () => window.matchMedia("(min-width: 900px)").matches;
    let p = 0, intro = 0, wide = desk(), powered = false;
    const draw = () => {
      const base = p * TRAVEL + intro * INTRO;
      for (const c of cables) {
        if (c.far && !wide) continue; // sur téléphone, la seconde ligne est hors cadre : on ne la repeint pas
        const o = (-(base + c.phase)).toFixed(1);
        for (const el of c.els) el.style.strokeDashoffset = o;
      }
      const on = p > POWER_AT;
      if (on !== powered) {
        powered = on;
        root.classList.toggle("is-powered", on);
      }
    };

    const openAll = () => root.querySelectorAll<HTMLElement>(".so-plate, .so-ch").forEach((el) => el.classList.add("is-open"));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || typeof IntersectionObserver === "undefined") {
      p = 1; intro = 1; wide = true;
      draw();
      root.classList.add("is-still", "is-powered");
      openAll();
      return () => root.classList.remove("is-still", "is-powered");
    }

    root.classList.add("is-armed");
    if (isLowEnd()) root.classList.add("is-lite");

    let raf = 0, introRaf = 0, live = false;
    const measure = () => {
      const r = root.getBoundingClientRect(), span = r.height - window.innerHeight;
      p = span > 0 ? clamp01(-r.top / span) : 1;
    };
    const frame = () => { raf = 0; measure(); draw(); };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(frame); };
    const onResize = () => { wide = desk(); onScroll(); };

    const t0 = performance.now();
    const introTick = (t: number) => {
      const k = Math.min(1, (t - t0) / 2400);
      intro = 1 - Math.pow(1 - k, 3);
      draw();
      introRaf = k < 1 && live ? requestAnimationFrame(introTick) : 0;
    };

    // pause hors écran : aucun écouteur ni boucle tant que le manifeste n'est pas visible
    const io = new IntersectionObserver(([e]) => {
      live = e.isIntersecting;
      root.classList.toggle("is-inview", live);
      if (live) {
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onResize);
        onResize();
        if (intro < 1 && !introRaf) introRaf = requestAnimationFrame(introTick);
      } else {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onResize);
        cancelAnimationFrame(raf);
        cancelAnimationFrame(introRaf);
        raf = introRaf = 0;
        intro = 1;
      }
    });
    io.observe(root);

    // rideaux de fer : levés une fois, dès que le haut du chapitre passe le dernier quart de l'écran
    // (seuil 0 : fonctionne quelle que soit la hauteur de la plaque, même sur un écran très bas)
    const curtains = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add("is-open");
        e.target.closest(".so-ch")?.classList.add("is-open");
        curtains.unobserve(e.target);
      }
    }, { threshold: 0, rootMargin: "0px 0px -22% 0px" });
    root.querySelectorAll(".so-plate").forEach((el) => curtains.observe(el));

    // deux images plus tard : l'état de départ est peint, l'arrivée peut s'animer
    let r2 = 0;
    const r1 = requestAnimationFrame(() => { r2 = requestAnimationFrame(() => root.classList.add("is-ready")); });

    return () => {
      io.disconnect();
      curtains.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      [raf, introRaf, r1, r2].forEach(cancelAnimationFrame);
      root.classList.remove("is-armed", "is-lite", "is-ready", "is-inview", "is-powered");
    };
  }, [rootRef]);
};
