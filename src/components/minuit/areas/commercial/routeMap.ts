// Espace commercial : géométrie de la carte de nuit (plaque de 1000 × 300 unités).
// Carte abstraite : aucun nom de ville, seule la maison d'Abbaretz (44) est nommée.
// Tout est calculé une fois au chargement du module (aucun calcul pendant l'animation).

export type Pt = readonly [number, number];

export const MAP_W = 1000;
export const MAP_H = 300;
/** La maison (Abbaretz, 44) : centre du réseau. */
export const HQ: Pt = [690, 150];

interface RouteDef { id: string; pts: Pt[]; from?: string; link?: boolean }

const ROUTE_DEFS: RouteDef[] = [
  { id: "r1", pts: [[690, 150], [750, 150], [810, 90], [900, 90], [930, 60]] },
  { id: "r2", pts: [[690, 150], [720, 180], [880, 180], [900, 200], [960, 200]] },
  { id: "r3", pts: [[690, 150], [690, 210], [755, 275], [840, 275]] },
  { id: "r4", pts: [[690, 150], [650, 190], [650, 230], [630, 250], [540, 250]] },
  { id: "r5", pts: [[690, 150], [610, 150], [570, 110], [440, 110]] },
  { id: "r6", pts: [[690, 150], [690, 95], [640, 45], [600, 45]] },
  { id: "r7", pts: [[440, 110], [400, 70], [170, 70]], from: "r5" },
  { id: "r8", pts: [[440, 110], [440, 160], [400, 200], [300, 200]], from: "r5" },
  { id: "r9", pts: [[300, 200], [260, 240], [80, 240]], from: "r8" },
  { id: "r10", pts: [[170, 70], [130, 30], [40, 30]], from: "r7" },
  { id: "l1", pts: [[930, 60], [960, 90], [960, 200]], from: "r1", link: true },
  { id: "l2", pts: [[840, 275], [920, 275], [960, 235], [960, 200]], from: "r3", link: true },
  { id: "l3", pts: [[600, 45], [480, 45], [440, 85], [440, 110]], from: "r6", link: true },
];

/** Vitesse du tracé (unités par seconde) et départ après l'apparition de la maison. */
const DRAW_SPEED = 380;
const DRAW_START = 0.55;

