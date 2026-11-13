// Centralized pricing logic for weight-based discounts and gifts
import type { PriceGroup } from "@/data/products";

export interface WeightTier {
  min: number;
  max: number;
  discount: number;
  label: string;
}

export interface PriceInfo {
  rawPrice: string;
  finalPrice: string;
  discount: number;
  discountLabel: string;
  savings: string;
}

export interface GiftContents {
  feuillesSlim: number;
  briquetBIC: number;
}

export interface GiftInfo {
  type: "kit" | "pack";
  count: number;
  label: string;
  contents: GiftContents;
}

export interface AccessoryPriceInfo {
  rawTotal: number;
  finalTotal: number;
  discount: number;
  discountLabel: string | null;
}

// ============================================
// GROUPE A - CBD Classiques (Base 12€/g)
// Grille du 13/11/2026 (base 12 €/g) : 1 g = 12 €, 2,5 g = 24,90 €, 5 g = 45 €,
// 10 g = 65 € (6,50 €/g), 25 g = 150 € (6 €/g), 50 g = 275 € (5,50 €/g), 100 g = 500 € (5 €/g).
// Mêmes valeurs, écrites de la même façon, dans supabase/functions/create-viva-payment/index.ts
// et supabase/functions/_shared/proOffer.ts : toujours changer les trois ensemble.
// ============================================
export const WEIGHT_TIERS_A: WeightTier[] = [
  { min: 0, max: 2.49, discount: 0, label: "0%" },
  { min: 2.5, max: 4.99, discount: 0.17, label: "-17%" },
  { min: 5, max: 9.99, discount: 0.25, label: "-25%" },
  { min: 10, max: 24.99, discount: 1 - 6.5 / 12, label: "-46%" },
  { min: 25, max: 49.99, discount: 0.50, label: "-50%" },
  { min: 50, max: 99.99, discount: 1 - 5.5 / 12, label: "-54%" },
  { min: 100, max: Infinity, discount: 1 - 5 / 12, label: "-58%" },
];

// ============================================
// GROUPE B / Élixir Noir - grille par produit (cas par cas)
// Conservé pour compat / dégressif au-delà de 10g
// ============================================
export const WEIGHT_TIERS_B: WeightTier[] = [
  { min: 0, max: 2.49, discount: 0, label: "0%" },
  { min: 2.5, max: 4.99, discount: 0.07, label: "-7%" },
  { min: 5, max: 9.99, discount: 0.13, label: "-13%" },
  { min: 10, max: 24.99, discount: 0.35, label: "-35%" },
  { min: 25, max: 49.99, discount: 0.40, label: "-40%" },
  { min: 50, max: 99.99, discount: 0.45, label: "-45%" },
  { min: 100, max: Infinity, discount: 0.50, label: "-50%" },
];

// Ratio par produit et par palier pour l'Élixir Noir / Nectar Divin.
// Le prix final au palier = basePrice (prix DB du 1 g) × weight × ratio.
// Modifier le prix 1 g dans l'admin met à jour automatiquement TOUS les paliers.
export const FORCE_NOIRE_RATIOS: Record<string, Record<number, number>> = {
  "lemon-punch-hash":  { 1: 1.0, 2.5: 0.9333, 5: 0.8,    10: 0.6667 },
  "bubble-hash-maturer": { 1: 1.0, 2.5: 0.9333, 5: 0.8,  10: 0.6667 },
  "911-og-indoor":     { 1: 1.0, 2.5: 0.9333, 5: 0.8667, 10: 0.6 },
  "blue-mango-indoor": { 1: 1.0, 2.5: 0.9231, 5: 0.8462, 10: 0.6154 },
  "haribo":            { 1: 1.0, 2.5: 0.9333, 5: 0.8,    10: 0.6667 },
  "heisenberg":        { 1: 1.0, 2.5: 0.9333, 5: 0.8,    10: 0.6667 },
  "mango-x-ice":       { 1: 1.0, 2.5: 0.9333, 5: 0.8,    10: 0.6667 },
  "poussiere-dor":     { 1: 1.0, 2.5: 0.9333, 5: 0.8333, 10: 0.625 },
  "piatella":          { 1: 1.0, 2.5: 0.9333, 5: 0.8,    10: 0.6667 },
};

export const hasForceNoireGrid = (productId?: string): boolean =>
  !!productId && !!FORCE_NOIRE_RATIOS[productId];

