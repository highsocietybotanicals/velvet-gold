import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DbProduct {
  id: string;
  name: string;
  category: "fleur" | "resine";
  subtitle: string | null;
  badge: string | null;
  description: string | null;
  price: number;
  cbd_percentage: string | null;
  image_url: string | null;
  price_group: "A" | "B";
  is_force_noire: boolean;
  mood: string | null;
  intention_match: string[];
  taste_match: string[];
  terpenes: { boise: number; fruite: number; epice: number; terreux: number };
  is_active: boolean;
  display_order: number;
}

export const useDbProducts = () => {
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ["admin", "db-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("display_order", { ascending: true })
        .order("name", { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as DbProduct[];
    },
  });

  const upsertProduct = useMutation({
    mutationFn: async (product: Partial<DbProduct> & { id: string }) => {
      const { error } = await supabase.from("products").upsert(product as any, { onConflict: "id" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "db-products"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["products-prices"] });
      queryClient.invalidateQueries({ queryKey: ["catalog-db-extras"] });
    },
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "db-products"] });
      queryClient.invalidateQueries({ queryKey: ["catalog-db-extras"] });
    },
  });

  return { products: products || [], isLoading, upsertProduct, deleteProduct };
};
