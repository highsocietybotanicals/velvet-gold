import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { kitStatusFromOrders, type ProOrderLite } from "@/lib/proOffer";

/** Kit découverte encore disponible / à déduire, d'après les commandes pro du partenaire */
export const useProKitStatus = () => {
  const { user, isAdmin, isCommercial } = useAuth();
  const isStaff = isAdmin || isCommercial;

  const { data, isLoading } = useQuery({
    queryKey: ["pro-kit-status", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("orders")
        .select("created_at, status, promo_code")
        .eq("user_id", user!.id)
        .eq("order_channel", "pro");
      if (error) throw error;
      return (data ?? []) as ProOrderLite[];
    },
  });

  const status = kitStatusFromOrders(data ?? []);
  return {
    isStaff,
    isLoading,
    // L'équipe (admin, commerciaux) n'est soumise ni au minimum ni au kit
    kitAvailable: !isStaff && !isLoading && status.kitAvailable,
    deductionAvailable: !isStaff && status.deductionAvailable,
  };
};
