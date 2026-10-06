import { useLayoutEffect, type RefObject } from "react";
import { isLowEnd } from "@/components/minuit/minuitData";

// Mise en scène du manifeste (/societe), purement visuelle : classes posées sur la racine, aucun état React.
//  - impulsions dorées le long des câbles : stroke-dashoffset piloté par le défilement,
//    écouteurs branchés seulement quand le manifeste est à l'écran (IntersectionObserver) ;
//    une seule image rAF à la fois (élan d'arrivée et défilement réunis), géométrie de la racine
//    mise en cache (ResizeObserver) : aucune mesure de mise en page à chaque image ;
//    seuls les tracés visibles sont recalculés, et seulement quand leur valeur change ;
//  - rideaux de fer : chaque chapitre reçoit .is-open en entrant dans l'écran ;
//  - .is-powered quand la lecture arrive au bout : le néon et la ville s'allument ;
//  - .is-cue-off quand l'invitation à défiler sort de l'écran : sa boucle se met en pause.
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
      .map((g) => ({ els: Array.from(g.querySelectorAll<SVGPathElement>(".so-pulse")), far: g.classList.contains("so-line-b"), alt: g.hasAttribute("data-alt") }))
      .filter((c) => c.els.length)
      .map((c, i) => ({ ...c, phase: PHASES[i % PHASES.length], last: "" }));
    let drawn = cables; // tracés réellement recalculés (allégé sur appareil modeste, plus bas)
    const desk = () => window.matchMedia("(min-width: 900px)").matches;
    let p = 0, intro = 0, wide = desk(), powered = false;
    const draw = () => {
      const base = p * TRAVEL + intro * INTRO;
      for (const c of drawn) {
        if (c.far && !wide) continue; // sur téléphone, la seconde ligne est hors cadre : on ne la repeint pas
        const o = (-(base + c.phase)).toFixed(1);
        if (o === c.last) continue; // rien n'a bougé : aucune écriture de style
        c.last = o;
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
    if (isLowEnd()) {
      root.classList.add("is-lite");
      // appareil modeste : halos et un câble sur deux sont masqués en CSS (.is-lite), on ne les recalcule pas
      drawn = cables.filter((c) => !c.alt).map((c) => ({ ...c, els: c.els.filter((el) => !el.classList.contains("so-halo")) }));
    }

    // géométrie de la racine (haut dans le document, hauteur, hauteur d'écran), relue seulement quand elle change.
    // Le haut se lit dans la mise en page (offsetTop), pas à l'écran : la transition d'entrée de page
    // (translateY passager d'un ancêtre) ne fausse pas la valeur gardée en cache.
    let rootTop = 0, rootH = 0, vh = window.innerHeight;
    const geo = () => {
      let y = 0;
      for (let el: HTMLElement | null = root; el; el = el.offsetParent as HTMLElement | null) y += el.offsetTop;
      rootTop = y; rootH = root.getBoundingClientRect().height; vh = window.innerHeight;
    };
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(geo);
    // position de défilement relevée dans l'évènement scroll (styles encore propres), pas dans le rAF :
    // lue après les écritures d'autres boucles rAF de la page, elle forcerait un recalcul de style par image
    let sy = 0;
    const measure = () => {
      if (!ro) geo(); // navigateur sans ResizeObserver : mesure directe, comme avant
      const span = rootH - vh;
      p = span > 0 ? clamp01((sy - rootTop) / span) : 1;
    };

    // une seule image à la fois : l'élan d'arrivée et le défilement partagent le même rAF
    let raf = 0, live = false, scrolled = false, introOn = false;
    const t0 = performance.now();
    const tick = (t: number) => {
      raf = 0;
      if (introOn) {
        const k = Math.min(1, (t - t0) / 2400);
        intro = 1 - Math.pow(1 - k, 3);
        if (k >= 1) introOn = false;
      }
      if (scrolled) { scrolled = false; measure(); }
      draw();
      if (introOn && live) raf = requestAnimationFrame(tick);
    };
    const onScroll = () => { sy = window.scrollY; scrolled = true; if (!raf) raf = requestAnimationFrame(tick); };
    const onResize = () => { wide = desk(); geo(); onScroll(); };

    // pause hors écran : aucun écouteur ni boucle tant que le manifeste n'est pas visible
    const io = new IntersectionObserver(([e]) => {
      live = e.isIntersecting;
      root.classList.toggle("is-inview", live);
      if (live) {
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onResize, { passive: true });
        if (intro < 1) introOn = true;
        onResize();
      } else {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onResize);
        cancelAnimationFrame(raf);
        raf = 0;
        introOn = false;
        intro = 1;
      }
    });
    io.observe(root);
    if (ro) { ro.observe(root); ro.observe(document.documentElement); }

    // invitation à défiler : sa boucle (goutte-à-goutte) s'arrête dès qu'elle quitte l'écran
    const cue = root.querySelector(".so-cue");
    const cueIo = new IntersectionObserver(([e]) => root.classList.toggle("is-cue-off", !e.isIntersecting));
    if (cue) cueIo.observe(cue);

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
      cueIo.disconnect();
      curtains.disconnect();
      ro?.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      [raf, r1, r2].forEach(cancelAnimationFrame);
      root.classList.remove("is-armed", "is-lite", "is-ready", "is-inview", "is-powered", "is-cue-off");
    };
  }, [rootRef]);
};
