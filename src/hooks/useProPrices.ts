import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ProPrice {
  product_id: string;
  pro_price: number;
}

export const useProPrices = () => {
  const { isPro, isProValidated } = useAuth();
  const shouldFetch = isPro && isProValidated;

  const { data: proPrices, isLoading } = useQuery({
    queryKey: ["pro-prices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pro_prices")
        .select("product_id, pro_price");

      if (error) throw error;

      // Create a map for easy lookup
      const priceMap: Record<string, number> = {};
      (data as ProPrice[]).forEach((item) => {
        priceMap[item.product_id] = item.pro_price;
      });

      return priceMap;
    },
    enabled: shouldFetch,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const getProPrice = (productId: string): number | null => {
    if (!shouldFetch || !proPrices) return null;
    return proPrices[productId] ?? null;
  };

  return {
    proPrices: proPrices ?? {},
    getProPrice,
    isLoading,
    isProActive: shouldFetch,
  };
};
