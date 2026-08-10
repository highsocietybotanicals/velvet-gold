import {
  getGammeForProduct,
  getProPricePerGram,
  PRO_TIERS,
  proTierLabel,
  type PriceTier,
} from "./margin";

import { calculateItemPrice } from "./pricing";
import type { PriceGroup } from "@/data/products";

export const PRO_FORMATS = [1, 2.5, 5, 10] as const;
export type ProFormat = (typeof PRO_FORMATS)[number];

/**
 * Aucun supplément conditionnement : le pochon HSB, le Boveda 62 % et
 * l'étiquette restent à la charge de HSB. Le prix pro HT est donc identique
 * quel que soit le format (exactement 50 % du prix public HT, puis dégressif).
 */
export const FORMAT_SURCHARGE: Record<number, number> = {
  1: 0,
  2.5: 0,
  5: 0,
  10: 0,
};

/** Coefficient de rentabilité minimum garanti au revendeur (PV public TTC / achat HT) */
export const MIN_RESELLER_COEF = 2;

export const proPricePerGram = (
  tiers: PriceTier[],
  productId: string,
  totalWeightG: number,
  format: number,
  info?: ProductPriceInfo
): number => {
  const base = getProPricePerGram(tiers, getGammeForProduct(productId), totalWeightG);
  if (base === null) return 0;
  let ppg = base + (FORMAT_SURCHARGE[format] ?? 0);

  // Garantie : sur chaque format, le pro doit pouvoir faire au moins x2
  // (prix public TTC conseillé du format / prix d'achat HT au gramme).
  if (info && format > 0) {
    const retailTTC = calculateItemPrice(info.price, format, info.priceGroup, productId).finalPrice;
    if (retailTTC > 0) {
      const cap = retailTTC / format / MIN_RESELLER_COEF;
      if (cap < ppg) ppg = cap;
    }
  }

  return Math.round(ppg * 100) / 100;
};

export const VAT_RATE = 0.2;



export interface ProCartLine {
  productId: string;
  productName: string;
  format: number;
  units: number;
}

export interface ProComputedLine extends ProCartLine {
  weightG: number;
  pricePerGram: number;
  totalHT: number;
  /** Prix de vente public conseillé TTC pour ce format (à l'unité) */
  retailUnitTTC: number;
  /** Marge revendeur estimée sur la ligne (PV public TTC - achat HT) */
  resellerMargin: number;
}

export interface ProCartTotals {
  lines: ProComputedLine[];
  totalWeightG: number;
  totalHT: number;
  totalVAT: number;
  totalTTC: number;
  /** Palier courant (borne haute en g) */
  currentTierMaxG: number | null;
  /** Grammes restants pour atteindre le palier suivant */
  gramsToNextTier: number | null;
  /** Économie €/g moyenne au palier suivant */
  nextTierSavingPerGram: number | null;
  retailTotalTTC: number;
  resellerMarginTotal: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export interface ProductPriceInfo {
  price: number;
  priceGroup: PriceGroup;
}

/**
 * Calcule un panier pro : le €/g dépend du poids TOTAL du panier (tous produits
 * confondus), appliqué par gamme.
 */
export const computeProCart = (
  lines: ProCartLine[],
  tiers: PriceTier[],
  productInfo: Record<string, ProductPriceInfo>
): ProCartTotals => {
  const active = lines.filter((l) => l.units > 0);
  const totalWeightG = active.reduce((s, l) => s + l.format * l.units, 0);

  const computed: ProComputedLine[] = active.map((l) => {
    const info = productInfo[l.productId];
    const ppg = proPricePerGram(tiers, l.productId, totalWeightG, l.format, info);

    const weightG = round2(l.format * l.units);
    const totalHT = round2(weightG * ppg);

    const retailUnitTTC = info
      ? round2(calculateItemPrice(info.price, l.format, info.priceGroup, l.productId).finalPrice)
      : 0;
    const retailTotal = round2(retailUnitTTC * l.units);

    return {
      ...l,
      weightG,
      pricePerGram: ppg,
      totalHT,
      retailUnitTTC,
      resellerMargin: round2(retailTotal - totalHT),
    };
  });

  const totalHT = round2(computed.reduce((s, l) => s + l.totalHT, 0));
  const totalVAT = round2(totalHT * VAT_RATE);
  const retailTotalTTC = round2(
    computed.reduce((s, l) => s + l.retailUnitTTC * l.units, 0)
  );

  // Palier courant / suivant : paliers de volume communs à tous les produits.
  let currentTierMaxG: number | null = null;
  let gramsToNextTier: number | null = null;
  let nextTierSavingPerGram: number | null = null;

  const idx = PRO_TIERS.findIndex((t) => totalWeightG <= t);
  if (idx >= 0) {
    currentTierMaxG = PRO_TIERS[idx];
    const next = PRO_TIERS[idx + 1];
    if (next !== undefined) {
      gramsToNextTier = round2(Math.max(0, PRO_TIERS[idx] + 1 - totalWeightG));
      // Économie moyenne €/g au palier suivant, sur les produits du panier
      const ids = [...new Set(active.map((l) => l.productId))];
      const deltas = ids
        .map((id) => {
          const cur = tiers.find(
            (t) => t.gamme === getGammeForProduct(id) && Number(t.tier_max_g) === PRO_TIERS[idx]
          );
          const nxt = tiers.find(
            (t) => t.gamme === getGammeForProduct(id) && Number(t.tier_max_g) === next
          );
          return cur && nxt ? Number(cur.price_per_gram) - Number(nxt.price_per_gram) : null;
        })
        .filter((d): d is number => d !== null);
      nextTierSavingPerGram = deltas.length
        ? round2(deltas.reduce((s, d) => s + d, 0) / deltas.length)
        : null;
    }
  }


  return {
    lines: computed,
    totalWeightG: round2(totalWeightG),
    totalHT,
    totalVAT,
    totalTTC: round2(totalHT + totalVAT),
    currentTierMaxG,
    gramsToNextTier,
    nextTierSavingPerGram,
    retailTotalTTC,
    resellerMarginTotal: round2(retailTotalTTC - totalHT),
  };
};

export const tierLabel = (maxG: number | null): string => {
  if (maxG === null) return "—";
  return proTierLabel(maxG);
};

