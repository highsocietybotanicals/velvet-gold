// Sceau de la carte (téléphone et tablette) : la roue des arômes en réduction, accrochée au coin de la carte,
// pour que la visiteuse voie la roue tourner et s'allumer pendant qu'elle lit la carte, la grande roue étant
// alors hors de l'écran. Purement visuel (aria-hidden), mêmes positions que la grande roue, sans texte gravé.
import { useId, type CSSProperties } from "react";
import type { Product } from "@/data/products";
import { FAMILIES } from "./cave";
import { C, f, pt, sector, ticks, wheelTurns } from "./wheelGeom";

const TICKS = ticks(15, 2, 168, 178, 190);
const STAR = (() => {
  const p = [0, 45, 90, 135, 180, 225, 270, 315].map((a, i) => pt(i % 2 === 0 ? 34 : 11, a));
  return "M" + p.map(([x, y]) => `${f(x)} ${f(y)}`).join("L") + "Z";
})();

interface Props {
  intention: string | null;
  taste: string | null;
  product: Product | null;
  caracs: { id: string }[];
}

const AromaSeal = ({ intention, taste, product, caracs }: Props) => {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const { lit, rotFam, rotCar } = wheelTurns(intention, taste, product, caracs.map((c) => c.id));
  const style = { "--rf": `${rotFam}deg`, "--rc": `${rotCar}deg` } as CSSProperties;
  const cls = ["sm-seal-w", intention ? "has-car" : "", taste ? "has-nez" : "", product ? "has-lot" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={cls} style={style} aria-hidden="true">
      <svg viewBox="0 0 400 400" focusable="false">
        <defs>
          <linearGradient id={`${uid}g`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#7D6936" />
            <stop offset=".3" stopColor="#F4DC92" />
            <stop offset=".55" stopColor="#B8913E" />
            <stop offset=".8" stopColor="#FBE7A6" />
            <stop offset="1" stopColor="#9C7A35" />
          </linearGradient>
        </defs>
        <circle className="sm-sw-hair" cx={C} cy={C} r={194} />
        <path className="sm-sw-tick" d={TICKS} />
        <g className="sm-sw-fam">
          {FAMILIES.map((fam, i) => {
            const d = sector(112, 162, i * 90 + 2, i * 90 + 88);
            return (
              <g key={fam.key} className={lit.includes(fam.key) ? "on" : undefined}>
                <path className="sm-sw-seg" d={d} />
                <path className="sm-sw-lit" d={d} fill={`url(#${uid}g)`} />
              </g>
            );
          })}
        </g>
        <g className="sm-sw-car">
          {caracs.map((c, i) => {
            const d = sector(62, 104, i * 90 - 43, i * 90 + 43);
            return (
              <g key={c.id} className={c.id === intention ? "on" : undefined}>
                <path className="sm-sw-seg" d={d} />
                <path className="sm-sw-lit" d={d} />
              </g>
            );
          })}
        </g>
        <path className="sm-sw-star" d={STAR} />
        <path className="sm-sw-needle" d="M184 0L216 0L200 40Z" />
      </svg>
    </span>
  );
};

export default AromaSeal;
