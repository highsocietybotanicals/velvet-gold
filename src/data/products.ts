// Fleurs
import amnesiaHaze from "@/assets/flowers/amnesia-haze.jpg";
import ogKush from "@/assets/flowers/og-kush.jpg";
import whiteWidow from "@/assets/flowers/white-widow.jpg";
import gorillaGlue from "@/assets/flowers/gorilla-glue.jpg";
import strawberryKush from "@/assets/flowers/strawberry-kush.jpg";
import lemonHaze from "@/assets/flowers/lemon-haze.jpg";
import purpleHaze from "@/assets/flowers/purple-haze.jpg";
import blueDream from "@/assets/flowers/blue-dream.jpg";
import northernLights from "@/assets/flowers/northern-lights.jpg";
import jackHerer from "@/assets/flowers/jack-herer.jpg";
import sourDiesel from "@/assets/flowers/sour-diesel.jpg";
import girlScoutCookies from "@/assets/flowers/girl-scout-cookies.jpg";
import gelato from "@/assets/flowers/gelato.jpg";
import weddingCake from "@/assets/flowers/wedding-cake.jpg";
import zkittlez from "@/assets/flowers/zkittlez.jpg";
import pineappleExpress from "@/assets/flowers/pineapple-express.jpg";
import cheese from "@/assets/flowers/cheese.jpg";
import critical from "@/assets/flowers/critical.jpg";
import ak47 from "@/assets/flowers/ak-47.jpg";
import bubbaKush from "@/assets/flowers/bubba-kush.jpg";

// Résines
import afghanHash from "@/assets/resins/afghan-hash.jpg";
import moroccanHash from "@/assets/resins/moroccan-hash.jpg";
import lebaneseHash from "@/assets/resins/lebanese-hash.jpg";
import charas from "@/assets/resins/charas.jpg";
import bubbleHash from "@/assets/resins/bubble-hash.jpg";
import liveRosin from "@/assets/resins/live-rosin.jpg";
import moonrocks from "@/assets/resins/moonrocks.jpg";
import nepalTempleBall from "@/assets/resins/nepal-temple-ball.jpg";
import drySift from "@/assets/resins/dry-sift.jpg";
import rosinPress from "@/assets/resins/rosin-press.jpg";

export type ProductCategory = "fleur" | "resine";

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
  description: string;
  price: number;
  cbdPercentage: string;
  image: string;
  terpenes: TerpeneProfile;
  mood: string;
  category: ProductCategory;
  intentionMatch: string[];
  tasteMatch: string[];
}

