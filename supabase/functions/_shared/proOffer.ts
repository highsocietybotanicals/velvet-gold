// Tarification et conditions de l'offre revendeur, côté serveur.
// Miroir de src/lib/pricing.ts (prix public), src/lib/proPricing.ts (prix pro)
// et src/lib/proOffer.ts (minimum, kit découverte) : garder synchronisé.
// Le prix facturé doit être exactement celui affiché dans le panier pro.

export const VAT_RATE = 0.2;
export const ALLOWED_FORMATS = new Set([1, 2.5, 5, 10]);

export const PRO_MIN_ORDER_HT = 150;
export const KIT_UNITS = 4;
export const KIT_FORMAT = 1;
export const KIT_PRICE_HT = 20;
export const KIT_DEDUCTION_DAYS = 30;
export const KIT_PROMO_CODE = "KIT-DECOUVERTE";
export const KIT_DEDUCTION_PROMO_CODE = "KIT-DECOUVERTE-DEDUIT";

// ---------- Prix public TTC (copie de src/lib/pricing.ts) ----------

const WEIGHT_TIERS_A = [
  { min: 0, max: 2.49, discount: 0 },
  { min: 2.5, max: 4.99, discount: 0.17 },
  { min: 5, max: 9.99, discount: 0.25 },
  { min: 10, max: 24.99, discount: 0.33 },
  { min: 25, max: 49.99, discount: 0.4 },
  { min: 50, max: 99.99, discount: 0.45 },
  { min: 100, max: Infinity, discount: 0.5 },
];

const WEIGHT_TIERS_B = [
  { min: 0, max: 2.49, discount: 0 },
  { min: 2.5, max: 4.99, discount: 0.07 },
  { min: 5, max: 9.99, discount: 0.13 },
  { min: 10, max: 24.99, discount: 0.35 },
  { min: 25, max: 49.99, discount: 0.4 },
  { min: 50, max: 99.99, discount: 0.45 },
  { min: 100, max: Infinity, discount: 0.5 },
];

const FORCE_NOIRE_RATIOS: Record<string, Record<number, number>> = {
  "lemon-punch-hash": { 1: 1.0, 2.5: 0.9333, 5: 0.8, 10: 0.6667 },
  "bubble-hash-maturer": { 1: 1.0, 2.5: 0.9333, 5: 0.8, 10: 0.6667 },
  "911-og-indoor": { 1: 1.0, 2.5: 0.9333, 5: 0.8667, 10: 0.6 },
  "blue-mango-indoor": { 1: 1.0, 2.5: 0.9231, 5: 0.8462, 10: 0.6154 },
  haribo: { 1: 1.0, 2.5: 0.9333, 5: 0.8, 10: 0.6667 },
  heisenberg: { 1: 1.0, 2.5: 0.9333, 5: 0.8, 10: 0.6667 },
  "mango-x-ice": { 1: 1.0, 2.5: 0.9333, 5: 0.8, 10: 0.6667 },
  "poussiere-dor": { 1: 1.0, 2.5: 0.9333, 5: 0.8333, 10: 0.625 },
  piatella: { 1: 1.0, 2.5: 0.9333, 5: 0.8, 10: 0.6667 },
};

/** Prix public TTC d'un pochon (formats pro uniquement : 1 / 2,5 / 5 / 10 g) */
export const retailUnitTTC = (
  productId: string,
  basePrice: number,
  priceGroup: string | null,
  format: number
): number => {
  if (!basePrice || basePrice <= 0 || !format) return 0;
  const ratios = FORCE_NOIRE_RATIOS[productId];
  if (ratios && ratios[format] !== undefined) return basePrice * format * ratios[format];
  const tiers = priceGroup === "B" ? WEIGHT_TIERS_B : WEIGHT_TIERS_A;
  const tier = tiers.find((t) => format >= t.min && format <= t.max) ?? tiers[0];
  return basePrice * format * (1 - tier.discount);
};

// ---------- Prix pro HT (copie de src/lib/proPricing.ts) ----------

/** Coefficient minimum garanti au revendeur (prix public HT / prix d'achat HT) */
const MIN_RESELLER_COEF_BY_FORMAT: Record<number, number> = { 1: 2, 2.5: 2, 5: 2, 10: 1.7 };

export interface TierRow {
  gamme: string;
  tier_max_g: number | string;
  price_per_gram: number | string;
}

export const proPricePerGram = (
  tiers: TierRow[],
  productId: string,
  totalWeightG: number,
  format: number,
  basePrice: number,
  priceGroup: string | null
): number | null => {
  const forProduct = tiers
    .filter((t) => t.gamme === productId)
    .sort((a, b) => Number(a.tier_max_g) - Number(b.tier_max_g));
  if (!forProduct.length) return null;
  let ppg = Number(forProduct[forProduct.length - 1].price_per_gram);
  for (const t of forProduct) {
    if (totalWeightG <= Number(t.tier_max_g)) {
      ppg = Number(t.price_per_gram);
      break;
    }
  }

  const retailTTC = retailUnitTTC(productId, basePrice, priceGroup, format);
  if (retailTTC > 0) {
    const retailHT = retailTTC / (1 + VAT_RATE);
    const cap = retailHT / format / (MIN_RESELLER_COEF_BY_FORMAT[format] ?? 2);
    if (cap < ppg) ppg = cap;
  }
  return Math.round(ppg * 100) / 100;
};

// ---------- Kit découverte ----------

export const isKitCart = (lines: { format: number; units: number }[]): boolean =>
  lines.length > 0 &&
  lines.every((l) => l.format === KIT_FORMAT) &&
  lines.reduce((s, l) => s + l.units, 0) === KIT_UNITS;

export interface OrderLite {
  created_at: string;
  status: string | null;
  promo_code: string | null;
}

export const kitStatusFromOrders = (orders: OrderLite[], now = Date.now()) => {
  const active = orders.filter((o) => o.status !== "cancelled");
  const windowMs = KIT_DEDUCTION_DAYS * 24 * 3600 * 1000;
  const recentKit = active.some(
    (o) => o.promo_code === KIT_PROMO_CODE && now - new Date(o.created_at).getTime() <= windowMs
  );
  const alreadyDeducted = active.some((o) => o.promo_code === KIT_DEDUCTION_PROMO_CODE);
  return { kitAvailable: active.length === 0, deductionAvailable: recentKit && !alreadyDeducted };
};
