import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PriceTier, ProGamme } from "@/lib/margin";
import { getProPricePerGram } from "@/lib/margin";

export const useProPriceTiers = () => {
  const qc = useQueryClient();

  const { data: tiers, isLoading } = useQuery({
    queryKey: ["pro-price-tiers"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("pro_price_tiers")
        .select("id, gamme, tier_max_g, price_per_gram")
        .order("gamme")
        .order("tier_max_g");
      if (error) throw error;
      return data as Array<PriceTier & { id: string }>;
    },
    staleTime: 5 * 60_000,
  });

  const updateTier = useMutation({
    mutationFn: async ({ id, price }: { id: string; price: number }) => {
      const { error } = await (supabase as any)
        .from("pro_price_tiers")
        .update({ price_per_gram: price, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pro-price-tiers"] }),
  });

  const priceFor = (gamme: ProGamme, totalWeightG: number): number | null =>
    tiers ? getProPricePerGram(tiers, gamme, totalWeightG) : null;

  return { tiers: tiers ?? [], isLoading, updateTier, priceFor };
};
