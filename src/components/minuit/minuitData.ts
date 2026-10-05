// Données éditoriales de l'accueil « Minuit Carat » (textes sans allégation d'effet, ordre des lots, médias).
// Les prix ne sont jamais recopiés ici : ils viennent de la base via useCatalogProducts + calculatePrice.
import type { Product } from "@/data/products";
import { calculatePrice } from "@/lib/pricing";
import cutBhm from "@/assets/cutouts/bhm.webp";
import cutLemon from "@/assets/cutouts/lemon-punch-hash.webp";
import cutMango from "@/assets/cutouts/mango-x-ice.webp";
import cutPlatinum from "@/assets/cutouts/platinum-og.webp";
import heroFlowers from "@/assets/hero-flowers-resin.jpg";
import platinumPhoto from "@/assets/flowers/platinum-og-real.jpg";
import amnesiaPhoto from "@/assets/flowers/amnesia-oniria-real.jpg";
import mangoPhoto from "@/assets/flowers/mango-x-ice-real.jpg";
import pochonPhoto from "@/assets/accessories/pochon-grand.jpg";

/** Dossier public des visuels de la maquette (bucket social-media). Tant qu'un fichier n'y est pas, le repli s'affiche. */
export const MEDIA = "https://pvwwxpcosiqetsflykmp.supabase.co/storage/v1/object/public/social-media/site-minuit/";

const CUT_FILE: Record<string, string> = {
  "platinum-og": "cut-platinum-og.webp",
  "amnesia-signature-oniria": "cut-amnesia.webp",
  "mint-kush": "cut-mint-kush.webp",
  "ice-o-lator": "cut-ice-o-lator.webp",
  "golden-cbn": "cut-golden-cbn.webp",
  "blue-mango-indoor": "cut-blue-mango.webp",
  "lemon-punch-hash": "cut-lemon-punch-hash.webp",
  piatella: "cut-piatella.webp",
  "bubble-hash-maturer": "cut-bhm.webp",
  "mango-x-ice": "cut-mango-x-ice.webp",
};
const LOCAL_CUT: Record<string, string> = {
  "platinum-og": cutPlatinum,
  "bubble-hash-maturer": cutBhm,
  "lemon-punch-hash": cutLemon,
  "mango-x-ice": cutMango,
};

/** Détourage du lot : visuel du bucket, sinon détourage du code, sinon photo produit (sur fond noir). */
export const cutSources = (p: Product): string[] =>
  [CUT_FILE[p.id] && MEDIA + CUT_FILE[p.id], LOCAL_CUT[p.id], p.image].filter(Boolean) as string[];

// Repli = vraies photos produits du code, tant que les visuels ne sont pas déposés dans le bucket.
export const AMBIANCE = {
  givree: [MEDIA + "tete-givree-blanche.webp", platinumPhoto],
  trichomes: [MEDIA + "trichomes-violets.webp", amnesiaPhoto],
  duo: [MEDIA + "duo-socle.webp", heroFlowers],
  violette: [MEDIA + "tete-violette.webp", mangoPhoto],
  pochonFace: MEDIA + "pochon-face.webp",
  pochonDos: MEDIA + "pochon-dos.webp",
  pochonPhoto,
};

/** Ordre du boulevard : Platinum OG ouvre (porte d'entrée), Mango X Ice ferme (grand final). */
export const LOT_ORDER = [
  "platinum-og", "amnesia-signature-oniria", "mint-kush", "ice-o-lator", "golden-cbn",
  "blue-mango-indoor", "lemon-punch-hash", "piatella", "bubble-hash-maturer", "mango-x-ice",
];
export const HERO_LOTS = ["platinum-og", "bubble-hash-maturer", "mango-x-ice"];

interface Edito { gamme: string; notes: string; mol: string; tags: string[]; short?: string; vedette?: string }
export const EDITO: Record<string, Edito> = {
  "platinum-og": { gamme: "Cali Genetics", notes: "Pin, citron, bois précieux. Génétique californienne.", mol: "22 % CBD", tags: ["boise"], vedette: "Lot vedette" },
  "amnesia-signature-oniria": { gamme: "Artiste", short: "Amnesia Oniria", notes: "Agrumes et terre. Édition d'artiste signée Oniria.", mol: "27 % CBD", tags: ["fruite"] },
  "mint-kush": { gamme: "Cali Genetics", notes: "Menthe fraîche, épices douces. Génétique californienne.", mol: "20 % CBD", tags: ["frais"] },
  "ice-o-lator": { gamme: "Classique", notes: "Extraction à l'eau glacée. Notes fruitées, grande pureté.", mol: "60 % CBD", tags: ["fruite"] },
  "golden-cbn": { gamme: "Classique", notes: "Trois cannabinoïdes réunis. Notes épicées et boisées.", mol: "CBD 25 · CBN 10 · CBG 10", tags: ["gourmand"] },
  "blue-mango-indoor": { gamme: "Force Noire", short: "Blue Mango", notes: "Mangue et notes tropicales. Culture indoor.", mol: "Élixir Noir 50 %", tags: ["fruite"] },
  "lemon-punch-hash": { gamme: "Force Noire", notes: "Robe claire, texture sèche, poudreuse et friable.", mol: "HE 12 %", tags: ["frais"] },
  piatella: { gamme: "Force Noire", notes: "Texture fondante d'une rare intensité, arômes gourmands.", mol: "CBDX 70 %", tags: ["gourmand"] },
  "bubble-hash-maturer": { gamme: "Exotique", notes: "Bubble Hash Maturer : teinte crème, texture compacte.", mol: "HE 24 %", tags: ["gourmand"] },
  "mango-x-ice": { gamme: "Exotique", notes: "Mangue mûre, fraîcheur glacée, bud dense givré.", mol: "HE+ 12 %", tags: ["fruite"], vedette: "Lot n° 10 · Grand final" },
};

export const edito = (p: Product): Edito =>
  EDITO[p.id] ?? { gamme: p.isExotique ? "Exotique" : p.isForceNoire ? "Force Noire" : p.badge || "Classique", notes: p.subtitle, mol: p.cbdPercentage, tags: [] };
export const shortName = (p: Product) => EDITO[p.id]?.short ?? p.name;
export const typeLabel = (p: Product) => (p.category === "fleur" ? "Fleur" : "Résine");

/** Prix exact du site (même fonction que la fiche produit et le panier). */
export const priceOf = (p: Product, w: number) => Number(calculatePrice(p.price, w, p.priceGroup || "A", p.id).finalPrice);

export const WEIGHTS = [1, 2.5, 5, 10, 25, 50, 100];

export const eur = (n: number) => {
  const r = Math.round(n * 100) / 100;
  return (Number.isInteger(r) ? r.toLocaleString("fr-FR") : r.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })) + " €";
};
export const gfmt = (w: number) => String(w).replace(".", ",") + " g";

export const BAND = ["Analyse labo sur chaque fiche", "THC < 0,3 %", "Expédition discrète 48 h", "Main propre autour du 44", "Kit et échantillon offerts dès 10 g", "Paiement sécurisé", "Réservé aux majeurs"];