// 20 Fleurs CBD - Vraies variétés connues
export const flowers: Product[] = [
  {
    id: "amnesia-haze",
    name: "Amnesia Haze",
    subtitle: "Sativa Dominant",
    description: "La légendaire Amnesia aux arômes d'agrumes et de terre, stimulante et énergisante.",
    price: 12,
    cbdPercentage: "18%",
    image: amnesiaHaze,
    terpenes: { boise: 40, fruite: 85, epice: 50, terreux: 60 },
    mood: "Énergie",
    category: "fleur",
    intentionMatch: ["energie"],
    tasteMatch: ["fruite"],
  },
  {
    id: "og-kush",
    name: "OG Kush",
    subtitle: "Indica Dominant",
    description: "L'iconique OG Kush aux notes de pin, citron et bois précieux. Relaxation profonde.",
    price: 14,
    cbdPercentage: "22%",
    image: ogKush,
    terpenes: { boise: 90, fruite: 45, epice: 35, terreux: 80 },
    mood: "Relaxation",
    category: "fleur",
    intentionMatch: ["detente"],
    tasteMatch: ["boise"],
  },
  {
    id: "white-widow",
    name: "White Widow",
    subtitle: "Hybride Équilibré",
    description: "La Veuve Blanche aux cristaux scintillants, notes de pin et d'épices douces.",
    price: 13,
    cbdPercentage: "20%",
    image: whiteWidow,
    terpenes: { boise: 70, fruite: 40, epice: 75, terreux: 55 },
    mood: "Équilibre",
    category: "fleur",
    intentionMatch: ["energie"],
    tasteMatch: ["floral"],
  },
  {
    id: "gorilla-glue",
    name: "Gorilla Glue",
    subtitle: "Indica Dominant",
    description: "La puissante Gorilla Glue aux arômes de diesel, pin et chocolat. Effet puissant.",
    price: 15,
    cbdPercentage: "24%",
    image: gorillaGlue,
    terpenes: { boise: 85, fruite: 30, epice: 60, terreux: 90 },
    mood: "Puissance",
    category: "fleur",
    intentionMatch: ["sommeil"],
    tasteMatch: ["boise"],
  },
  {
    id: "strawberry-kush",
    name: "Strawberry Kush",
    subtitle: "Indica Dominant",
    description: "La douce Strawberry aux notes de fraise fraîche et de terre. Relaxation fruitée.",
    price: 14,
    cbdPercentage: "19%",
    image: strawberryKush,
    terpenes: { boise: 35, fruite: 95, epice: 25, terreux: 45 },
    mood: "Douceur",
    category: "fleur",
    intentionMatch: ["detente"],
    tasteMatch: ["fruite"],
  },
  {
    id: "lemon-haze",
    name: "Lemon Haze",
    subtitle: "Sativa Dominant",
    description: "L'explosive Lemon Haze aux arômes intenses de citron et de zeste frais.",
    price: 13,
    cbdPercentage: "21%",
    image: lemonHaze,
    terpenes: { boise: 30, fruite: 95, epice: 40, terreux: 35 },
    mood: "Vitalité",
    category: "fleur",
    intentionMatch: ["energie"],
    tasteMatch: ["fruite"],
  },
  {
    id: "purple-haze",
    name: "Purple Haze",
    subtitle: "Sativa Dominant",
    description: "La mythique Purple Haze aux teintes violettes, notes de baies et d'épices.",
    price: 16,
    cbdPercentage: "23%",
    image: purpleHaze,
    terpenes: { boise: 40, fruite: 75, epice: 70, terreux: 45 },
    mood: "Créativité",
    category: "fleur",
    intentionMatch: ["creativite"],
    tasteMatch: ["fruite"],
  },
  {
    id: "blue-dream",
    name: "Blue Dream",
    subtitle: "Hybride Sativa",
    description: "Le rêve bleu aux arômes de myrtille et de vanille. Euphorie douce et créative.",
    price: 15,
    cbdPercentage: "22%",
    image: blueDream,
    terpenes: { boise: 35, fruite: 90, epice: 45, terreux: 40 },
    mood: "Rêverie",
    category: "fleur",
    intentionMatch: ["sommeil"],
    tasteMatch: ["fruite"],
  },
  {
    id: "northern-lights",
    name: "Northern Lights",
    subtitle: "Indica Pure",
    description: "L'Aurore Boréale légendaire, notes de pin et d'épices. Sommeil profond garanti.",
    price: 14,
    cbdPercentage: "20%",
    image: northernLights,
    terpenes: { boise: 75, fruite: 35, epice: 65, terreux: 80 },
    mood: "Sommeil",
    category: "fleur",
    intentionMatch: ["sommeil"],
    tasteMatch: ["floral"],
  },
  {
    id: "jack-herer",
    name: "Jack Herer",
    subtitle: "Sativa Dominant",
    description: "Hommage au légendaire activiste, notes de pin, épices et citron. Clarté mentale.",
    price: 15,
    cbdPercentage: "21%",
    image: jackHerer,
    terpenes: { boise: 80, fruite: 50, epice: 70, terreux: 60 },
    mood: "Focus",
    category: "fleur",
    intentionMatch: ["energie"],
    tasteMatch: ["boise"],
  },
  {
    id: "sour-diesel",
    name: "Sour Diesel",
    subtitle: "Sativa Dominant",
    description: "Le Diesel acide aux arômes pétroliers et citronnés. Énergie brute et focus.",
    price: 14,
    cbdPercentage: "20%",
    image: sourDiesel,
    terpenes: { boise: 60, fruite: 65, epice: 55, terreux: 70 },
    mood: "Énergie",
    category: "fleur",
    intentionMatch: ["energie"],
    tasteMatch: ["boise"],
  },
  {
    id: "girl-scout-cookies",
    name: "Girl Scout Cookies",
    subtitle: "Hybride Équilibré",
    description: "La célèbre GSC aux notes de menthe, chocolat et terre. Euphorie gourmande.",
    price: 16,
    cbdPercentage: "24%",
    image: girlScoutCookies,
    terpenes: { boise: 55, fruite: 70, epice: 75, terreux: 60 },
    mood: "Euphorie",
    category: "fleur",
    intentionMatch: ["creativite"],
    tasteMatch: ["floral"],
  },
  {
    id: "gelato",
    name: "Gelato",
    subtitle: "Hybride Indica",
    description: "Le Gelato italien aux notes de crème glacée, baies et agrumes. Détente sucrée.",
    price: 17,
    cbdPercentage: "25%",
    image: gelato,
    terpenes: { boise: 30, fruite: 95, epice: 50, terreux: 35 },
    mood: "Gourmandise",
    category: "fleur",
    intentionMatch: ["detente"],
    tasteMatch: ["fruite"],
  },
  {
    id: "wedding-cake",
    name: "Wedding Cake",
    subtitle: "Indica Dominant",
    description: "Le Gâteau de Mariage aux notes de vanille et de poivre. Célébration relaxante.",
    price: 18,
    cbdPercentage: "26%",
    image: weddingCake,
    terpenes: { boise: 45, fruite: 60, epice: 80, terreux: 50 },
    mood: "Célébration",
    category: "fleur",
    intentionMatch: ["detente"],
    tasteMatch: ["floral"],
  },
  {
    id: "zkittlez",
    name: "Zkittlez",
    subtitle: "Indica Dominant",
    description: "L'arc-en-ciel de saveurs aux notes de bonbons fruités. Explosion de douceur.",
    price: 15,
    cbdPercentage: "22%",
    image: zkittlez,
    terpenes: { boise: 20, fruite: 100, epice: 30, terreux: 25 },
    mood: "Joie",
    category: "fleur",
    intentionMatch: ["creativite"],
    tasteMatch: ["fruite"],
  },
  {
    id: "pineapple-express",
    name: "Pineapple Express",
    subtitle: "Hybride Sativa",
    description: "L'Express Ananas aux arômes tropicaux intenses. Énergie et bonne humeur.",
    price: 14,
    cbdPercentage: "21%",
    image: pineappleExpress,
    terpenes: { boise: 25, fruite: 95, epice: 35, terreux: 30 },
    mood: "Tropical",
    category: "fleur",
    intentionMatch: ["energie"],
    tasteMatch: ["fruite"],
  },
  {
    id: "cheese",
    name: "Cheese",
    subtitle: "Indica Dominant",
    description: "Le Fromage britannique aux arômes uniques et piquants. Relaxation intense.",
    price: 12,
    cbdPercentage: "18%",
    image: cheese,
    terpenes: { boise: 70, fruite: 35, epice: 85, terreux: 75 },
    mood: "Unique",
    category: "fleur",
    intentionMatch: ["sommeil"],
    tasteMatch: ["floral"],
  },
  {
    id: "critical",
    name: "Critical",
    subtitle: "Indica Dominant",
    description: "La Critical massive aux notes terreuses et sucrées. Rendement et puissance.",
    price: 11,
    cbdPercentage: "17%",
    image: critical,
    terpenes: { boise: 65, fruite: 50, epice: 45, terreux: 85 },
    mood: "Relaxation",
    category: "fleur",
    intentionMatch: ["sommeil"],
    tasteMatch: ["boise"],
  },
  {
    id: "ak-47",
    name: "AK-47",
    subtitle: "Hybride Sativa",
    description: "L'AK-47 primée aux arômes complexes de terre, bois et notes florales.",
    price: 13,
    cbdPercentage: "19%",
    image: ak47,
    terpenes: { boise: 75, fruite: 40, epice: 60, terreux: 70 },
    mood: "Focus",
    category: "fleur",
    intentionMatch: ["creativite"],
    tasteMatch: ["boise"],
  },
  {
    id: "bubba-kush",
    name: "Bubba Kush",
    subtitle: "Indica Pure",
    description: "Le Bubba Kush aux notes de café, chocolat et hashish. Détente ultime.",
    price: 15,
    cbdPercentage: "23%",
    image: bubbaKush,
    terpenes: { boise: 85, fruite: 25, epice: 55, terreux: 95 },
    mood: "Détente",
    category: "fleur",
    intentionMatch: ["detente"],
    tasteMatch: ["boise"],
  },
];

