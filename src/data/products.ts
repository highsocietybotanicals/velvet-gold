// Images pour les 7 produits - Style Haute Joaillerie
// Fleurs Premium
import blueMango from "@/assets/flowers/blue-mango-real.jpg";
import nineOneOne from "@/assets/flowers/911-og-real.jpg";
import mintKush from "@/assets/flowers/mint-kush-real.jpg";
import platinumOG from "@/assets/flowers/platinum-og-real.jpg";
import amnesiaOniria from "@/assets/flowers/amnesia-oniria-real.jpg";
import mangoXIce from "@/assets/flowers/mango-x-ice-real.jpg";

// Résines Premium
import iceOLator from "@/assets/resins/ice-o-lator-real.jpg";
import goldenCBN from "@/assets/resins/golden-cbn-real.jpg";
import nuageDeMousseux from "@/assets/resins/nuage-de-mousseux-real.jpg";
import hariboPremium from "@/assets/resins/haribo-premium.jpg";
import heisenbergPremium from "@/assets/resins/heisenberg-premium.jpg";
import poussiereDorPremium from "@/assets/resins/poussiere-dor-premium.jpg";

export type ProductCategory = "fleur" | "resine";
export type PriceGroup = "A" | "B";

export interface TerpeneProfile {
  boise: number;
  fruite: number;
  epice: number;
  terreux: number;
}

export interface Product {
  id: string;
  name: string;
  subtitle: string;
  badge: string;
  description: string;
  price: number; // Prix de base par gramme
  priceGroup: PriceGroup;
  cbdPercentage: string;
  image: string;
  terpenes: TerpeneProfile;
  mood: string;
  category: ProductCategory;
  intentionMatch: string[];
  tasteMatch: string[];
  isForceNoire?: boolean;
  isNectarDivin?: boolean;
  isExotique?: boolean;
}

// ============================================
// GROUPE A - Standard Luxury (Base 12€/g)
// ============================================

const groupA: Product[] = [
  {
    id: "amnesia-signature-oniria",
    name: 'Amnesia "Signature Oniria"',
    subtitle: "Sativa Dominant",
    badge: "Artiste Edition",
    description: "Fleur d'artiste par Oniria. Arômes d'agrumes et de terre, stimulante et énergisante.",
    price: 12,
    priceGroup: "A",
    cbdPercentage: "27%",
    image: amnesiaOniria,
    terpenes: { boise: 40, fruite: 85, epice: 50, terreux: 60 },
    mood: "Énergie",
    category: "fleur",
    intentionMatch: ["energie", "creativite"],
    tasteMatch: ["fruite"],
  },
  {
    id: "platinum-og",
    name: "Platinum OG",
    subtitle: "Indica Dominant",
    badge: "Cali Genetics",
    description: "Génétique Californienne Premium. Notes de pin, citron et bois précieux. Relaxation profonde.",
    price: 12,
    priceGroup: "A",
    cbdPercentage: "22%",
    image: platinumOG,
    terpenes: { boise: 90, fruite: 45, epice: 35, terreux: 80 },
    mood: "Relaxation",
    category: "fleur",
    intentionMatch: ["detente"],
    tasteMatch: ["boise"],
  },
  {
    id: "mint-kush",
    name: "Mint Kush",
    subtitle: "Indica Dominant",
    badge: "Cali Genetics",
    description: "Génétique Californienne Premium. Notes de menthe fraîche et d'épices douces.",
    price: 12,
    priceGroup: "A",
    cbdPercentage: "20%",
    image: mintKush,
    terpenes: { boise: 70, fruite: 40, epice: 75, terreux: 55 },
    mood: "Fraîcheur",
    category: "fleur",
    intentionMatch: ["detente", "sommeil"],
    tasteMatch: ["floral"],
  },
  {
    id: "ice-o-lator",
    name: "Ice O Lator",
    subtitle: "Ice-O-Lator Premium",
    badge: "60% Extraction",
    description: "Résine pure 60% CBD. Extraction à l'eau glacée, pureté maximale.",
    price: 12,
    priceGroup: "A",
    cbdPercentage: "60%",
    image: iceOLator,
    terpenes: { boise: 50, fruite: 70, epice: 45, terreux: 55 },
    mood: "Pureté",
    category: "resine",
    intentionMatch: ["energie"],
    tasteMatch: ["fruite"],
  },
  {
    id: "golden-cbn",
    name: "Golden CBN",
    subtitle: "Triple Cannabinoïdes",
    badge: "Royal Sleep",
    description: "25% CBD / 10% CBN / 10% CBG. Le combo ultime pour un sommeil royal.",
    price: 12,
    priceGroup: "A",
    cbdPercentage: "25% CBD / 10% CBN / 10% CBG",
    image: goldenCBN,
    terpenes: { boise: 60, fruite: 45, epice: 90, terreux: 70 },
    mood: "Sommeil",
    category: "resine",
    intentionMatch: ["sommeil"],
    tasteMatch: ["floral"],
  },
  {
    id: "nuage-de-mousseux",
    name: "Nuage de Mousseux",
    subtitle: "Élixir Noir Premium",
    badge: "Élixir Noir",
    description: "Résine mousseux infusée Élixir Noir 50%. Texture aérienne unique, détente profonde.",
    price: 13,
    priceGroup: "A",
    cbdPercentage: "50% Élixir Noir",
    image: nuageDeMousseux,
    terpenes: { boise: 80, fruite: 35, epice: 50, terreux: 85 },
    mood: "Détente",
    category: "resine",
    intentionMatch: ["detente", "sommeil"],
    tasteMatch: ["boise"],
    isForceNoire: true,
  },
];


