// « Le manifeste » (/societe) : paysage de nuit en perspective — route, deux lignes haute tension,
// ville au loin, la maison au point de fuite. Géométrie calculée une seule fois au chargement du module
// (viewBox 1200 × 1000 ; unités du monde en mètres). Purement décoratif.

export const VIEW_W = 1200;
export const VIEW_H = 1000;
export const H0 = 612; // ligne d'horizon
export const VX = 780; // point de fuite : la maison
const F = 700; // focale
const EYE = 2; // hauteur de l'œil

type Pt = [number, number];
const proj = (x: number, y: number, z: number): Pt => [VX + (F * x) / z, H0 + (F * (EYE - y)) / z];
const n = (v: number) => String(Math.round(v * 10) / 10);
const pt = (p: Pt) => `${n(p[0])} ${n(p[1])}`;

/* ---------- gabarit du pylône (hauteur 1, vu de face) ---------- */
const halfW = (v: number) => (v <= 0.6 ? 0.15 - (0.1 * v) / 0.6 : 0.05 - (0.018 * (v - 0.6)) / 0.38);
const LEVELS = [0, 0.12, 0.23, 0.33, 0.42, 0.5, 0.6, 0.7, 0.8, 0.9, 0.98];
const ARMS: Pt[] = [[0.66, 0.3], [0.8, 0.38], [0.92, 0.24]]; // [hauteur, portée] des consoles
const INS = 0.055; // chaîne d'isolateurs
const TOP = 1.06; // pointe (câble de garde)

type Seg = [number, number, number, number];
const FULL: Seg[] = [];
const LITE: Seg[] = [];
for (let i = 0; i < LEVELS.length - 1; i++) {
  const a = LEVELS[i], b = LEVELS[i + 1], wa = halfW(a), wb = halfW(b);
  for (const s of [-1, 1]) {
    FULL.push([s * wa, a, s * wb, b]);
    LITE.push([s * wa, a, s * wb, b]);
  }
  if (i > 0) FULL.push([-wa, a, wa, a]);
  FULL.push([-wa, a, wb, b], [wa, a, -wb, b]); // croisillons
}
const wTop = halfW(0.98);
for (const s of [-1, 1]) {
  FULL.push([s * wTop, 0.98, 0, TOP]);
  LITE.push([s * wTop, 0.98, 0, TOP]);
}
for (const [v, l] of ARMS) {
  for (const s of [-1, 1]) {
    const arm: Seg[] = [
      [s * halfW(v), v, s * l, v],
      [s * halfW(v - 0.05), v - 0.05, s * l, v],
      [s * l, v, s * l, v - INS],
    ];
    FULL.push(...arm);
    LITE.push(...arm);
  }
}

/** Points d'accroche : six phases (bas des isolateurs), puis le câble de garde. */
const ATTACH: Pt[] = [...ARMS.flatMap(([v, l]): Pt[] => [[-l, v - INS], [l, v - INS]]), [0, TOP]];

interface Line { key: "a" | "b"; x: number; h: number; z0: number; gap: number; count: number; lead: number; beacons: number }
const LINES: Line[] = [
  { key: "a", x: -16, h: 36, z0: 52, gap: 110, count: 14, lead: 9, beacons: 6 },
  { key: "b", x: 34, h: 30, z0: 125, gap: 135, count: 10, lead: 16, beacons: 4 },
];
const zsOf = (L: Line) => Array.from({ length: L.count }, (_, i) => L.z0 + i * L.gap);

export interface Pylon { d: string; o: number; z: number }
export interface Cable { d: string; line: "a" | "b"; pulse: boolean }

const pylon = (L: Line, z: number) => {
  const [bx, by] = proj(L.x, 0, z);
  const k = (F / z) * L.h; // pixels pour la hauteur du pylône
  const segs = k < 90 ? LITE : FULL; // au loin : silhouette seule
  const d = segs.map(([u1, v1, u2, v2]) => `M${pt([bx + u1 * k, by - v1 * k])}L${pt([bx + u2 * k, by - v2 * k])}`).join("");
  return { d, o: Math.max(0.3, Math.min(1, 1.15 - z / 1300)), z, top: [bx, by - TOP * k] as Pt };
};

const sagAt = (za: number, zb: number, z: number) => {
  const t = (z - za) / (zb - za);
  return 4 * 0.03 * (zb - za) * t * (1 - t); // flèche de la chaînette ≈ 3 % de la portée
};