const len = (a: Pt, b: Pt) => Math.hypot(b[0] - a[0], b[1] - a[1]);
const angle = (a: Pt, b: Pt) => (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
const r2 = (n: number) => Math.round(n * 100) / 100;

export interface Seg { x1: number; y1: number; x2: number; y2: number; t: number; d: number; link: boolean }
export interface Dot { x: number; y: number; d: number }

const routeStart: Record<string, number> = {};
const routeEnd: Record<string, number> = {};
export const SEGS: Seg[] = [];
export const DOTS: Dot[] = [];

ROUTE_DEFS.forEach((r, i) => {
  const start = r.from ? routeEnd[r.from] ?? DRAW_START : DRAW_START + i * 0.08;
  routeStart[r.id] = start;
  let t = start;
  for (let k = 1; k < r.pts.length; k++) {
    const a = r.pts[k - 1], b = r.pts[k];
    const dur = len(a, b) / DRAW_SPEED;
    SEGS.push({ x1: a[0], y1: a[1], x2: b[0], y2: b[1], t: r2(dur), d: r2(t), link: !!r.link });
    t += dur;
  }
  routeEnd[r.id] = t;
  if (!r.link) {
    const last = r.pts[r.pts.length - 1];
    DOTS.push({ x: last[0], y: last[1], d: r2(t) });
  }
});

/** Fin du tracé complet (s) : les pulsations démarrent après. */
export const DRAW_END = r2(Math.max(...Object.values(routeEnd)));

export const ROUTES = ROUTE_DEFS.map((r) => ({
  id: r.id,
  link: !!r.link,
  points: r.pts.map((p) => p.join(",")).join(" "),
}));

/** Nœuds qui pulsent (relais du réseau). */
export const PULSES: Pt[] = [[930, 60], [840, 275], [440, 110], [600, 45], [170, 70]];

// ---------- fond cartographique : courbes de niveau abstraites ----------
const blob = (cx: number, cy: number, rx: number, ry: number, seed: number, n = 64) => {
  let d = "";
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * Math.PI * 2;
    const k = 1 + 0.12 * Math.sin(3 * t + seed) + 0.07 * Math.sin(5 * t + seed * 1.7);
    const x = cx + rx * k * Math.cos(t);
    const y = cy + ry * k * Math.sin(t);
    d += `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d + "Z";
};

export const TOPO: string[] = [
  ...[1, 2, 3, 4].map((i) => blob(300, 140, 42 * i, 24 * i, i * 0.6)),
  ...[1, 2, 3].map((i) => blob(860, 240, 32 * i, 18 * i, i)),
  ...[1, 2].map((i) => blob(560, 60, 52 * i, 20 * i, 2 + i)),
];

/** Repères de calage « + » et réticule autour de la maison. */
export const CROSS = [
  "M675 150H662M705 150H718M690 135V122M690 165V178",
  ...[[100, 100], [300, 50], [500, 200], [800, 40], [900, 260], [200, 270]].map(
    ([x, y]) => `M${x - 5} ${y}H${x + 5}M${x} ${y - 5}V${y + 5}`,
  ),
].join("");

export const RINGS = [60, 115, 175, 245];

export const COMPASS = { x: 880, y: 130, r: 13 };

// ---------- phares qui circulent depuis la maison ----------
const byId = (id: string) => ROUTE_DEFS.find((r) => r.id === id)!.pts;
const chain = (...parts: Pt[][]) => parts.reduce<Pt[]>((acc, p, i) => acc.concat(i ? p.slice(1) : p), []);

export const LIGHT_PATHS: Pt[][] = [
  chain(byId("r2"), [...byId("l1")].reverse()),
  chain(byId("r4")),
  chain(byId("r6"), byId("l3"), byId("r8"), byId("r9")),
];

const LIGHT_SPEED = 62; // unités par seconde : lent, nocturne
const LIGHT_PAUSE = 2600; // ms d'obscurité entre deux passages

/** Images clés (en pixels, pour une échelle s) d'un phare sur son trajet, avec la durée totale. */
export const lightFrames = (pts: Pt[], s: number) => {
  const segs: { a: number; l: number }[] = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const l = len(pts[i - 1], pts[i]);
    segs.push({ a: angle(pts[i - 1], pts[i]), l });
    total += l;
  }
  const travel = (total / LIGHT_SPEED) * 1000;
  const duration = travel + LIGHT_PAUSE;
  const f = travel / duration;
  const tf = (p: Pt, a: number) => `translate3d(${(p[0] * s).toFixed(1)}px, ${(p[1] * s).toFixed(1)}px, 0) rotate(${a.toFixed(1)}deg)`;
  const move: Keyframe[] = [];
  let acc = 0;
  segs.forEach((sg, i) => {
    move.push({ transform: tf(pts[i], sg.a), offset: (acc / total) * f });
    acc += sg.l;
    move.push({ transform: tf(pts[i + 1], sg.a), offset: (acc / total) * f });
  });
  move.push({ transform: tf(pts[pts.length - 1], segs[segs.length - 1].a), offset: 1 });
  const fade: Keyframe[] = [
    { opacity: 0, offset: 0 },
    { opacity: 1, offset: 0.05 * f },
    { opacity: 1, offset: 0.88 * f },
    { opacity: 0, offset: f },
    { opacity: 0, offset: 1 },
  ];
  return { move, fade, duration };
};

/** Boîte (en % de la plaque) d'un disque de rayon r centré sur la maison. */
export const hqDisc = (r: number) => ({
  left: `${((HQ[0] - r) / MAP_W) * 100}%`,
  top: `${((HQ[1] - r) / MAP_H) * 100}%`,
  width: `${((2 * r) / MAP_W) * 100}%`,
  height: `${((2 * r) / MAP_H) * 100}%`,
});

export const pct = (p: Pt) => ({ left: `${(p[0] / MAP_W) * 100}%`, top: `${(p[1] / MAP_H) * 100}%` });
