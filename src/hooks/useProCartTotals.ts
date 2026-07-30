import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProCart } from "@/contexts/ProCartContext";
import { useProPriceTiers } from "@/hooks/useProPriceTiers";
import { useCatalogProducts } from "@/hooks/useCatalogProducts";
import { computeProCart, type ProductPriceInfo } from "@/lib/proPricing";

export const useProSettings = () =>
  useQuery({
    queryKey: ["pro-settings"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("pro_settings")
        .select("franco_port_seuil_ht, delai_paiement_jours")
        .eq("id", 1)
        .maybeSingle();
      if (error) throw error;
      return (data ?? { franco_port_seuil_ht: 300, delai_paiement_jours: 30 }) as {
        franco_port_seuil_ht: number;
        delai_paiement_jours: number;
      };
    },
    staleTime: 5 * 60_000,
  });

export const useProCartTotals = () => {
  const { lines } = useProCart();
  const { tiers, isLoading: tiersLoading } = useProPriceTiers();
  const { all, isLoading: productsLoading } = useCatalogProducts();

  const productInfo = useMemo(() => {
    const map: Record<string, ProductPriceInfo> = {};
    all.forEach((p) => {
      map[p.id] = { price: p.price, priceGroup: p.priceGroup };
    });
    return map;
  }, [all]);

  const totals = useMemo(
    () => computeProCart(lines, tiers, productInfo),
    [lines, tiers, productInfo]
  );

  return { totals, products: all, isLoading: tiersLoading || productsLoading };
};
