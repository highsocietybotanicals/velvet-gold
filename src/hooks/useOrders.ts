import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
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

export interface StatusHistoryEntry {
  id: string;
  order_id: string;
  old_status: string | null;
  new_status: string;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  order_number: number;
  display_order_number: string | null;
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
  status_history?: StatusHistoryEntry[];
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
  const queryClient = useQueryClient();

  const { data: orders, isLoading, refetch } = useQuery({
    queryKey: ["orders", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // Fetch orders with items
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (*)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      const ordersList = data as Order[];
      
      // Fetch status history for all orders separately (table not in generated types)
      if (ordersList.length > 0) {
        const orderIds = ordersList.map(o => o.id);
        const { data: historyData } = await supabase
          .from("order_status_history" as any)
          .select("id, order_id, old_status, new_status, created_at")
          .in("order_id", orderIds)
          .order("created_at", { ascending: true });
        
        const historyMap = new Map<string, StatusHistoryEntry[]>();
        if (historyData) {
          for (const h of historyData as any[]) {
            const list = historyMap.get(h.order_id) || [];
            list.push(h as StatusHistoryEntry);
            historyMap.set(h.order_id, list);
          }
        }
        
        for (const order of ordersList) {
          order.status_history = historyMap.get(order.id) || [];
        }
      }
      
      return ordersList;
    },
    enabled: !!user?.id,
  });

  // Poll for order status changes every 30 seconds
  useEffect(() => {
    if (!user?.id) return;

    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["orders", user.id] });
    }, 30000);

    return () => clearInterval(interval);
  }, [user?.id, queryClient]);

  // Only show paid orders
  const paidOrders = orders?.filter((o) => o.payment_status !== "unpaid");

  // Commande en cours (dernière non livrée/annulée, payée)
  const currentOrder = paidOrders?.find(
    (o) => !["delivered", "cancelled"].includes(o.status)
  );

  // Historique (commandes livrées ou annulées, payées)
  const orderHistory = paidOrders?.filter((o) =>
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
