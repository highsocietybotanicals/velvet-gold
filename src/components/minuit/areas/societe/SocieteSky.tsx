import { memo } from "react";
import {
  BEACONS, CABLES, CARAT, CITY, FIELD, H0, HILLS, PYLONS, ROAD, ROAD_DASH, ROAD_EDGES,
  STARS, STARS_BRIGHT, VIEW_H, VIEW_W, VX, WINDOWS_DIM, WINDOWS_ON,
} from "./skyGeometry";

const VIEWBOX = `0 0 ${VIEW_W} ${VIEW_H}`;

/** Câbles parcourus par une impulsion. Un sur deux par ligne est marqué data-alt (masqué sur appareil modeste). */
const PULSES = (() => {
  const seen: Record<string, number> = {};
  return CABLES.filter((c) => c.pulse).map((c) => {
    const k = (seen[c.line] = (seen[c.line] ?? -1) + 1);
    return { d: c.d, line: c.line, alt: k % 2 === 1 };
  });
})();

/**
 * Paysage de nuit du manifeste : il reste collé derrière la lecture (position sticky).
 * Deux SVG superposés, même viewBox et même cadrage :
 *  1. .so-sky-still : tout le décor fixe (dégradés, masque, ville, route, pylônes, fils), peint une fois ;
 *  2. .so-sky-live : calque à part, aplats seulement, sans defs : les impulsions dorées (.so-pulse)
 *     que useManifesto déplace au défilement, puis les balises et le carat qui se dessinaient déjà au-dessus.
 *     Seul ce petit calque est repeint à chaque image de défilement.
 * Décor pur : aria-hidden, aucun élément interactif.
 */
const SocieteSky = memo(() => (
  <div className="so-sky" aria-hidden="true">
    <div className="so-sky-pin">
      <svg className="so-sky-still" viewBox={VIEWBOX} preserveAspectRatio="xMidYMid slice" focusable="false">
        <defs>
          <linearGradient id="so-g-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#040306" />
            <stop offset=".62" stopColor="#0B0910" />
            <stop offset=".9" stopColor="#17110C" />
            <stop offset="1" stopColor="#2A1E0E" />
          </linearGradient>
          <linearGradient id="so-g-ground" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#120E0B" />
            <stop offset=".35" stopColor="#09070A" />
            <stop offset="1" stopColor="#060508" />
          </linearGradient>
          <radialGradient id="so-g-glow">
            <stop offset="0" stopColor="#F4DC92" stopOpacity=".55" />
            <stop offset=".35" stopColor="#C9A24A" stopOpacity=".16" />
            <stop offset="1" stopColor="#C9A24A" stopOpacity="0" />
          </radialGradient>
          <mask id="so-m-moon">
            <rect width={VIEW_W} height={VIEW_H} fill="#000" />
            <circle cx="1046" cy="168" r="26" fill="#fff" />
            <circle cx="1057" cy="160" r="24" fill="#000" />
          </mask>
        </defs>

        <rect width={VIEW_W} height={H0} fill="url(#so-g-sky)" />
        <rect y={H0} width={VIEW_W} height={VIEW_H - H0} fill="url(#so-g-ground)" />
        <path className="so-stars" d={STARS} />
        <path className="so-stars so-stars-b" d={STARS_BRIGHT} />
        <rect className="so-moon" width={VIEW_W} height={VIEW_H} mask="url(#so-m-moon)" />

        <ellipse className="so-glow" cx={VX} cy={H0} rx="560" ry="96" fill="url(#so-g-glow)" />
        <ellipse className="so-glow so-glow-on" cx={VX} cy={H0} rx="420" ry="70" fill="url(#so-g-glow)" />
        <path className="so-hills" d={HILLS} />
        <path className="so-city" d={CITY} />
        <path className="so-win" d={WINDOWS_DIM} />
        <path className="so-win so-win-on" d={WINDOWS_ON} />

        <path className="so-field" d={FIELD} />
        <path className="so-road" d={ROAD} />
        <path className="so-road-edge" d={ROAD_EDGES} />
        <path className="so-road-dash" d={ROAD_DASH} />

        <g className="so-pylons">
          {PYLONS.map((p, i) => <path key={i} d={p.d} strokeOpacity={p.o} />)}
        </g>
        <g className="so-wires">
          {CABLES.map((c, i) => <path key={i} className={`so-wire so-line-${c.line}`} d={c.d} />)}
        </g>
      </svg>

      <svg className="so-sky-live" viewBox={VIEWBOX} preserveAspectRatio="xMidYMid slice" focusable="false">
        <g className="so-cables">
          {PULSES.map((c, i) => (
            <g key={i} className={`so-cable so-line-${c.line}`} data-alt={c.alt ? "" : undefined}>
              <path className="so-pulse so-halo" d={c.d} />
              <path className="so-pulse so-core" d={c.d} />
            </g>
          ))}
        </g>
        <g className="so-beacons">
          {BEACONS.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="2.4" style={{ animationDelay: `${(i * 0.37).toFixed(2)}s` }} />
          ))}
        </g>
        <path className="so-carat" d={CARAT} />
      </svg>
    </div>
  </div>
));
SocieteSky.displayName = "SocieteSky";

export default SocieteSky;
