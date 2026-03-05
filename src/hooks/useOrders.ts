import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_type: string;
  weight: number | null;
  quantity: number | null;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  order_number: number;
  status: string;
  total_amount: number;
  total_flower_weight: number;
  delivery_type: string;
  delivery_address: string | null;
  delivery_date: string | null;
  delivery_time: string | null;
  contact_phone: string | null;
  viva_order_code: string | null;
  payment_status: string;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}

export const ORDER_STATUS = {
  pending: { label: "En attente", color: "text-muted-foreground" },
  preparing: { label: "En préparation", color: "text-amber-500" },
  shipped: { label: "Expédiée", color: "text-blue-500" },
  in_delivery: { label: "En livraison", color: "text-purple-500" },
  delivered: { label: "Livrée", color: "text-green-500" },
  cancelled: { label: "Annulée", color: "text-destructive" },
} as const;

export const useOrders = () => {
  const { user } = useAuth();

  const { data: orders, isLoading, refetch } = useQuery({
    queryKey: ["orders", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (*)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Order[];
    },
    enabled: !!user?.id,
  });

  // Commande en cours (dernière non livrée/annulée)
  const currentOrder = orders?.find(
    (o) => !["delivered", "cancelled"].includes(o.status)
  );

  // Historique (commandes livrées ou annulées)
  const orderHistory = orders?.filter((o) =>
    ["delivered", "cancelled"].includes(o.status)
  );

  return {
    orders,
    currentOrder,
    orderHistory,
    isLoading,
    refetch,
  };
};
