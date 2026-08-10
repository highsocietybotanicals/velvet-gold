import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  allProducts as staticAllProducts,
  Product,
  PriceGroup,
} from "@/data/products";

interface DbOverride {
  id: string;
  price: number;
  is_active: boolean;
  price_group: "A" | "B";
  is_force_noire: boolean | null;
  cbd_percentage: string | null;
  subtitle: string | null;
  badge: string | null;
  description: string | null;
  display_order: number | null;
}

/**
 * Fusionne le catalogue statique (images, terpènes, mood) avec les overrides
 * de la table `products` (prix, actif, sous-titre, badge, description, ordre).
 * Un produit désactivé en base est retiré. Les produits présents en base mais
 * pas dans le fichier statique sont ignorés (pas de visuel disponible).
 */
export const useCatalogProducts = () => {
  const { data: overrides, isLoading } = useQuery({
    queryKey: ["catalog", "merged"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(
          "id, price, is_active, price_group, is_force_noire, cbd_percentage, subtitle, badge, description, display_order"
        );
      if (error) throw error;
      const map: Record<string, DbOverride> = {};
      (data || []).forEach((r) => {
        map[(r as any).id] = r as DbOverride;
      });
      return map;
    },
    staleTime: 60_000,
  });

  const merged: Product[] = useMemo(() => {
    if (!overrides) return staticAllProducts;
    return staticAllProducts
      .map((p) => {
        const o = overrides[p.id];
        if (!o) return p;
        if (o.is_active === false) return null;
        return {
          ...p,
          price: Number(o.price ?? p.price),
          priceGroup: (o.price_group as PriceGroup) ?? p.priceGroup,
          subtitle: o.subtitle ?? p.subtitle,
          badge: o.badge ?? p.badge,
          description: o.description ?? p.description,
          cbdPercentage: o.cbd_percentage ?? p.cbdPercentage,
          isForceNoire: o.is_force_noire ?? p.isForceNoire,
          isExotique: p.isExotique,
        } as Product;
      })
      .filter((p): p is Product => !!p)
      .sort((a, b) => {
        const ao = overrides[a.id]?.display_order ?? 0;
        const bo = overrides[b.id]?.display_order ?? 0;
        if (ao !== bo) return ao - bo;
        return 0;
      });
  }, [overrides]);

  const flowers = useMemo(() => merged.filter((p) => p.category === "fleur"), [merged]);
  const resins = useMemo(() => merged.filter((p) => p.category === "resine"), [merged]);
  const forceNoire = useMemo(() => merged.filter((p) => p.isForceNoire || p.isNectarDivin || p.isExotique), [merged]);
  const nectarDivin = useMemo(() => merged.filter((p) => p.isNectarDivin), [merged]);
  const exotique = useMemo(() => merged.filter((p) => p.isExotique), [merged]);

  return { all: merged, flowers, resins, forceNoire, nectarDivin, exotique, isLoading };
};
