// Roue des arômes de la cave : graduations et anneaux dorés, familles = clés des terpènes du site
// (boisé, terreux, épicé, fruité). Purement visuelle (aria-hidden) : elle lit les réponses déjà choisies,
// tourne pour amener la famille retenue sous l'aiguille et allume les segments correspondants.
// Rotations en transform CSS sur des calques HTML (composités), aucune boucle JS.
import { useId, type CSSProperties } from "react";
import type { Product } from "@/data/products";
import emblemSvg from "@/assets/brand/hsb-emblem.svg?raw";
import { FAMILIES } from "./cave";
import { C, arc, circlePath, f, pt, sector, ticks, wheelTurns } from "./wheelGeom";

// graduations : un trait tous les 5°, un trait long tous les 30°
const TICKS = ticks(5, 6, 185, 191, 197);

const ENGRAVING = "LA CAVE DU SOMMELIER ✦ COLLECTION N° 26 ✦ HIGH SOCIETY BOTANICALS ✦ ";

// lettrage extrait de l'emblème vectoriel (fill="currentColor")
const EMB_VIEWBOX = /viewBox="([^"]+)"/.exec(emblemSvg)?.[1] ?? "0 0 3300 3400";
const EMB_INNER = emblemSvg.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");

interface Props {
  /** identifiant de l'intention choisie (ou null) */
  intention: string | null;
  /** identifiant du goût choisi (ou null) */
  taste: string | null;
  /** lot recommandé, seulement une fois la carte complète */
  product: Product | null;
  /** libellés de l'anneau intérieur, dans l'ordre de la carte */
  caracs: { id: string; label: string }[];
}

