import { useEffect, useRef, type CSSProperties } from "react";

export interface ProTickerItem {
  id: string;
  name: string;
  /** Cote déjà formatée par la page (prix pro existant, jamais recalculé ici). */
  cote: string;
  out?: boolean;
}

/**
 * Bandeau défilant de la cote : les références et leur prix pro du moment, sans aucune variation inventée.
 * Doublon visuel du tableau (aria-hidden). Défilement en pause hors écran ; statique en mouvement réduit.
 */
const ProTicker = ({ items }: { items: ProTickerItem[] }) => {
  const ref = useRef<HTMLDivElement>(null);
  const shown = items.length > 0;

  // Le bandeau n'existe qu'avec des références : l'observateur se branche dès qu'il apparaît.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) { el.classList.add("is-live"); return; }
    const io = new IntersectionObserver(([e]) => el.classList.toggle("is-live", e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, [shown]);

  if (!shown) return null;

  return (
    <div
      ref={ref}
      className="pr-ticker"
      aria-hidden="true"
      style={{ "--dur": `${Math.max(28, items.length * 6)}s` } as CSSProperties}
    >
      <span className="pr-ticker-lbl">
        Cote <b>€/g HT</b>
      </span>
      <div className="pr-ticker-win">
        <div className="pr-ticker-track">
          {[0, 1].map((copy) =>
            items.map((it) => (
              <span key={`${copy}-${it.id}`} className={`pr-ticker-it${it.out ? " is-out" : ""}`}>
                <b>{it.name}</b>
                <em>{it.cote}</em>
                {it.out && <small>Rupture</small>}
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ProTicker;
