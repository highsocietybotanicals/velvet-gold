import { useEffect } from "react";

// Compteur par classe : une mise en page et sa page peuvent poser la même classe sans se l'enlever l'une à l'autre.
const counts = new Map<string, number>();
const add = (k: string) => {
  const n = (counts.get(k) ?? 0) + 1;
  counts.set(k, n);
  if (n === 1) document.documentElement.classList.add(k);
};
const remove = (k: string) => {
  const n = (counts.get(k) ?? 1) - 1;
  if (n > 0) { counts.set(k, n); return; }
  counts.delete(k);
  document.documentElement.classList.remove(k);
};

/**
 * Habille la page avec la DA « Minuit Carat » (voir src/minuit-skin.css) :
 * pose `mn-skin` et `mn-<espace>` sur <html> tant que le composant est affiché
 * (les fenêtres et menus rendus hors de la page sont donc habillés aussi).
 */
export const useMinuitSkin = (area: string) => {
  useEffect(() => {
    const keys = ["mn-skin", `mn-${area}`];
    keys.forEach(add);
    return () => keys.forEach(remove);
  }, [area]);
};
