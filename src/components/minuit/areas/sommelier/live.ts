// Boucles décoratives de la cave : chaque groupe (halo, néon, roue, lot) porte la classe is-live tant qu'il est
// à l'écran (marge de 160 px pour ses débordements peints : halos, lueurs). Hors écran, le CSS met ses boucles en
// pause, ce qui évite au navigateur de recalculer leurs styles à chaque image. Purement visuel.
// Ne poser is-live que sur des éléments dont React ne réécrit jamais la classe (className constant).
export const observeLive = (targets: Element[]): (() => void) => {
  if (typeof IntersectionObserver === "undefined") {
    targets.forEach((t) => t.classList.add("is-live"));
    return () => {};
  }
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.target.classList.toggle("is-live", e.isIntersecting)),
    { rootMargin: "160px 0px" }
  );
  targets.forEach((t) => io.observe(t));
  return () => io.disconnect();
};
