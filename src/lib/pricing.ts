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
// Calé sur le book Vitrine TTC : 1g=12, 2.5g=25, 5g=45, 10g=80
// ============================================
export const WEIGHT_TIERS_A: WeightTier[] = [
  { min: 0, max: 2.49, discount: 0, label: "0%" },
  { min: 2.5, max: 4.99, discount: 0.17, label: "-17%" },
  { min: 5, max: 9.99, discount: 0.25, label: "-25%" },
  { min: 10, max: 24.99, discount: 0.33, label: "-33%" },
  { min: 25, max: 49.99, discount: 0.40, label: "-40%" },
  { min: 50, max: 99.99, discount: 0.45, label: "-45%" },
  { min: 100, max: Infinity, discount: 0.50, label: "-50%" },
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

// Grille fixe par produit pour l'Élixir Noir (Prix Vitrine TTC du book)
export const FORCE_NOIRE_PRICE_GRID: Record<string, { weight: number; price: number }[]> = {
  "nuage-de-mousseux": [
    { weight: 1, price: 13 },
    { weight: 2.5, price: 30 },
    { weight: 5, price: 55 },
    { weight: 10, price: 65 },
  ],
  "911-og-indoor": [
    { weight: 1, price: 15 },
    { weight: 2.5, price: 35 },
    { weight: 5, price: 65 },
    { weight: 10, price: 90 },
  ],
  "blue-mango-indoor": [
    { weight: 1, price: 13 },
    { weight: 2.5, price: 30 },
    { weight: 5, price: 55 },
    { weight: 10, price: 80 },
  ],
};

// Calcule le prix total d'un produit Force Noire selon sa grille fixe
// Pour les poids hors paliers : utilise le €/g du palier le plus proche par défaut sur le 10g (le plus avantageux)
// Pour > 10g : applique un dégressif additionnel léger
export const calculateForceNoirePrice = (productId: string, weight: number): number | null => {
  const grid = FORCE_NOIRE_PRICE_GRID[productId];
  if (!grid || !weight || weight <= 0) return null;

  // Match exact d'un palier
  const exact = grid.find((g) => g.weight === weight);
  if (exact) return exact.price;

  // Calcul basé sur le palier 10g (le plus avantageux) pour les poids intermédiaires/supérieurs
  const tier10 = grid[grid.length - 1];
  const pricePerGram10 = tier10.price / tier10.weight;

  if (weight < 10) {
    // Interpole entre paliers proches
    let lower = grid[0];
    let upper = grid[grid.length - 1];
    for (let i = 0; i < grid.length - 1; i++) {
      if (weight >= grid[i].weight && weight <= grid[i + 1].weight) {
        lower = grid[i];
        upper = grid[i + 1];
        break;
      }
    }
    const ratio = (weight - lower.weight) / (upper.weight - lower.weight);
    return lower.price + (upper.price - lower.price) * ratio;
  }

  // Au-delà de 10g : tarif 10g/g + dégressif additionnel
  let extraDiscount = 0;
  if (weight >= 100) extraDiscount = 0.20;
  else if (weight >= 50) extraDiscount = 0.15;
  else if (weight >= 25) extraDiscount = 0.10;

  return weight * pricePerGram10 * (1 - extraDiscount);
};

// Ancien système pour compatibilité (utilise Groupe A par défaut)
export const WEIGHT_TIERS: WeightTier[] = WEIGHT_TIERS_A;

// Retourne le prix au gramme le plus bas atteignable pour un produit (palier 100g)
export const getLowestPricePerGram = (
  basePrice: number,
  priceGroup: PriceGroup = "A",
  productId?: string
): number => {
  if (productId && FORCE_NOIRE_PRICE_GRID[productId]) {
    const total = calculateForceNoirePrice(productId, 100);
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
  if (productId && FORCE_NOIRE_PRICE_GRID[productId]) {
    const finalPrice = calculateForceNoirePrice(productId, weight) ?? 0;
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

  // Force Noire : grille fixe par produit
  if (productId && FORCE_NOIRE_PRICE_GRID[productId]) {
    const finalPrice = calculateForceNoirePrice(productId, weight) ?? 0;
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
  if (productId && FORCE_NOIRE_PRICE_GRID[productId] && basePrice) {
    const finalPrice = calculateForceNoirePrice(productId, weight) ?? 0;
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
