import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface ProductPrice {
  id: string;
  name: string;
  category: "fleur" | "resine";
  price: number;
  pro_price: number | null;
  is_active: boolean;
}

export const useProducts = () => {
  const { data: prices, isLoading } = useQuery({
    queryKey: ["products-prices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("category", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;
      return data as ProductPrice[];
    },
  });

  return {
    prices: prices || [],
    isLoading,
    getPrice: (productId: string) => prices?.find((p) => p.id === productId),
  };
};

export const useAdminProducts = () => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("category", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;
      return data as ProductPrice[];
    },
    enabled: isAdmin,
  });

  const updatePriceMutation = useMutation({
    mutationFn: async ({
      productId,
      price,
      proPrice,
    }: {
      productId: string;
      price: number;
      proPrice: number | null;
    }) => {
      const { error } = await supabase
        .from("products")
        .update({ price, pro_price: proPrice })
        .eq("id", productId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["products-prices"] });
      toast({
        title: "Prix mis à jour ✅",
        description: "Les modifications ont été enregistrées.",
      });
    },
    onError: (error) => {
      console.error("Error updating price:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le prix.",
        variant: "destructive",
      });
    },
  });

  const toggleProductMutation = useMutation({
    mutationFn: async ({
      productId,
      isActive,
    }: {
      productId: string;
      isActive: boolean;
    }) => {
      const { error } = await supabase
        .from("products")
        .update({ is_active: isActive })
        .eq("id", productId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["products-prices"] });
      toast({
        title: "Produit mis à jour",
        description: "La visibilité du produit a été modifiée.",
      });
    },
    onError: (error) => {
      console.error("Error toggling product:", error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier le produit.",
        variant: "destructive",
      });
    },
  });

  return {
    products: products || [],
    isLoading,
    updatePrice: (productId: string, price: number, proPrice: number | null) =>
      updatePriceMutation.mutate({ productId, price, proPrice }),
    toggleProduct: (productId: string, isActive: boolean) =>
      toggleProductMutation.mutate({ productId, isActive }),
    isUpdating: updatePriceMutation.isPending,
    isToggling: toggleProductMutation.isPending,
  };
};
