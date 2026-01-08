// Centralized pricing logic for weight-based discounts and gifts

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

export interface GiftInfo {
  type: "kit" | "pack";
  count: number;
  label: string;
}

// Weight tier discounts
export const WEIGHT_TIERS: WeightTier[] = [
  { min: 0, max: 9.99, discount: 0, label: "0%" },
  { min: 10, max: 24.99, discount: 0.25, label: "-25%" },
  { min: 25, max: 49.99, discount: 0.375, label: "-37.5%" },
  { min: 50, max: 99.99, discount: 0.458, label: "-45.8%" },
  { min: 100, max: Infinity, discount: 0.625, label: "-62.5%" },
];

export const PRESET_WEIGHTS = [2.5, 10, 25, 50, 100];

export const getDiscountTier = (weight: number): WeightTier => {
  return WEIGHT_TIERS.find(tier => weight >= tier.min && weight <= tier.max) || WEIGHT_TIERS[0];
};

export const calculatePrice = (basePrice: number, weight: number): PriceInfo => {
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

  const tier = getDiscountTier(weight);
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
export const calculateItemPrice = (basePrice: number, weight: number) => {
  if (!weight || weight <= 0 || isNaN(weight)) {
    return { rawPrice: 0, finalPrice: 0, discount: 0 };
  }

  const tier = getDiscountTier(weight);
  const rawPrice = basePrice * weight;
  const discountedPrice = rawPrice * (1 - tier.discount);
  
  return {
    rawPrice,
    finalPrice: discountedPrice,
    discount: tier.discount,
  };
};

export const getGifts = (weight: number): GiftInfo | null => {
  if (!weight || weight <= 0) return null;
  
  if (weight >= 100) {
    return { type: "kit", count: 1, label: "Kit Professionnel HSB" };
  }
  const packs = Math.floor(weight / 10);
  if (packs > 0) {
    return { type: "pack", count: packs, label: `${packs} Pack${packs > 1 ? "s" : ""} Accessoires` };
  }
  return null;
};

export const getDiscountLabel = (weight: number): string => {
  const tier = getDiscountTier(weight);
  return tier.label;
};