const AromaWheel = ({ intention, taste, product, caracs }: Props) => {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  // la famille retenue vient se placer sous l'aiguille ; un tour complet à chaque service
  const { lit, rotFam, rotCar } = wheelTurns(intention, taste, product, caracs.map((c) => c.id));

  const poly = product
    ? FAMILIES.map((fam, i) => {
        const v = Math.max(0, Math.min(100, Number(product.terpenes?.[fam.key]) || 0));
        return pt(10 + (56 * v) / 100, i * 90 + 45);
      })
    : [];

  const style = { "--rf": `${rotFam}deg`, "--rc": `${rotCar}deg` } as CSSProperties;
  const cls = ["sm-wheel", intention ? "has-car" : "", taste ? "has-nez" : "", product ? "has-lot" : ""].filter(Boolean).join(" ");

  return (
    <div className={cls} style={style} aria-hidden="true">
      <span className="sm-w-halo" />

      {/* graduations et gravure (rotation lente, seulement quand la cave est à l'écran) */}
      <div className="sm-w-layer sm-w-ticks">
        <svg viewBox="0 0 400 400" focusable="false">
          <defs>
            <path id={`${uid}ring`} d={circlePath(176)} />
          </defs>
          <circle className="sm-w-hair" cx={C} cy={C} r={198} />
          <circle className="sm-w-hair" cx={C} cy={C} r={170} />
          <path className="sm-w-tick" d={TICKS} />
          <text className="sm-w-engr">
            <textPath href={`#${uid}ring`} textLength={1088} lengthAdjust="spacing">
              {ENGRAVING + ENGRAVING}
            </textPath>
          </text>
        </svg>
      </div>

      {/* familles aromatiques et notes (tourne vers la réponse) */}
      <div className="sm-w-layer sm-w-fam">
        <svg viewBox="0 0 400 400" focusable="false">
          <defs>
            <linearGradient id={`${uid}gold`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#7D6936" />
              <stop offset=".3" stopColor="#F4DC92" />
              <stop offset=".55" stopColor="#B8913E" />
              <stop offset=".8" stopColor="#FBE7A6" />
              <stop offset="1" stopColor="#9C7A35" />
            </linearGradient>
            <radialGradient id={`${uid}poly`} cx=".5" cy=".5" r=".5">
              <stop offset="0" stopColor="#F4DC92" stopOpacity=".55" />
              <stop offset="1" stopColor="#C9A24A" stopOpacity=".12" />
            </radialGradient>
            {FAMILIES.map((fam, i) => (
              <path key={fam.key} id={`${uid}f${i}`} d={arc(146, i * 90 + 4, i * 90 + 86)} />
            ))}
            {FAMILIES.map((fam, i) =>
              fam.notes.map((_, j) => (
                <path key={`${fam.key}${j}`} id={`${uid}n${i}${j}`} d={arc(114, i * 90 + j * 30 + 1, i * 90 + j * 30 + 29)} />
              ))
            )}
          </defs>

          {FAMILIES.map((fam, i) => {
            const on = lit.includes(fam.key);
            const d = sector(134, 166, i * 90 + 0.8, i * 90 + 89.2);
            return (
              <g key={fam.key} className={`sm-fam${on ? " on" : ""}`}>
                <path className="sm-seg" d={d} />
                <path className="sm-seg-lit" d={d} fill={`url(#${uid}gold)`} />
                <text className="sm-fam-l">
                  <textPath href={`#${uid}f${i}`} startOffset="50%" textAnchor="middle">
                    {fam.label.toUpperCase()}
                  </textPath>
                </text>
                {fam.notes.map((n, j) => (
                  <g key={n}>
                    <path className="sm-sub" d={sector(104, 131, i * 90 + j * 30 + 0.8, i * 90 + j * 30 + 29.2)} />
                    <text className="sm-sub-l">
                      <textPath href={`#${uid}n${i}${j}`} startOffset="50%" textAnchor="middle">
                        {n}
                      </textPath>
                    </text>
                  </g>
                ))}
              </g>
            );
          })}
          <circle className="sm-w-hair" cx={C} cy={C} r={166} />
          <circle className="sm-w-hair" cx={C} cy={C} r={134} />
          <circle className="sm-w-hair dim" cx={C} cy={C} r={104} />

          {/* profil aromatique du lot recommandé (données du site) */}
          <g className="sm-poly">
            {[22, 44, 66].map((r) => (
              <circle key={r} className="sm-poly-grid" cx={C} cy={C} r={r} />
            ))}
            {FAMILIES.map((fam, i) => {
              const [x, y] = pt(66, i * 90 + 45);
              return <line key={fam.key} className="sm-poly-grid" x1={C} y1={C} x2={f(x)} y2={f(y)} />;
            })}
            {poly.length > 0 && (
              <>
                <polygon className="sm-poly-shape" points={poly.map(([x, y]) => `${f(x)},${f(y)}`).join(" ")} fill={`url(#${uid}poly)`} />
                {poly.map(([x, y], i) => (
                  <circle key={i} className="sm-poly-dot" cx={f(x)} cy={f(y)} r={3.2} />
                ))}
              </>
            )}
          </g>
        </svg>
      </div>

      {/* anneau intérieur : le caractère choisi au premier service */}
      <div className="sm-w-layer sm-w-car">
        <svg viewBox="0 0 400 400" focusable="false">
          <defs>
            {caracs.map((c, i) => (
              <path key={c.id} id={`${uid}c${i}`} d={arc(81, i * 90 - 42, i * 90 + 42)} />
            ))}
          </defs>
          {caracs.map((c, i) => {
            const d = sector(70, 100, i * 90 - 44.2, i * 90 + 44.2);
            return (
              <g key={c.id} className={`sm-car${c.id === intention ? " on" : ""}`}>
                <path className="sm-seg" d={d} />
                <path className="sm-seg-lit" d={d} />
                <text className="sm-car-l">
                  <textPath href={`#${uid}c${i}`} startOffset="50%" textAnchor="middle">
                    {c.label.toUpperCase()}
                  </textPath>
                </text>
              </g>
            );
          })}
          <circle className="sm-w-hair" cx={C} cy={C} r={100} />
          <circle className="sm-w-hair dim" cx={C} cy={C} r={70} />
        </svg>
      </div>

      {/* cœur : l'emblème de la maison, qui s'efface devant le profil du lot */}
      <span className="sm-w-core">
        <svg viewBox={EMB_VIEWBOX} focusable="false" dangerouslySetInnerHTML={{ __html: EMB_INNER }} />
      </span>

      {/* aiguille fixe à midi */}
      <svg className="sm-w-needle" viewBox="0 0 24 40" focusable="false">
        <path d="M12 0L12 24" />
        <path className="tip" d="M5 22L12 38L19 22L12 27Z" />
      </svg>

      {/* bougies de part et d'autre */}
      <span className="sm-candle l"><i className="wax" /><i className="flame" /><i className="glow" /></span>
      <span className="sm-candle r"><i className="wax" /><i className="flame" /><i className="glow" /></span>
    </div>
  );
};

export default AromaWheel;
