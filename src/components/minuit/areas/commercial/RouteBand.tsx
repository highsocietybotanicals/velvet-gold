// Espace commercial : bandeau « La feuille de route ».
// Carte de nuit abstraite (routes d'or qui se tracent, nœuds qui pulsent, balayage de radar,
// phares qui circulent depuis la maison d'Abbaretz). Purement décoratif : aucune donnée, aucune logique.
// Mouvement : transform et opacity seulement ; tout s'arrête hors écran (IntersectionObserver)
// et reste immobile avec « réduire les animations ».
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import emblemSvg from "@/assets/brand/hsb-emblem.svg?raw";
import { isLowEnd } from "@/components/minuit/minuitData";
import {
  COMPASS,
  CROSS,
  DOTS,
  DRAW_END,
  HQ,
  LIGHT_PATHS,
  MAP_H,
  MAP_W,
  PULSES,
  RINGS,
  ROUTES,
  SEGS,
  TOPO,
  hqDisc,
  lightFrames,
  pct,
} from "./routeMap";

/** Première arrivée de la session : le réseau se trace. Aux pages suivantes : une seule onde depuis la maison. */
let drawnOnce = false;

const prefersStill = () =>
  typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Téléphone modeste : pas de balayage, un seul phare, pulsations figées. */
const liteDevice = () =>
  typeof window !== "undefined" && !!window.matchMedia?.("(max-width: 899px)").matches && isLowEnd();

const vars = (o: Record<string, string | number>) => o as CSSProperties;

const { x: CX, y: CY, r: CR } = COMPASS;

