import { getGammeForProduct, getProPricePerGram, type PriceTier } from "./margin";
import { calculateItemPrice } from "./pricing";
import type { PriceGroup } from "@/data/products";

export const PRO_FORMATS = [1, 2.5, 5, 10] as const;
export type ProFormat = (typeof PRO_FORMATS)[number];

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
    const gamme = getGammeForProduct(l.productId);
    const ppg = getProPricePerGram(tiers, gamme, totalWeightG) ?? 0;
    const weightG = round2(l.format * l.units);
    const totalHT = round2(weightG * ppg);

    const info = productInfo[l.productId];
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

  // Palier courant / suivant (basé sur la gamme "classiques" pour l'affichage)
  const classiques = tiers
    .filter((t) => t.gamme === "classiques")
    .sort((a, b) => a.tier_max_g - b.tier_max_g);

  let currentTierMaxG: number | null = null;
  let gramsToNextTier: number | null = null;
  let nextTierSavingPerGram: number | null = null;

  if (classiques.length) {
    const idx = classiques.findIndex((t) => totalWeightG <= t.tier_max_g);
    if (idx >= 0) {
      currentTierMaxG = classiques[idx].tier_max_g;
      const next = classiques[idx + 1];
      if (next) {
        gramsToNextTier = round2(Math.max(0, classiques[idx].tier_max_g - totalWeightG) + 0.01);
        nextTierSavingPerGram = round2(
          Number(classiques[idx].price_per_gram) - Number(next.price_per_gram)
        );
      }
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
  if (maxG >= 100000) return "+ de 1 kg";
  return `jusqu'à ${maxG} g`;
};
