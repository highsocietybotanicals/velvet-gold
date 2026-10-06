// Géométrie commune de la roue des arômes et de son sceau (viewBox 400 × 400, angles en degrés,
// sens horaire depuis midi). Purement visuel : lit les réponses déjà choisies, ne décide de rien.
import type { Product } from "@/data/products";
import { FAMILIES, TASTE_FAMS, type FamKey } from "./cave";

export const C = 200; // centre du viewBox 400 × 400
export const f = (n: number) => n.toFixed(2);

export const pt = (r: number, deg: number): [number, number] => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [C + r * Math.cos(a), C + r * Math.sin(a)];
};

/** Secteur d'anneau entre deux angles. */
export const sector = (r0: number, r1: number, a0: number, a1: number) => {
  const [x0, y0] = pt(r1, a0);
  const [x1, y1] = pt(r1, a1);
  const [x2, y2] = pt(r0, a1);
  const [x3, y3] = pt(r0, a0);
  return `M${f(x0)} ${f(y0)}A${r1} ${r1} 0 0 1 ${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}A${r0} ${r0} 0 0 0 ${f(x3)} ${f(y3)}Z`;
};

/** Arc support d'un texte gravé (lecture dans le sens horaire). */
export const arc = (r: number, a0: number, a1: number) => {
  const [x0, y0] = pt(r, a0);
  const [x1, y1] = pt(r, a1);
  return `M${f(x0)} ${f(y0)}A${r} ${r} 0 0 1 ${f(x1)} ${f(y1)}`;
};

export const circlePath = (r: number) => `M${C} ${C - r}A${r} ${r} 0 1 1 ${C} ${C + r}A${r} ${r} 0 1 1 ${C} ${C - r}`;

/** Traits de graduation : un tous les `step` degrés, un trait long tous les `every` traits. */
export const ticks = (step: number, every: number, rLong: number, rShort: number, rOut: number) =>
  Array.from({ length: Math.round(360 / step) }, (_, i) => {
    const a = i * step;
    const [x0, y0] = pt(i % every === 0 ? rLong : rShort, a);
    const [x1, y1] = pt(rOut, a);
    return `M${f(x0)} ${f(y0)}L${f(x1)} ${f(y1)}`;
  }).join("");

/** Ramène un angle dans ]-180, 180]. */
const norm = (a: number) => ((((a % 360) + 540) % 360) - 180) || 0;

/**
 * Position de la roue selon les réponses : la famille retenue vient sous l'aiguille,
 * un tour complet à chaque service ; l'anneau intérieur amène le caractère choisi à midi.
 */
export const wheelTurns = (
  intention: string | null,
  taste: string | null,
  product: Product | null,
  caracIds: string[]
): { lit: FamKey[]; rotFam: number; rotCar: number } => {
  const lit = taste ? TASTE_FAMS[taste] ?? [] : [];
  const centers = FAMILIES.map((fam, i) => (lit.includes(fam.key) ? i * 90 + 45 : null)).filter(
    (x): x is number => x !== null
  );
  const tasteRot = centers.length ? norm(-centers.reduce((s, x) => s + x, 0) / centers.length) : 0;
  const rotFam = tasteRot - (intention ? 360 : 0) - (product ? 360 : 0);
  const ci = intention ? caracIds.indexOf(intention) : -1;
  const rotCar = ci >= 0 ? norm(-ci * 90) + 360 : 0;
  return { lit, rotFam, rotCar };
};
