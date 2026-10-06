import type { ProCartLine } from "./proPricing";

/**
 * Conditions commerciales de l'offre revendeur.
 * Miroir côté serveur : supabase/functions/_shared/proOffer.ts (garder les
 * deux fichiers synchronisés, c'est le serveur qui fait foi).
 */

/** Minimum de commande HT pour un partenaire (hors kit découverte) */
export const PRO_MIN_ORDER_HT = 150;

/** Kit découverte : 4 pochons de 1 g au choix, prix forfaitaire HT */
export const KIT_UNITS = 4;
export const KIT_FORMAT = 1;
export const KIT_PRICE_HT = 20;
/** Le kit est déduit d'une commande passée dans ce délai (jours) */
export const KIT_DEDUCTION_DAYS = 30;

export const KIT_PROMO_CODE = "KIT-DECOUVERTE";
export const KIT_DEDUCTION_PROMO_CODE = "KIT-DECOUVERTE-DEDUIT";

/** Le panier correspond-il exactement à un kit découverte (4 pochons de 1 g) ? */
export const isKitCart = (lines: Pick<ProCartLine, "format" | "units">[]): boolean => {
  const active = lines.filter((l) => l.units > 0);
  return (
    active.length > 0 &&
    active.every((l) => l.format === KIT_FORMAT) &&
    active.reduce((s, l) => s + l.units, 0) === KIT_UNITS
  );
};

export interface ProOrderLite {
  created_at: string;
  status: string | null;
  promo_code: string | null;
}

export interface KitStatus {
  /** Le partenaire peut encore commander son kit (aucune commande pro active) */
  kitAvailable: boolean;
  /** Un kit récent sera déduit de la prochaine commande */
  deductionAvailable: boolean;
}

/** Même règle que le serveur, à partir des commandes pro du partenaire */
export const kitStatusFromOrders = (orders: ProOrderLite[], now = Date.now()): KitStatus => {
  const active = orders.filter((o) => o.status !== "cancelled");
  const windowMs = KIT_DEDUCTION_DAYS * 24 * 3600 * 1000;
  const recentKit = active.some(
    (o) => o.promo_code === KIT_PROMO_CODE && now - new Date(o.created_at).getTime() <= windowMs
  );
  const alreadyDeducted = active.some((o) => o.promo_code === KIT_DEDUCTION_PROMO_CODE);
  return {
    kitAvailable: active.length === 0,
    deductionAvailable: recentKit && !alreadyDeducted,
  };
};
