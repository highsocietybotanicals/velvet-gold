import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface InventoryRow {
  product_id: string;
  name: string;
  category: string;
  is_active: boolean;
  is_force_noire: boolean;
  is_out_of_stock: boolean;
  stock_grams: number;
  low_stock_threshold_g: number;
  updated_at: string | null;
}

export interface InventoryMovement {
  id: string;
  product_id: string;
  order_id: string | null;
  delta_grams: number;
  reason: "sale" | "restock" | "manual" | "cancel";
  note: string | null;
  created_at: string;
}

const invalidate = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: ["admin", "inventory"] });
  qc.invalidateQueries({ queryKey: ["admin", "inventory-movements"] });
  qc.invalidateQueries({ queryKey: ["admin", "db-products"] });
  qc.invalidateQueries({ queryKey: ["admin", "products"] });
  qc.invalidateQueries({ queryKey: ["catalog", "merged"] });
  qc.invalidateQueries({ queryKey: ["products-prices"] });
};

export const useInventory = () => {
  const queryClient = useQueryClient();

  const { data: rows, isLoading } = useQuery({
    queryKey: ["admin", "inventory"],
    queryFn: async (): Promise<InventoryRow[]> => {
      const [{ data: products, error: pErr }, { data: inv, error: iErr }] = await Promise.all([
        supabase
          .from("products")
          .select("id, name, category, is_active, is_force_noire, is_out_of_stock, display_order")
          .order("display_order", { ascending: true })
          .order("name", { ascending: true }),
        supabase.from("product_inventory").select("*"),
      ]);
      if (pErr) throw pErr;
      if (iErr) throw iErr;

      const map = new Map((inv ?? []).map((i: any) => [i.product_id, i]));
      return (products ?? []).map((p: any) => {
        const i = map.get(p.id);
        return {
          product_id: p.id,
          name: p.name,
          category: p.category,
          is_active: p.is_active,
          is_force_noire: p.is_force_noire,
          is_out_of_stock: p.is_out_of_stock,
          stock_grams: Number(i?.stock_grams ?? 0),
          low_stock_threshold_g: Number(i?.low_stock_threshold_g ?? 10),
          updated_at: i?.updated_at ?? null,
        };
      });
    },
  });

  const { data: movements } = useQuery({
    queryKey: ["admin", "inventory-movements"],
    queryFn: async (): Promise<InventoryMovement[]> => {
      const { data, error } = await supabase
        .from("inventory_movements")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as unknown as InventoryMovement[];
    },
  });

  const setStock = useMutation({
    mutationFn: async ({ productId, grams }: { productId: string; grams: number }) => {
      const { data: current } = await supabase
        .from("product_inventory")
        .select("stock_grams")
        .eq("product_id", productId)
        .maybeSingle();

      const previous = Number(current?.stock_grams ?? 0);
      const delta = grams - previous;

      const { error } = await supabase
        .from("product_inventory")
        .upsert({ product_id: productId, stock_grams: grams }, { onConflict: "product_id" });
      if (error) throw error;

      if (delta !== 0) {
        await supabase.from("inventory_movements").insert({
          product_id: productId,
          delta_grams: delta,
          reason: "manual",
          note: "Saisie manuelle du stock",
        });
      }
    },
    onSuccess: () => invalidate(queryClient),
  });

  const adjustStock = useMutation({
    mutationFn: async ({ productId, delta }: { productId: string; delta: number }) => {
      const { data: current } = await supabase
        .from("product_inventory")
        .select("stock_grams")
        .eq("product_id", productId)
        .maybeSingle();

      const next = Math.max(0, Number(current?.stock_grams ?? 0) + delta);

      const { error } = await supabase
        .from("product_inventory")
        .upsert({ product_id: productId, stock_grams: next }, { onConflict: "product_id" });
      if (error) throw error;

      await supabase.from("inventory_movements").insert({
        product_id: productId,
        delta_grams: delta,
        reason: delta > 0 ? "restock" : "manual",
        note: delta > 0 ? "Réapprovisionnement" : "Correction",
      });
    },
    onSuccess: () => invalidate(queryClient),
  });

  const setThreshold = useMutation({
    mutationFn: async ({ productId, grams }: { productId: string; grams: number }) => {
      const { error } = await supabase
        .from("product_inventory")
        .upsert(
          { product_id: productId, low_stock_threshold_g: grams },
          { onConflict: "product_id" }
        );
      if (error) throw error;
    },
    onSuccess: () => invalidate(queryClient),
  });

  const list = rows ?? [];
  const totalGrams = list.reduce((s, r) => s + r.stock_grams, 0);
  const lowStock = list.filter(
    (r) => r.stock_grams > 0 && r.stock_grams <= r.low_stock_threshold_g
  );
  const outOfStock = list.filter((r) => r.stock_grams <= 0);

  return {
    rows: list,
    movements: movements ?? [],
    isLoading,
    totalGrams,
    lowStock,
    outOfStock,
    setStock,
    adjustStock,
    setThreshold,
  };
};
