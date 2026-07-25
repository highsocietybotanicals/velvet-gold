import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CostsBundle } from "@/lib/margin";

export const useCosts = () => {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["costs-bundle"],
    queryFn: async (): Promise<CostsBundle> => {
      const [pc, cc, fc] = await Promise.all([
        (supabase as any).from("product_costs").select("product_id, cost_per_gram"),
        (supabase as any).from("consumable_costs").select("key, unit_cost"),
        (supabase as any).from("fixed_costs_settings").select("*").eq("id", 1).maybeSingle(),
      ]);

      const productCosts: Record<string, number> = {};
      (pc.data || []).forEach((r: any) => {
        productCosts[r.product_id] = Number(r.cost_per_gram);
      });

      const consumables: Record<string, number> = {};
      (cc.data || []).forEach((r: any) => {
        consumables[r.key] = Number(r.unit_cost);
      });

      const f = fc.data || {};
      return {
        productCosts,
        consumables,
        fixed: {
          colissimo_domicile: Number(f.colissimo_domicile ?? 7.9),
          colissimo_relais: Number(f.colissimo_relais ?? 5.9),
          essence_per_km: Number(f.essence_per_km ?? 0.2),
          viva_commission_pct: Number(f.viva_commission_pct ?? 1.5),
        },
      };
    },
    staleTime: 60_000,
  });

  const updateProductCost = useMutation({
    mutationFn: async ({ productId, cost }: { productId: string; cost: number }) => {
      const { error } = await (supabase as any)
        .from("product_costs")
        .upsert({ product_id: productId, cost_per_gram: cost, updated_at: new Date().toISOString() });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["costs-bundle"] }),
  });

  const updateConsumable = useMutation({
    mutationFn: async ({ key, cost }: { key: string; cost: number }) => {
      const { error } = await (supabase as any)
        .from("consumable_costs")
        .update({ unit_cost: cost, updated_at: new Date().toISOString() })
        .eq("key", key);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["costs-bundle"] }),
  });

  const updateFixed = useMutation({
    mutationFn: async (payload: Partial<CostsBundle["fixed"]>) => {
      const { error } = await (supabase as any)
        .from("fixed_costs_settings")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", 1);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["costs-bundle"] }),
  });

  return {
    costs: data,
    isLoading,
    updateProductCost,
    updateConsumable,
    updateFixed,
  };
};

export const useConsumablesList = () => {
  return useQuery({
    queryKey: ["consumables-list"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("consumable_costs")
        .select("key, label, unit_cost, unit")
        .order("label");
      if (error) throw error;
      return data as Array<{ key: string; label: string; unit_cost: number; unit: string }>;
    },
    staleTime: 60_000,
  });
};
