// Textes et petits formats d'affichage de la cave du Sommelier.
// Arômes, textures, méthode uniquement : aucune allégation d'effet, aucun prix en dur, aucun chiffre inventé.
import type { Product } from "@/data/products";
import { LOT_ORDER, edito, typeLabel } from "@/components/minuit/minuitData";

export const ROMAN = ["I", "II", "III", "IV"];

/** Les trois services de la carte (indicateur d'étape). */
export const SERVICES = ["Le caractère", "Le nez", "Le lot"];

/** Familles de la roue des arômes = clés des terpènes du site, dans l'ordre horaire depuis midi. */
export type FamKey = "boise" | "terreux" | "epice" | "fruite";
export const FAMILIES: { key: FamKey; label: string; notes: [string, string, string] }[] = [
  { key: "boise", label: "Boisé", notes: ["Cèdre", "Pin", "Santal"] },
  { key: "terreux", label: "Terreux", notes: ["Sous-bois", "Mousse", "Tourbe"] },
  { key: "epice", label: "Épicé", notes: ["Poivre", "Lavande", "Herbes"] },
  { key: "fruite", label: "Fruité", notes: ["Agrumes", "Mangue", "Baies"] },
];

/** Familles allumées par chaque nez de la carte (identifiants du questionnaire, inchangés). */
export const TASTE_FAMS: Record<string, FamKey[]> = {
  boise: ["boise", "terreux"],
  fruite: ["fruite"],
  floral: ["epice"],
};

/** Petit « accord » gravé à droite de chaque ligne de la carte. */
export const ACCORDS: Record<string, string> = {
  detente: "Rond",
  creativite: "Vif",
  sommeil: "Profond",
  energie: "Net",
  boise: "Cèdre · Mousse",
  fruite: "Baies · Agrumes",
  floral: "Lavande · Poivre",
};

/** « Lot n° 01 · Cali Genetics · Fleur » (numéro de la collection quand le lot y figure). */
export const lotTag = (p: Product) => {
  const i = LOT_ORDER.indexOf(p.id);
  return [
    i >= 0 ? `Lot n° ${String(i + 1).padStart(2, "0")}` : null,
    p.isNectarDivin ? "Nectar Divin" : edito(p).gamme,
    typeLabel(p),
  ]
    .filter(Boolean)
    .join(" · ");
};

/** Numéro gravé derrière le lot : son numéro dans la collection, sinon null (aucun numéro inventé). */
export const lotNumber = (p: Product): string | null => {
  const i = LOT_ORDER.indexOf(p.id);
  return i >= 0 ? String(i + 1).padStart(2, "0") : null;
};

/** Teneur telle que la base la donne, même présentation que la fiche produit. */
export const teneur = (p: Product) => {
  const c = p.cbdPercentage || "";
  return p.isForceNoire || p.isNectarDivin || p.isExotique || c.includes("CBD") ? c : `${c} CBD`;
};

/** Lecture qualitative d'une famille du profil aromatique (donnée existante du lot). */
export const presence = (v: number) => (v >= 80 ? "Marqué" : v >= 60 ? "Présent" : v >= 40 ? "Discret" : "Léger");

export const CAVE_TRUST = [
  "Maison française d'Abbaretz (44)",
  "Sélection à la main",
  "THC < 0,3 %",
  "Analyse laboratoire sur demande",
  "Expédition discrète 48 h",
  "Main propre autour du 44",
  "Réservé aux majeurs",
];
