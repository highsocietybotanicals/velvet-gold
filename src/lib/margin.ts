// Margin & profitability helpers

export type ProGamme = "classiques" | "911_og" | "poussiere" | "nectar_top";

export const GAMME_LABEL: Record<ProGamme, string> = {
  classiques: "Classiques (Amnesia, Platinum OG, Mint Kush, Blue Mango, Ice O Lator, Golden CBN, Nuage de Mousseux)",
  "911_og": "911 OG",
  poussiere: "Poussière d'Or",
  nectar_top: "Haribo & Heisenberg (Nectar Divin)",
};

export const PRODUCT_TO_GAMME: Record<string, ProGamme> = {
  "amnesia-signature-oniria": "classiques",
  "platinum-og": "classiques",
  "mint-kush": "classiques",
  "blue-mango-indoor": "classiques",
  "ice-o-lator": "classiques",
  "golden-cbn": "classiques",
  "nuage-de-mousseux": "classiques",
  "911-og-indoor": "911_og",
  "poussiere-dor": "poussiere",
  "haribo": "nectar_top",
  "heisenberg": "nectar_top",
};

export const getGammeForProduct = (productId: string): ProGamme =>
  PRODUCT_TO_GAMME[productId] ?? "classiques";

export interface PriceTier {
  gamme: string;
  tier_max_g: number;
  price_per_gram: number;
}

// Returns the €/g price pro applicable given the total order weight (in g).
// tier_max_g is the upper bound of the tier (200 = up to 200g, 999999 = beyond 1kg).
export const getProPricePerGram = (
  tiers: PriceTier[],
  gamme: ProGamme,
  totalWeightG: number
): number | null => {
  const forGamme = tiers
    .filter((t) => t.gamme === gamme)
    .sort((a, b) => a.tier_max_g - b.tier_max_g);
  if (!forGamme.length) return null;
  for (const t of forGamme) {
    if (totalWeightG <= t.tier_max_g) return Number(t.price_per_gram);
  }
  return Number(forGamme[forGamme.length - 1].price_per_gram);
};

// ================================================================
// Cost model
// ================================================================
export interface CostsBundle {
  productCosts: Record<string, number>; // product_id -> €/g
  consumables: Record<string, number>; // key -> unit_cost
  fixed: {
    colissimo_domicile: number;
    colissimo_relais: number;
    essence_per_km: number;
    viva_commission_pct: number;
  };
}

export interface OrderItemLite {
  product_id: string;
  weight: number | null;
  quantity: number | null;
  unit_price: number;
  total_price: number;
}

export interface OrderLite {
  total_amount: number;
  total_flower_weight: number;
  delivery_type: string;
  order_items?: OrderItemLite[];
}

export interface MarginBreakdown {
  revenue: number;
  costMatter: number;
  costConsumables: number;
  costGifts: number;
  costShipping: number;
  costCommission: number;
  costMileage: number;
  totalCost: number;
  margin: number;
  marginPct: number;
}

// Compute a per-order margin from a given costs bundle.
// mileageKm optional (used for delivery_type = "personal" / "livraison_perso").
export const computeOrderMargin = (
  order: OrderLite,
  costs: CostsBundle,
  mileageKm: number = 0
): MarginBreakdown => {
  const revenue = Number(order.total_amount) || 0;
  const items = order.order_items ?? [];

  // Matter cost = sum over flower items of (weight * cost_per_gram)
  let costMatter = 0;
  let totalFlowerG = 0;
  for (const it of items) {
    const w = Number(it.weight) || 0;
    if (w > 0) {
      totalFlowerG += w;
      const cpg = costs.productCosts[it.product_id] ?? 0;
      costMatter += w * cpg;
    }
  }

  // Consumables: 1 pochon + 1 boveda + 1 etiquette per flower item that has a weight
  // For preconditioning: we approximate 1 pochon per 10g bucket + 1 pochon per non-10g line.
  const flowerLines = items.filter((it) => (Number(it.weight) || 0) > 0).length;
  const pochons = Math.max(flowerLines, Math.ceil(totalFlowerG / 10));
  const costConsumables =
    pochons *
      ((costs.consumables["pochon_alu"] ?? 0) +
        (costs.consumables["boveda_62"] ?? 0) +
        (costs.consumables["etiquette"] ?? 0)) +
    (costs.consumables["sachet_expedition"] ?? 0);

  // Gifts: 1 kit (briquet + feuilles) per 10g
  const kits = Math.floor(totalFlowerG / 10);
  const costGifts =
    kits *
    ((costs.consumables["briquet_bic"] ?? 0) + (costs.consumables["feuilles_slim"] ?? 0));

  // Shipping
  let costShipping = 0;
  const dt = (order.delivery_type || "").toLowerCase();
  if (dt.includes("relais")) costShipping = costs.fixed.colissimo_relais;
  else if (dt.includes("domicile") || dt.includes("postal") || dt.includes("colissimo"))
    costShipping = costs.fixed.colissimo_domicile;

  // Mileage cost for personal delivery
  const costMileage = mileageKm * (costs.fixed.essence_per_km || 0);

  // Viva commission
  const costCommission = revenue * ((costs.fixed.viva_commission_pct || 0) / 100);

  const totalCost =
    costMatter + costConsumables + costGifts + costShipping + costCommission + costMileage;
  const margin = revenue - totalCost;
  const marginPct = revenue > 0 ? (margin / revenue) * 100 : 0;

  return {
    revenue,
    costMatter,
    costConsumables,
    costGifts,
    costShipping,
    costCommission,
    costMileage,
    totalCost,
    margin,
    marginPct,
  };
};

// Free-form simulator: I sell X g of product P at unit price Y €/g (HT or TTC).
export interface SimInput {
  productId: string;
  weightG: number;
  unitPricePerGram: number; // what the customer pays (TTC assumed)
  includeGifts: boolean;
  shipping: "none" | "domicile" | "relais" | "personal";
  mileageKm: number;
}

export const computeSimulation = (input: SimInput, costs: CostsBundle): MarginBreakdown => {
  const revenue = input.weightG * input.unitPricePerGram;
  const cpg = costs.productCosts[input.productId] ?? 0;
  const costMatter = input.weightG * cpg;

  const pochons = Math.max(1, Math.ceil(input.weightG / 10));
  const costConsumables =
    pochons *
      ((costs.consumables["pochon_alu"] ?? 0) +
        (costs.consumables["boveda_62"] ?? 0) +
        (costs.consumables["etiquette"] ?? 0)) +
    (costs.consumables["sachet_expedition"] ?? 0);

  const kits = input.includeGifts ? Math.floor(input.weightG / 10) : 0;
  const costGifts =
    kits *
    ((costs.consumables["briquet_bic"] ?? 0) + (costs.consumables["feuilles_slim"] ?? 0));

  let costShipping = 0;
  if (input.shipping === "domicile") costShipping = costs.fixed.colissimo_domicile;
  else if (input.shipping === "relais") costShipping = costs.fixed.colissimo_relais;

  const costMileage =
    input.shipping === "personal" ? input.mileageKm * (costs.fixed.essence_per_km || 0) : 0;

  const costCommission = revenue * ((costs.fixed.viva_commission_pct || 0) / 100);

  const totalCost =
    costMatter + costConsumables + costGifts + costShipping + costCommission + costMileage;
  const margin = revenue - totalCost;
  const marginPct = revenue > 0 ? (margin / revenue) * 100 : 0;

  return {
    revenue,
    costMatter,
    costConsumables,
    costGifts,
    costShipping,
    costCommission,
    costMileage,
    totalCost,
    margin,
    marginPct,
  };
};