// 10 Résines / Hash / Extractions - Vraies variétés connues
export const resins: Product[] = [
  {
    id: "afghan-hash",
    name: "Afghan Hash",
    subtitle: "Hash Traditionnel",
    description: "Le hash afghan authentique, pressé à la main. Notes de terre et d'épices orientales.",
    price: 20,
    cbdPercentage: "35%",
    image: afghanHash,
    terpenes: { boise: 70, fruite: 30, epice: 85, terreux: 90 },
    mood: "Tradition",
    category: "resine",
    intentionMatch: ["detente"],
    tasteMatch: ["boise"],
  },
  {
    id: "moroccan-hash",
    name: "Moroccan Hash",
    subtitle: "Hash Ketama",
    description: "Le célèbre hash marocain de Ketama. Arômes de pin et notes épicées.",
    price: 18,
    cbdPercentage: "32%",
    image: moroccanHash,
    terpenes: { boise: 65, fruite: 35, epice: 80, terreux: 75 },
    mood: "Voyage",
    category: "resine",
    intentionMatch: ["detente"],
    tasteMatch: ["floral"],
  },
  {
    id: "lebanese-hash",
    name: "Lebanese Hash",
    subtitle: "Hash Rouge/Blonde",
    description: "Le hash libanais légendaire aux notes de cèdre et d'encens. Méditation profonde.",
    price: 22,
    cbdPercentage: "38%",
    image: lebaneseHash,
    terpenes: { boise: 80, fruite: 25, epice: 70, terreux: 85 },
    mood: "Spiritualité",
    category: "resine",
    intentionMatch: ["sommeil"],
    tasteMatch: ["boise"],
  },
  {
    id: "charas",
    name: "Charas",
    subtitle: "Hash Himalayen",
    description: "Le charas roulé à la main des montagnes himalayennes. Notes de santal et miel.",
    price: 28,
    cbdPercentage: "42%",
    image: charas,
    terpenes: { boise: 60, fruite: 45, epice: 90, terreux: 70 },
    mood: "Méditation",
    category: "resine",
    intentionMatch: ["creativite"],
    tasteMatch: ["floral"],
  },
  {
    id: "bubble-hash",
    name: "Bubble Hash",
    subtitle: "Ice-O-Lator",
    description: "Extraction à l'eau glacée, pureté maximale. Notes fraîches et terpènes préservés.",
    price: 35,
    cbdPercentage: "55%",
    image: bubbleHash,
    terpenes: { boise: 50, fruite: 70, epice: 45, terreux: 55 },
    mood: "Pureté",
    category: "resine",
    intentionMatch: ["energie"],
    tasteMatch: ["fruite"],
  },
  {
    id: "live-rosin",
    name: "Live Rosin",
    subtitle: "Extraction Sans Solvant",
    description: "Rosin pressée à partir de fleurs fraîches. Profil terpénique intact et puissant.",
    price: 45,
    cbdPercentage: "65%",
    image: liveRosin,
    terpenes: { boise: 55, fruite: 85, epice: 50, terreux: 45 },
    mood: "Excellence",
    category: "resine",
    intentionMatch: ["creativite"],
    tasteMatch: ["fruite"],
  },
  {
    id: "moonrocks",
    name: "Moonrocks",
    subtitle: "Triple Concentration",
    description: "Fleur trempée dans l'huile et roulée dans le kief. Puissance lunaire garantie.",
    price: 40,
    cbdPercentage: "70%",
    image: moonrocks,
    terpenes: { boise: 65, fruite: 60, epice: 70, terreux: 75 },
    mood: "Puissance",
    category: "resine",
    intentionMatch: ["sommeil"],
    tasteMatch: ["floral"],
  },
  {
    id: "nepal-temple-ball",
    name: "Nepal Temple Ball",
    subtitle: "Hash Cérémoniel",
    description: "Les boules de temple népalaises, vieillies et curées. Arômes de cuir et d'épices.",
    price: 32,
    cbdPercentage: "48%",
    image: nepalTempleBall,
    terpenes: { boise: 75, fruite: 30, epice: 95, terreux: 80 },
    mood: "Cérémonie",
    category: "resine",
    intentionMatch: ["energie"],
    tasteMatch: ["floral"],
  },
  {
    id: "dry-sift",
    name: "Dry Sift",
    subtitle: "Kief Premium",
    description: "Tamisage à sec de la plus haute qualité. Cristaux purs aux notes florales.",
    price: 25,
    cbdPercentage: "45%",
    image: drySift,
    terpenes: { boise: 45, fruite: 55, epice: 60, terreux: 50 },
    mood: "Finesse",
    category: "resine",
    intentionMatch: ["energie"],
    tasteMatch: ["boise"],
  },
  {
    id: "rosin-press",
    name: "Rosin Press",
    subtitle: "Extraction Artisanale",
    description: "Rosin pressée à chaud sans solvant. Notes de miel et de fruits tropicaux.",
    price: 38,
    cbdPercentage: "58%",
    image: rosinPress,
    terpenes: { boise: 35, fruite: 90, epice: 40, terreux: 45 },
    mood: "Artisanat",
    category: "resine",
    intentionMatch: ["sommeil"],
    tasteMatch: ["fruite"],
  },
];

