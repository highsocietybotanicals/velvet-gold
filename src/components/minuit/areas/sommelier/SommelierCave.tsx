// « La cave du Sommelier » : la section et son décor (voûtes, casiers, lueur de bougie, sol, poussières d'or).
// Purement visuel. Les boucles décoratives ne tournent que lorsque leur groupe est à l'écran (classe is-live
// sur la cave, le halo, le néon et la colonne de la roue : sur téléphone la roue est sous la carte),
// et restent figées sur un téléphone modeste (classe lite) ou si la visiteuse réduit les animations (CSS).
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { isLowEnd } from "@/components/minuit/minuitData";
import { observeLive } from "./live";
import "./sommelier.css";

// poussières d'or (ordinateur seulement, voir le CSS)
const MOTES = [
  { l: "8%", d: "17s", dl: "-2s", dx: "26px" },
  { l: "19%", d: "21s", dl: "-9s", dx: "-18px" },
  { l: "31%", d: "15s", dl: "-5s", dx: "14px" },
  { l: "46%", d: "23s", dl: "-14s", dx: "-24px" },
  { l: "58%", d: "18s", dl: "-3s", dx: "20px" },
  { l: "71%", d: "20s", dl: "-11s", dx: "-12px" },
  { l: "83%", d: "16s", dl: "-7s", dx: "22px" },
  { l: "93%", d: "22s", dl: "-16s", dx: "-20px" },
];

const SommelierCave = ({ children }: { children: ReactNode }) => {
  const ref = useRef<HTMLElement>(null);
  const [lite] = useState(isLowEnd);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // éléments à classe constante uniquement (React ne réécrit pas leur className) : la cave, le halo, le néon, la colonne de la roue
    return observeLive([el, ...el.querySelectorAll(".sm-glow, .sm-title-neon, .sm-wheel-col")]);
  }, []);

  return (
    <section ref={ref} id="sommelier" className={`sm-cave${lite ? " lite" : ""}`} aria-labelledby="sm-title">
      <div className="sm-decor" aria-hidden="true">
        <div className="sm-vaults">
          <i /><i /><i /><i /><i />
        </div>
        <div className="sm-racks l" />
        <div className="sm-racks r" />
        <div className="sm-glow" />
        <div className="sm-floor" />
        <div className="sm-motes">
          {MOTES.map((m) => (
            <i key={m.l} style={{ "--l": m.l, "--d": m.d, "--dl": m.dl, "--dx": m.dx } as CSSProperties} />
          ))}
        </div>
      </div>
      {children}
    </section>
  );
};

export default SommelierCave;