// ============================================
// GROUPE B - Ultra Premium (Base 14€/g)
// ============================================

const groupB: Product[] = [
  {
    id: "911-og-indoor",
    name: '911 OG "Indoor Master"',
    subtitle: "Indoor Premium",
    badge: "Élixir Noir 50%",
    description: "Edition Limitée Indoor. La puissance à l'état pur avec 50% d'Élixir Noir.",
    price: 15,
    priceGroup: "B",
    cbdPercentage: "50% Élixir Noir",
    image: nineOneOne,
    terpenes: { boise: 85, fruite: 30, epice: 60, terreux: 90 },
    mood: "Puissance",
    category: "fleur",
    intentionMatch: ["detente", "sommeil"],
    tasteMatch: ["boise"],
    isForceNoire: true,
  },
  {
    id: "blue-mango-indoor",
    name: 'Blue Mango "Indoor Master"',
    subtitle: "Indoor Collection",
    badge: "Élixir Noir 30%",
    description: "Collection Rare Indoor. Arômes de mangue et notes tropicales uniques, enrichie à l'Élixir Noir.",
    price: 13,
    priceGroup: "B",
    cbdPercentage: "30% Élixir Noir",
    image: blueMango,
    terpenes: { boise: 35, fruite: 95, epice: 45, terreux: 40 },
    mood: "Tropical",
    category: "fleur",
    intentionMatch: ["creativite", "energie"],
    tasteMatch: ["fruite"],
    isForceNoire: true,
  },
];

// ============================================
// NECTAR DIVIN - Gamme ultra premium (Base 10€/g TTC)
// Puissance supérieure à l'Élixir Noir
// ============================================

const nectarDivin: Product[] = [
  {
    id: "haribo",
    name: "Haribo",
    subtitle: "Résine Nectar Divin",
    badge: "Nectar Divin",
    description: "Résine ultra-premium de la gamme Nectar Divin — puissance supérieure à l'Élixir Noir. Arômes gourmands de bonbon fruité, effets sédatifs profonds pour un sommeil royal.",
    price: 10,
    priceGroup: "B",
    cbdPercentage: "70% Nectar Divin",
    image: hariboPremium,
    terpenes: { boise: 55, fruite: 90, epice: 40, terreux: 70 },
    mood: "Sommeil royal",
    category: "resine",
    intentionMatch: ["sommeil", "detente"],
    tasteMatch: ["fruite"],
    isNectarDivin: true,
  },
  {
    id: "heisenberg",
    name: "Heisenberg",
    subtitle: "Résine Nectar Divin",
    badge: "Nectar Divin",
    description: "Résine ultra-premium de la gamme Nectar Divin — puissance supérieure à l'Élixir Noir. Cristaux bleutés d'exception, arômes mentholés et frais, effets cérébraux intenses et sédation profonde.",
    price: 10,
    priceGroup: "B",
    cbdPercentage: "70% Nectar Divin",
    image: heisenbergPremium,
    terpenes: { boise: 60, fruite: 50, epice: 70, terreux: 65 },
    mood: "Sommeil royal",
    category: "resine",
    intentionMatch: ["sommeil", "detente"],
    tasteMatch: ["epice", "boise"],
    isNectarDivin: true,
  },
  {

    id: "mango-x-ice",
    name: "Mango X Ice",
    subtitle: "Fleur Exotique",
    badge: "Exotique",
    description: "Fleur ultra-premium de la gamme Exotique — puissance supérieure à l'Élixir Noir. Bud dense givré de trichomes, arômes exotiques de mangue mûre relevés d'une fraîcheur glacée, effets enveloppants d'une rare intensité.",
    price: 17,
    priceGroup: "B",
    cbdPercentage: "70% Exotique",
    image: mangoXIce,
    terpenes: { boise: 45, fruite: 95, epice: 35, terreux: 55 },
    mood: "Évasion glacée",
    category: "fleur",
    intentionMatch: ["detente", "creativite"],
    tasteMatch: ["fruite"],
    isExotique: true,
  },
  {
    id: "poussiere-dor",
    name: "Poussière D'or",
    subtitle: "Résine Nectar Divin",
    badge: "Nectar Divin",
    description: "Pollen haute couture de la gamme Nectar Divin — texture mousse aérienne, robe blonde sablée. Arômes doux et boisés, effets équilibrés pour une détente raffinée d'exception.",
    price: 12,
    priceGroup: "A",
    cbdPercentage: "70% Nectar Divin",
    image: poussiereDorPremium,
    terpenes: { boise: 70, fruite: 30, epice: 45, terreux: 75 },
    mood: "Détente",
    category: "resine",
    intentionMatch: ["detente"],
    tasteMatch: ["boise", "terreux"],
    isNectarDivin: true,
  },
];