// Calcule le prix total d'un produit Force Noire à partir du basePrice DB (1 g) et du poids.
// Pour un poids exact du palier : basePrice × weight × ratio.
// Pour un poids intermédiaire : interpolation linéaire entre les deux paliers encadrants.
// Au-delà de 10 g : on utilise le €/g du palier 10 g + dégressif additionnel.
export const calculateForceNoirePrice = (
  productId: string,
  weight: number,
  basePrice: number,
): number | null => {
  const ratios = FORCE_NOIRE_RATIOS[productId];
  if (!ratios || !weight || weight <= 0 || !basePrice || basePrice <= 0) return null;

  const tiers = Object.keys(ratios)
    .map((k) => parseFloat(k))
    .sort((a, b) => a - b);

  const priceAt = (w: number) => basePrice * w * ratios[w];

  // Match exact
  if (ratios[weight] !== undefined) return priceAt(weight);

  const maxTier = tiers[tiers.length - 1];

  if (weight < maxTier) {
    // Interpolation entre paliers
    let lower = tiers[0];
    let upper = maxTier;
    for (let i = 0; i < tiers.length - 1; i++) {
      if (weight >= tiers[i] && weight <= tiers[i + 1]) {
        lower = tiers[i];
        upper = tiers[i + 1];
        break;
      }
    }
    const ratio = (weight - lower) / (upper - lower);
    return priceAt(lower) + (priceAt(upper) - priceAt(lower)) * ratio;
  }

  // Au-delà du plus haut palier : €/g du palier max + dégressif
  const pricePerGramMax = priceAt(maxTier) / maxTier;
  let extraDiscount = 0;
  if (weight >= 100) extraDiscount = 0.20;
  else if (weight >= 50) extraDiscount = 0.15;
  else if (weight >= 25) extraDiscount = 0.10;

  return weight * pricePerGramMax * (1 - extraDiscount);
};


// Ancien système pour compatibilité (utilise Groupe A par défaut)
export const WEIGHT_TIERS: WeightTier[] = WEIGHT_TIERS_A;

// Retourne le prix au gramme le plus bas atteignable pour un produit (palier 100g)
export const getLowestPricePerGram = (
  basePrice: number,
  priceGroup: PriceGroup = "A",
  productId?: string
): number => {
  if (hasForceNoireGrid(productId)) {
    const total = calculateForceNoirePrice(productId!, 100, basePrice);
    if (total && total > 0) return total / 100;
  }

  const tiers = priceGroup === "B" ? WEIGHT_TIERS_B : WEIGHT_TIERS_A;
  const best = tiers[tiers.length - 1];
  return basePrice * (1 - best.discount);
};

export const PRESET_WEIGHTS = [1, 2.5, 10, 25, 50, 100];

// Accessory bulk discount threshold
export const ACCESSORY_BULK_THRESHOLD = 10;
export const ACCESSORY_BULK_DISCOUNT = 0.33;

export const getDiscountTier = (weight: number, priceGroup: PriceGroup = "A"): WeightTier => {
  const tiers = priceGroup === "B" ? WEIGHT_TIERS_B : WEIGHT_TIERS_A;
  return tiers.find(tier => weight >= tier.min && weight <= tier.max) || tiers[0];
};

export const calculatePrice = (basePrice: number, weight: number, priceGroup: PriceGroup = "A", productId?: string): PriceInfo => {
  // Handle invalid weights
  if (!weight || weight <= 0 || isNaN(weight)) {
    return {
      rawPrice: "0.00",
      finalPrice: "0.00",
      discount: 0,
      discountLabel: "0%",
      savings: "0.00",
    };
  }

  // Force Noire : grille fixe par produit
  if (hasForceNoireGrid(productId)) {
    const finalPrice = calculateForceNoirePrice(productId!, weight, basePrice) ?? 0;
    const rawPrice = basePrice * weight;
    const discount = rawPrice > 0 ? 1 - finalPrice / rawPrice : 0;
    return {
      rawPrice: rawPrice.toFixed(2),
      finalPrice: finalPrice.toFixed(2),
      discount,
      discountLabel: discount > 0.005 ? `-${Math.round(discount * 100)}%` : "0%",
      savings: (rawPrice - finalPrice).toFixed(2),
    };
  }


  const tier = getDiscountTier(weight, priceGroup);
  const rawPrice = basePrice * weight;
  const discountedPrice = rawPrice * (1 - tier.discount);

  return {
    rawPrice: rawPrice.toFixed(2),
    finalPrice: discountedPrice.toFixed(2),
    discount: tier.discount,
    discountLabel: tier.label,
    savings: (rawPrice - discountedPrice).toFixed(2),
  };
};

// Returns raw numbers for cart calculations
export const calculateItemPrice = (basePrice: number, weight: number, priceGroup: PriceGroup = "A", productId?: string) => {
  if (!weight || weight <= 0 || isNaN(weight)) {
    return { rawPrice: 0, finalPrice: 0, discount: 0 };
  }

  // Force Noire : grille dynamique par produit
  if (hasForceNoireGrid(productId)) {
    const finalPrice = calculateForceNoirePrice(productId!, weight, basePrice) ?? 0;
    const rawPrice = basePrice * weight;
    const discount = rawPrice > 0 ? 1 - finalPrice / rawPrice : 0;
    return { rawPrice, finalPrice, discount };
  }


  const tier = getDiscountTier(weight, priceGroup);
  const rawPrice = basePrice * weight;
  const discountedPrice = rawPrice * (1 - tier.discount);

  return {
    rawPrice,
    finalPrice: discountedPrice,
    discount: tier.discount,
  };
};