// Tous les produits combinés
export const allProducts: Product[] = [...flowers, ...resins];

// Produits vedettes pour la page d'accueil
export const featuredProducts: Product[] = [
  flowers.find(p => p.id === "og-kush")!,
  flowers.find(p => p.id === "amnesia-haze")!,
  resins.find(p => p.id === "afghan-hash")!,
  flowers.find(p => p.id === "gelato")!,
];

// Matrice de recommandations unique pour chaque combinaison (Fleurs)
export const recommendationMatrix: Record<string, Record<string, Product>> = {
  detente: {
    boise: flowers.find(p => p.id === "og-kush")!,
    fruite: flowers.find(p => p.id === "strawberry-kush")!,
    floral: flowers.find(p => p.id === "wedding-cake")!,
  },
  creativite: {
    boise: flowers.find(p => p.id === "ak-47")!,
    fruite: flowers.find(p => p.id === "purple-haze")!,
    floral: flowers.find(p => p.id === "girl-scout-cookies")!,
  },
  sommeil: {
    boise: flowers.find(p => p.id === "gorilla-glue")!,
    fruite: flowers.find(p => p.id === "blue-dream")!,
    floral: flowers.find(p => p.id === "northern-lights")!,
  },
  energie: {
    boise: flowers.find(p => p.id === "jack-herer")!,
    fruite: flowers.find(p => p.id === "lemon-haze")!,
    floral: flowers.find(p => p.id === "white-widow")!,
  },
};

// Matrice de recommandations pour les résines
export const resinRecommendationMatrix: Record<string, Record<string, Product>> = {
  detente: {
    boise: resins.find(p => p.id === "afghan-hash")!,
    fruite: resins.find(p => p.id === "rosin-press")!,
    floral: resins.find(p => p.id === "moroccan-hash")!,
  },
  creativite: {
    boise: resins.find(p => p.id === "dry-sift")!,
    fruite: resins.find(p => p.id === "live-rosin")!,
    floral: resins.find(p => p.id === "charas")!,
  },
  sommeil: {
    boise: resins.find(p => p.id === "lebanese-hash")!,
    fruite: resins.find(p => p.id === "rosin-press")!,
    floral: resins.find(p => p.id === "moonrocks")!,
  },
  energie: {
    boise: resins.find(p => p.id === "dry-sift")!,
    fruite: resins.find(p => p.id === "bubble-hash")!,
    floral: resins.find(p => p.id === "nepal-temple-ball")!,
  },
};
