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
  pochonMoyen: number;
  feuillesSlim: number;
  briquetHSB: number;
  elastique: number;
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
// GROUPE A - Standard Luxury (Base 12€/g)
// Objectif: 6€/g à 100g (50% de remise)
// ============================================
export const WEIGHT_TIERS_A: WeightTier[] = [
  { min: 0, max: 9.99, discount: 0, label: "0%" },
  { min: 10, max: 24.99, discount: 0.15, label: "-15%" },
  { min: 25, max: 49.99, discount: 0.25, label: "-25%" },
  { min: 50, max: 99.99, discount: 0.35, label: "-35%" },
  { min: 100, max: Infinity, discount: 0.50, label: "-50%" },
];

// ============================================
// GROUPE B - Ultra Premium (Base 14€/g)
// Objectif: ~9€/g à 100g (35% de remise)
// ============================================
export const WEIGHT_TIERS_B: WeightTier[] = [
  { min: 0, max: 9.99, discount: 0, label: "0%" },
  { min: 10, max: 24.99, discount: 0.10, label: "-10%" },
  { min: 25, max: 49.99, discount: 0.20, label: "-20%" },
  { min: 50, max: 99.99, discount: 0.25, label: "-25%" },
  { min: 100, max: Infinity, discount: 0.35, label: "-35%" },
];

// Ancien système pour compatibilité (utilise Groupe A par défaut)
export const WEIGHT_TIERS: WeightTier[] = WEIGHT_TIERS_A;

export const PRESET_WEIGHTS = [1, 2.5, 10, 25, 50, 100];

// Accessory bulk discount threshold
export const ACCESSORY_BULK_THRESHOLD = 10;
export const ACCESSORY_BULK_DISCOUNT = 0.33;

export const getDiscountTier = (weight: number, priceGroup: PriceGroup = "A"): WeightTier => {
  const tiers = priceGroup === "B" ? WEIGHT_TIERS_B : WEIGHT_TIERS_A;
  return tiers.find(tier => weight >= tier.min && weight <= tier.max) || tiers[0];
};

export const calculatePrice = (basePrice: number, weight: number, priceGroup: PriceGroup = "A"): PriceInfo => {
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
export const calculateItemPrice = (basePrice: number, weight: number, priceGroup: PriceGroup = "A") => {
  if (!weight || weight <= 0 || isNaN(weight)) {
    return { rawPrice: 0, finalPrice: 0, discount: 0 };
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

// Get gifts based on total flower weight - 1 Pack Initié every 10g
// DÉSACTIVÉ TEMPORAIREMENT - Accessoires en rupture
export const getGifts = (weight: number): GiftInfo | null => {
  // Retourne null pour masquer les cadeaux (accessoires indisponibles)
  return null;
  
  /* Code conservé pour réactivation future:
  if (!weight || weight <= 0 || weight < 10) return null;
  
  const packCount = Math.floor(weight / 10);
  
  const contents: GiftContents = {
    pochonMoyen: packCount,
    feuillesSlim: packCount,
    briquetHSB: packCount,
    elastique: packCount,
  };

  if (weight >= 100) {
    return {
      type: "kit",
      count: packCount,
      label: `Kit Revendeur HSB (${packCount} Packs)`,
      contents,
    };
  }
  
  return {
    type: "pack",
    count: packCount,
    label: `${packCount} Pack${packCount > 1 ? "s" : ""} Initié`,
    contents,
  };
  */
};

export const getDiscountLabel = (weight: number, priceGroup: PriceGroup = "A"): string => {
  const tier = getDiscountTier(weight, priceGroup);
  return tier.label;
};

// Calculate sample allowance based on total flower weight (1 sample per 12g)
export const calculateSampleAllowance = (totalFlowerWeight: number): number => {
  return Math.floor(totalFlowerWeight / 12);
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
