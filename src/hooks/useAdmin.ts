import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface ProRequest {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  siret: string | null;
  vat_number: string | null;
  is_pro_validated: boolean;
  created_at: string;
}

export interface VatRequest {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  vat_number: string | null;
  is_vat_validated: boolean;
  created_at: string;
}

export interface AdminOrder {
  id: string;
  order_number: number;
  display_order_number: string | null;
  user_id: string;
  status: string;
  total_amount: number;
  total_flower_weight: number;
  delivery_type: string;
  delivery_address: string | null;
  delivery_date: string | null;
  delivery_time: string | null;
  contact_phone: string | null;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  created_at: string;
  user_email?: string;
  order_items?: {
    id: string;
    product_name: string;
    product_type: string;
    weight: number | null;
    quantity: number | null;
    unit_price: number;
    total_price: number;
  }[];
}

export const useAdmin = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: proRequests, isLoading: loadingProRequests } = useQuery({
    queryKey: ["admin", "pro-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, company_name, siret, vat_number, is_pro_validated, created_at")
        .not("siret", "is", null)
        .eq("is_pro_validated", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ProRequest[];
    },
    enabled: !!user && isAdmin,
  });

  const { data: vatRequests, isLoading: loadingVatRequests } = useQuery({
    queryKey: ["admin", "vat-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, company_name, vat_number, is_vat_validated, created_at")
        .eq("is_pro_validated", true)
        .not("vat_number", "is", null)
        .eq("is_vat_validated", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as VatRequest[];
    },
    enabled: !!user && isAdmin,
  });

  const { data: allOrders, isLoading: loadingOrders } = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: async () => {
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (*)
        `)
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      const userIds = [...new Set(ordersData.map(o => o.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email")
        .in("id", userIds);

      const emailMap = new Map(profiles?.map(p => [p.id, p.email]) || []);

      return ordersData.map(order => ({
        ...order,
        user_email: emailMap.get(order.user_id) || "Email inconnu",
      })) as AdminOrder[];
    },
    enabled: !!user && isAdmin,
  });

  const validateProMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ is_pro_validated: true })
        .eq("id", userId);

      if (profileError) throw profileError;

      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: "pro" });

      if (roleError && !roleError.message.includes("duplicate")) {
        throw roleError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "pro-requests"] });
      toast({
        title: "Compte Pro validé ✅",
        description: "Le client a maintenant accès aux tarifs Pro.",
      });
    },
    onError: (error) => {
      if (import.meta.env.DEV) console.error("Error validating pro:", error);
      toast({
        title: "Erreur",
        description: "Impossible de valider le compte Pro.",
        variant: "destructive",
      });
    },
  });

  const rejectProMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("profiles")
        .update({ 
          company_name: null, 
          siret: null,
          is_pro_validated: false 
        })
        .eq("id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "pro-requests"] });
      toast({
        title: "Demande refusée",
        description: "La demande Pro a été supprimée.",
      });
    },
    onError: (error) => {
      if (import.meta.env.DEV) console.error("Error rejecting pro:", error);
      toast({
        title: "Erreur",
        description: "Impossible de refuser la demande.",
        variant: "destructive",
      });
    },
  });

  // Update order status + send notification email
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const { error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", orderId);

      if (error) throw error;

      // Send status update email (fire-and-forget)
      // Skip email for "pending" status (initial state)
      if (status !== "pending") {
        supabase.functions.invoke("send-status-update-email", {
          body: { orderId, newStatus: status },
        }).catch((e) => console.error("Status email error:", e));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      toast({
        title: "Statut mis à jour ✅",
        description: "Le client a été notifié par email.",
      });
    },
    onError: (error) => {
      if (import.meta.env.DEV) console.error("Error updating order status:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut.",
        variant: "destructive",
      });
    },
  });

  const validateVatMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("profiles")
        .update({ is_vat_validated: true })
        .eq("id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "vat-requests"] });
      toast({
        title: "TVA validée ✅",
        description: "Le client bénéficie maintenant des prix HT.",
      });
    },
    onError: (error) => {
      if (import.meta.env.DEV) console.error("Error validating VAT:", error);
      toast({
        title: "Erreur",
        description: "Impossible de valider la TVA.",
        variant: "destructive",
      });
    },
  });

  const rejectVatMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("profiles")
        .update({ 
          vat_number: null, 
          is_vat_validated: false 
        })
        .eq("id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "vat-requests"] });
      toast({
        title: "TVA refusée",
        description: "Le numéro TVA a été supprimé.",
      });
    },
    onError: (error) => {
      if (import.meta.env.DEV) console.error("Error rejecting VAT:", error);
      toast({
        title: "Erreur",
        description: "Impossible de refuser la TVA.",
        variant: "destructive",
      });
    },
  });

  return {
    proRequests: proRequests || [],
    vatRequests: vatRequests || [],
    allOrders: allOrders || [],
    loadingProRequests,
    loadingVatRequests,
    loadingOrders,
    validatePro: (userId: string) => validateProMutation.mutate(userId),
    rejectPro: (userId: string) => rejectProMutation.mutate(userId),
    validateVat: (userId: string) => validateVatMutation.mutate(userId),
    rejectVat: (userId: string) => rejectVatMutation.mutate(userId),
    updateOrderStatus: (orderId: string, status: string) => 
      updateOrderStatusMutation.mutate({ orderId, status }),
    isValidating: validateProMutation.isPending,
    isRejecting: rejectProMutation.isPending,
    isValidatingVat: validateVatMutation.isPending,
    isRejectingVat: rejectVatMutation.isPending,
    isUpdatingOrder: updateOrderStatusMutation.isPending,
  };
};