// ============================================
// Exports
// ============================================

// Fleurs uniquement (pour échantillons)
export const flowers: Product[] = [
  ...groupA.filter(p => p.category === "fleur"),
  ...groupB.filter(p => p.category === "fleur"),
];

// Résines uniquement
export const resins: Product[] = [
  ...nectarDivin.filter(p => p.category === "resine"),
  ...groupA.filter(p => p.category === "resine"),
  ...groupB.filter(p => p.category === "resine"),
];

// Tous les produits combinés
export const allProducts: Product[] = [...nectarDivin, ...groupA, ...groupB];

// Produits Force Noire (gamme haute puissance : Élixir Noir + Nectar Divin + Exotique)
export const forceNoireProducts: Product[] = allProducts.filter(p => p.isForceNoire || p.isNectarDivin || p.isExotique);

// Produits Nectar Divin (gamme ultra-premium)
export const nectarDivinProducts: Product[] = allProducts.filter(p => p.isNectarDivin);

// Produits vedettes pour la page d'accueil
export const featuredProducts: Product[] = [
  allProducts.find(p => p.id === "platinum-og")!,
  allProducts.find(p => p.id === "amnesia-signature-oniria")!,
  allProducts.find(p => p.id === "ice-o-lator")!,
  allProducts.find(p => p.id === "911-og-indoor")!,
];

// ============================================
// Matrice de recommandations Sommelier
// Adaptée aux 7 produits disponibles
// ============================================

export const recommendationMatrix: Record<string, Record<string, Product>> = {
  detente: {
    boise: allProducts.find(p => p.id === "platinum-og")!,
    fruite: allProducts.find(p => p.id === "blue-mango-indoor")!,
    floral: allProducts.find(p => p.id === "mint-kush")!,
  },
  creativite: {
    boise: allProducts.find(p => p.id === "911-og-indoor")!,
    fruite: allProducts.find(p => p.id === "amnesia-signature-oniria")!,
    floral: allProducts.find(p => p.id === "golden-cbn")!,
  },
  sommeil: {
    boise: allProducts.find(p => p.id === "911-og-indoor")!,
    fruite: allProducts.find(p => p.id === "ice-o-lator")!,
    floral: allProducts.find(p => p.id === "golden-cbn")!,
  },
  energie: {
    boise: allProducts.find(p => p.id === "platinum-og")!,
    fruite: allProducts.find(p => p.id === "amnesia-signature-oniria")!,
    floral: allProducts.find(p => p.id === "mint-kush")!,
  },
};

// Matrice de recommandations pour les résines (utilise les résines disponibles)
export const resinRecommendationMatrix: Record<string, Record<string, Product>> = {
  detente: {
    boise: allProducts.find(p => p.id === "nuage-de-mousseux")!,
    fruite: allProducts.find(p => p.id === "ice-o-lator")!,
    floral: allProducts.find(p => p.id === "golden-cbn")!,
  },
  creativite: {
    boise: allProducts.find(p => p.id === "ice-o-lator")!,
    fruite: allProducts.find(p => p.id === "ice-o-lator")!,
    floral: allProducts.find(p => p.id === "golden-cbn")!,
  },
  sommeil: {
    boise: allProducts.find(p => p.id === "nuage-de-mousseux")!,
    fruite: allProducts.find(p => p.id === "ice-o-lator")!,
    floral: allProducts.find(p => p.id === "golden-cbn")!,
  },
  energie: {
    boise: allProducts.find(p => p.id === "ice-o-lator")!,
    fruite: allProducts.find(p => p.id === "ice-o-lator")!,
    floral: allProducts.find(p => p.id === "golden-cbn")!,
  },
};