const cable = (L: Line, [u, v]: Pt) => {
  const X = L.x + u * L.h, Y = v * L.h, zs = zsOf(L);
  // amorce : fin de la portée précédente, qui arrive de derrière le spectateur
  const za = zs[0] - L.gap, zb = zs[0];
  let d = "";
  for (let k = 0; k <= 12; k++) {
    const z = L.lead * Math.pow(zb / L.lead, k / 12);
    d += (k ? "L" : "M") + pt(proj(X, Y - sagAt(za, zb, z), z));
  }
  for (let i = 0; i < zs.length - 1; i++) {
    const a = proj(X, Y, zs[i]), b = proj(X, Y, zs[i + 1]), zm = (zs[i] + zs[i + 1]) / 2;
    const m = proj(X, Y - sagAt(zs[i], zs[i + 1], zm), zm);
    d += `Q${pt([2 * m[0] - (a[0] + b[0]) / 2, 2 * m[1] - (a[1] + b[1]) / 2])} ${pt(b)}`;
  }
  return d;
};

const built = LINES.map((L) => zsOf(L).map((z) => pylon(L, z)));

/** Pylônes du plus lointain au plus proche (les proches passent devant). */
export const PYLONS: Pylon[] = built.flat().sort((a, b) => b.z - a.z).map(({ d, o, z }) => ({ d, o, z }));
export const CABLES: Cable[] = LINES.flatMap((L) => ATTACH.map((a, j) => ({ d: cable(L, a), line: L.key, pulse: j < 6 })));
export const BEACONS: Pt[] = LINES.flatMap((L, i) => built[i].slice(0, L.beacons).map((p) => p.top));

/* ---------- sol : route, marquage, sillons ---------- */
const quad = (x1: number, x2: number, z1: number, z2: number) =>
  `M${pt(proj(x1, 0, z1))}L${pt(proj(x2, 0, z1))}L${pt(proj(x2, 0, z2))}L${pt(proj(x1, 0, z2))}Z`;
export const ROAD = quad(-6, 6, 3.2, 4000);
export const ROAD_EDGES = quad(-6.16, -5.96, 3.2, 4000) + quad(5.96, 6.16, 3.2, 4000);
let dash = "";
for (let z = 3.4; z < 420; z += 9) dash += quad(-0.12, 0.12, z, z + 3.6);
export const ROAD_DASH = dash;
export const FIELD = [-150, -95, -62, -38, 26, 58, 96, 150, 230]
  .map((x) => `M${pt(proj(x, 0, 3.4))}L${pt(proj(x, 0, 4000))}`)
  .join("");

/* ---------- ciel, collines, ville ---------- */
let seed = 11;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

let stars = "", starsBright = "";
for (let i = 0; i < 74; i++) {
  const x = rnd() * VIEW_W, y = 8 + Math.pow(rnd(), 1.35) * 540;
  const s = `M${n(x)} ${n(y)}h0`;
  if (rnd() < 0.18) starsBright += s;
  else stars += s;
}
export const STARS = stars;
export const STARS_BRIGHT = starsBright;

export const HILLS =
  `M-10 ${H0}L-10 597C80 588 160 601 240 594S400 585 470 598S600 605 668 ${H0 - 3}L668 ${H0}Z` +
  `M915 ${H0}C990 603 1070 594 1210 599L1210 ${H0}Z`;

let city = "", winDim = "", winOn = "";
for (let x = 646; x < 950; ) {
  const w = 7 + rnd() * 15, h = 4 + rnd() * (x > 730 && x < 840 ? 22 : 11);
  city += `M${n(x)} ${H0}V${n(H0 - h)}H${n(x + w)}V${H0}Z`;
  for (let wy = H0 - h + 2.4; wy < H0 - 2.2; wy += 4) {
    for (let wx = x + 1.8; wx < x + w - 2; wx += 3.6) {
      const r = rnd(), rect = `M${n(wx)} ${n(wy)}h1.5v1.9h-1.5Z`;
      if (r < 0.16) winDim += rect;
      else if (r < 0.52) winOn += rect;
    }
  }
  x += w + rnd() * 3;
}
export const CITY = city;
export const WINDOWS_DIM = winDim;
export const WINDOWS_ON = winOn;

/** Le carat de la maison, posé au point de fuite. */
export const CARAT = `M${VX} ${H0 - 17}L${VX + 2.4} ${H0 - 2.4}L${VX + 17} ${H0}L${VX + 2.4} ${H0 + 2.4}L${VX} ${H0 + 17}L${VX - 2.4} ${H0 + 2.4}L${VX - 17} ${H0}L${VX - 2.4} ${H0 - 2.4}Z`;