// Prix d'une ligne en tenant compte du POIDS CUMULÉ de sa catégorie.
// Le palier (remise) est déterminé par cumulativeWeight, puis le €/g obtenu
// est appliqué au poids réel de la ligne.
export const calculateCumulativeItemPrice = (
  basePrice: number,
  weight: number,
  cumulativeWeight: number,
  priceGroup: PriceGroup = "A",
  productId?: string
) => {
  if (!weight || weight <= 0 || isNaN(weight)) {
    return { rawPrice: 0, finalPrice: 0, discount: 0 };
  }
  const cumul = Math.max(cumulativeWeight || 0, weight);

  if (hasForceNoireGrid(productId)) {
    const cumulTotal = calculateForceNoirePrice(productId!, cumul, basePrice) ?? 0;
    const perGram = cumul > 0 ? cumulTotal / cumul : 0;
    const finalPrice = perGram * weight;
    const rawPrice = basePrice * weight;
    const discount = rawPrice > 0 ? 1 - finalPrice / rawPrice : 0;
    return { rawPrice, finalPrice, discount };
  }

  const tier = getDiscountTier(cumul, priceGroup);
  const rawPrice = basePrice * weight;
  return {
    rawPrice,
    finalPrice: rawPrice * (1 - tier.discount),
    discount: tier.discount,
  };
};

// ============================================
// POIDS CUMULÉS DU PANIER (depuis le 13/11/2026)
// Règle de Maëva : le palier de prix dépend du poids cumulé de TOUT le panier, même entre
// deux gammes, et chaque variété est comptée au prix au gramme de SA gamme pour ce palier.
// Exemple : Amnesia 5 g + Mango X Ice 5 g = 10 g en tout, donc 5 g d'Amnesia au prix
// des 10 g (6,50 €/g) et 5 g de Mango X Ice à son prix des 10 g.
// Même règle dans la commande manuelle de l'admin (ManualOrderCreator) et dans
// supabase/functions/create-viva-payment/index.ts : toujours changer les deux ensemble.
// CUMUL_TOUT_LE_PANIER = false : le cumul ne se fait plus qu'à l'intérieur d'une gamme (A ou B).
// ============================================
export const CUMUL_TOUT_LE_PANIER = true;

export const getGroupWeights = (
  lines: { weight: number; priceGroup?: PriceGroup | null }[],
): Record<PriceGroup, number> => {
  const acc: Record<PriceGroup, number> = { A: 0, B: 0 };
  for (const l of lines) {
    const w = Number(l.weight);
    if (!w || w <= 0 || isNaN(w)) continue;
    acc[l.priceGroup === "B" ? "B" : "A"] += w;
  }
  const a = Math.round(acc.A * 100) / 100;
  const b = Math.round(acc.B * 100) / 100;
  if (CUMUL_TOUT_LE_PANIER) {
    const all = Math.round((a + b) * 100) / 100;
    return { A: all, B: all };
  }
  return { A: a, B: b };
};


// Calculate accessory price with bulk discount
export const calculateAccessoryPrice = (unitPrice: number, quantity: number): AccessoryPriceInfo => {
  if (!quantity || quantity <= 0 || isNaN(quantity)) {
    return { rawTotal: 0, finalTotal: 0, discount: 0, discountLabel: null };
  }

  const discount = quantity >= ACCESSORY_BULK_THRESHOLD ? ACCESSORY_BULK_DISCOUNT : 0;
  const rawTotal = unitPrice * quantity;
  const finalTotal = rawTotal * (1 - discount);

  return {
    rawTotal,
    finalTotal,
    discount,
    discountLabel: discount > 0 ? "-33%" : null,
  };
};

// Get gifts based on total flower weight - 1 kit every 10g
export const getGifts = (weight: number): GiftInfo | null => {
  if (!weight || weight <= 0 || weight < 10) return null;
  
  const packCount = Math.floor(weight / 10);
  
  const contents: GiftContents = {
    feuillesSlim: packCount,
    briquetBIC: packCount,
  };

  return {
    type: packCount >= 10 ? "kit" : "pack",
    count: packCount,
    label: `${packCount} Kit${packCount > 1 ? "s" : ""} Cadeau`,
    contents,
  };
};

export const getDiscountLabel = (weight: number, priceGroup: PriceGroup = "A", productId?: string, basePrice?: number): string => {
  if (hasForceNoireGrid(productId) && basePrice) {
    const finalPrice = calculateForceNoirePrice(productId!, weight, basePrice) ?? 0;
    const raw = basePrice * weight;
    const d = raw > 0 ? 1 - finalPrice / raw : 0;
    return d > 0.005 ? `-${Math.round(d * 100)}%` : "0%";
  }

  const tier = getDiscountTier(weight, priceGroup);
  return tier.label;
};

// Calculate sample allowance based on total flower weight (1 sample per 10g)
export const calculateSampleAllowance = (totalFlowerWeight: number): number => {
  return Math.floor(totalFlowerWeight / 10);
};

// Pro pricing - simple fixed price calculation (NO weight-based discounts)
export const calculateProItemPrice = (proUnitPrice: number, weight: number) => {
  if (!weight || weight <= 0 || isNaN(weight)) {
    return { rawPrice: 0, finalPrice: 0 };
  }
  const total = proUnitPrice * weight;
  return {
    rawPrice: total,
    finalPrice: total,
  };
};