const RouteBand = ({ children }: { children: ReactNode }) => {
  const bandRef = useRef<HTMLDivElement>(null);
  const plateRef = useRef<HTMLDivElement>(null);
  const lightRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [first] = useState(() => !drawnOnce);
  const [lite] = useState(liteDevice);
  const [off, setOff] = useState(false);

  useEffect(() => {
    drawnOnce = true;
  }, []);

  useEffect(() => {
    const band = bandRef.current;
    const plate = plateRef.current;
    if (!band || !plate) return;
    const still = prefersStill();
    const lights = lightRefs.current.filter(Boolean) as HTMLSpanElement[];
    let anims: Animation[] = [];
    let visible = true;
    let scaleKey = "";

    // Cadrage : la maison à droite du texte sur ordinateur, entre l'enseigne et le titre sur téléphone.
    const frame = () => {
      const W = band.clientWidth;
      const H = band.clientHeight;
      if (!W || !H) return;
      const desk = W >= 900;
      const s = desk ? Math.max(W / MAP_W, H / MAP_H) : Math.min(1.5, Math.max(1.05, W / 330));
      const P = MAP_W * s;
      const PH = MAP_H * s;
      let tx: number;
      let ty: number;
      if (desk) {
        const x = W >= 1200 ? W * 0.68 : W - 170;
        tx = Math.min(0, Math.max(W - P, x - HQ[0] * s));
        ty = Math.min(0, Math.max(H - PH, H * 0.48 - HQ[1] * s));
      } else {
        const neon = band.querySelector<HTMLElement>(".cm-neon");
        const nt = neon ? neon.getBoundingClientRect().top - band.getBoundingClientRect().top : H * 0.55;
        // Pages suivantes (bandeau compact, voir commercial.css) : la maison se pose à droite du néon.
        tx = Math.min(0, Math.max(W - P, W * (first ? 0.6 : 0.66) - HQ[0] * s));
        ty = (first ? Math.max(nt - 84, H * 0.26) : nt - 18) - HQ[1] * s;
      }
      plate.style.width = `${P.toFixed(1)}px`;
      plate.style.height = `${PH.toFixed(1)}px`;
      plate.style.transform = `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0)`;

      // Phares : trajectoires recalculées seulement quand l'échelle change.
      const key = s.toFixed(3);
      if (still || key === scaleKey) return;
      scaleKey = key;
      anims.forEach((a) => a.cancel());
      anims = [];
      lights.forEach((el, i) => {
        if (typeof el.animate !== "function") return;
        const { move, fade, duration } = lightFrames(LIGHT_PATHS[i % LIGHT_PATHS.length], s);
        const delay = (first ? DRAW_END * 1000 : 700) + i * 2300;
        const opts: KeyframeAnimationOptions = { duration, delay, iterations: Infinity, easing: "linear" };
        anims.push(el.animate(move, opts), el.animate(fade, opts));
      });
      if (!visible) anims.forEach((a) => a.pause());
    };

    let io: IntersectionObserver | undefined;
    if (typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver(
        ([e]) => {
          visible = e.isIntersecting;
          setOff(!visible);
          anims.forEach((a) => (visible ? a.play() : a.pause()));
        },
        { rootMargin: "40px 0px" },
      );
      io.observe(band);
    }

    let ro: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => frame());
      ro.observe(band);
    } else {
      window.addEventListener("resize", frame);
    }
    frame();

    return () => {
      io?.disconnect();
      ro?.disconnect();
      window.removeEventListener("resize", frame);
      anims.forEach((a) => a.cancel());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bandCls = ["cm-band", first && "is-first", off && "is-off"].filter(Boolean).join(" ");
  const mapCls = ["cm-map", first ? "is-drawing" : "is-ping", lite && "cm-lite"].filter(Boolean).join(" ");
  const lightCount = lite ? 1 : LIGHT_PATHS.length;
  const pulseStart = first ? DRAW_END : 0;

  return (
    <div ref={bandRef} className={bandCls}>
      <div className={mapCls} aria-hidden="true">
        <div ref={plateRef} className="cm-plate">
          <span className="cm-sweep" style={hqDisc(RINGS[RINGS.length - 1])} />
          <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} focusable="false">
            <defs>
              <linearGradient id="cm-route-or" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={MAP_W} y2={MAP_H}>
                <stop offset="0" stopColor="#7D6936" />
                <stop offset=".22" stopColor="#E9C977" />
                <stop offset=".42" stopColor="#B8913E" />
                <stop offset=".62" stopColor="#FBE7A6" />
                <stop offset=".8" stopColor="#C9A24A" />
                <stop offset="1" stopColor="#F4DC92" />
              </linearGradient>
            </defs>
            <g className="cm-topo">
              {TOPO.map((d, i) => (
                <path key={i} d={d} />
              ))}
            </g>
            <g className="cm-rings">
              {RINGS.map((r) => (
                <circle key={r} cx={HQ[0]} cy={HQ[1]} r={r} />
              ))}
            </g>
            <g className="cm-cross">
              <path d={CROSS} />
            </g>
            <g className="cm-base cm-base-halo">
              {ROUTES.map((r) => (
                <polyline key={r.id} points={r.points} className={r.link ? "is-link" : undefined} />
              ))}
            </g>
            <g className="cm-base cm-base-thin">
              {ROUTES.map((r) => (
                <polyline key={r.id} points={r.points} />
              ))}
            </g>
            <g className="cm-lit" stroke="url(#cm-route-or)">
              {SEGS.map((sg, i) => (
                <line
                  key={i}
                  x1={sg.x1}
                  y1={sg.y1}
                  x2={sg.x2}
                  y2={sg.y2}
                  className={sg.link ? "is-link" : undefined}
                  style={vars({ "--t": `${sg.t}s`, "--d": `${sg.d}s`, transformOrigin: `${sg.x1}px ${sg.y1}px` })}
                />
              ))}
            </g>
            <g className="cm-dots">
              {DOTS.map((d, i) => (
                <circle key={i} cx={d.x} cy={d.y} r="2.6" style={vars({ "--d": `${d.d}s` })} />
              ))}
            </g>
            <g className="cm-compass">
              <circle cx={CX} cy={CY} r={CR} />
              <path d={`M${CX} ${CY - CR + 2}L${CX + 3.5} ${CY}H${CX - 3.5}Z`} />
              <path d={`M${CX} ${CY + CR - 2}L${CX + 3.5} ${CY}H${CX - 3.5}Z`} opacity=".35" />
              <text x={CX} y={CY - CR - 5} textAnchor="middle">
                N
              </text>
            </g>
          </svg>

          {PULSES.map((p, i) => (
            <span key={i} className="cm-node" style={{ ...pct(p), ...vars({ "--pd": `${(pulseStart + i * 0.7).toFixed(2)}s` }) }} />
          ))}
          <span className="cm-node cm-node--hq" style={{ ...pct(HQ), ...vars({ "--pd": `${first ? 0.9 : 0}s` }) }} />
          {!first && <span className="cm-ping" style={hqDisc(200)} />}

          <div className="cm-hq" style={pct(HQ)}>
            <span className="cm-hq-emb" dangerouslySetInnerHTML={{ __html: emblemSvg }} />
            <span className="cm-hq-l">
              <b>Abbaretz</b> · 44
            </span>
          </div>

          {Array.from({ length: lightCount }, (_, i) => (
            <span
              key={i}
              className="cm-light"
              ref={(el) => {
                lightRefs.current[i] = el;
              }}
            >
              <i />
            </span>
          ))}
        </div>
      </div>
      <div className="cm-band-in">{children}</div>
    </div>
  );
};

export default RouteBand;
