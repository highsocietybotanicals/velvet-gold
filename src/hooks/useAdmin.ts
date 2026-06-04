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
  payment_status: string;
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
  tracking_number: string | null;
  tracking_url: string | null;
  relay_point_name: string | null;
  relay_point_address: string | null;
  created_at: string;
  user_email?: string;
  promo_code?: string;
  promo_discount_percent?: number;
  promo_discount_amount?: number;
  order_items?: {
    id: string;
    product_id: string;
    product_name: string;
    product_type: string;
    weight: number | null;
    quantity: number | null;
    unit_price: number;
    total_price: number;
  }[];
}

export interface PendingReview {
  id: string;
  product_id: string;
  author_name: string;
  rating: number;
  comment: string;
  created_at: string;
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

      const userIds = [...new Set(ordersData.map(o => o.user_id).filter(Boolean))] as string[];
      let emailMap = new Map<string, string>();
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, email")
          .in("id", userIds);
        emailMap = new Map(profiles?.map(p => [p.id, p.email]) || []);
      }

      const orderIds = ordersData.map(o => o.id);
      const { data: promoData } = await supabase
        .from("promo_code_usage")
        .select("order_id, code, discount_percent, discount_amount")
        .in("order_id", orderIds);

      const promoMap = new Map(promoData?.map(p => [p.order_id, p]) || []);

      return ordersData.map(order => ({
        ...order,
        user_email: emailMap.get(order.user_id) || order.guest_email || "Email inconnu",
        promo_code: order.promo_code ?? promoMap.get(order.id)?.code ?? undefined,
        promo_discount_percent: order.promo_discount_percent ?? promoMap.get(order.id)?.discount_percent ?? undefined,
        promo_discount_amount: order.promo_discount_amount ?? promoMap.get(order.id)?.discount_amount ?? undefined,
      })) as AdminOrder[];
    },
    enabled: !!user && isAdmin,
  });

  // Pending reviews for moderation
  const { data: pendingReviews, isLoading: loadingPendingReviews } = useQuery({
    queryKey: ["admin", "pending-reviews"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("product_reviews")
        .select("id, product_id, author_name, rating, comment, created_at")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as PendingReview[];
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
      toast({ title: "Compte Pro validé ✅", description: "Le client a maintenant accès aux tarifs Pro." });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de valider le compte Pro.", variant: "destructive" });
    },
  });

  const rejectProMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("profiles")
        .update({ company_name: null, siret: null, is_pro_validated: false })
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "pro-requests"] });
      toast({ title: "Demande refusée", description: "La demande Pro a été supprimée." });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de refuser la demande.", variant: "destructive" });
    },
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
      if (error) throw error;
      if (status !== "pending") {
        supabase.functions.invoke("send-status-update-email", {
          body: { orderId, newStatus: status },
        }).catch((e) => console.error("Status email error:", e));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      toast({ title: "Statut mis à jour ✅", description: "Le client a été notifié par email." });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de mettre à jour le statut.", variant: "destructive" });
    },
  });

  const validateVatMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.from("profiles").update({ is_vat_validated: true }).eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "vat-requests"] });
      toast({ title: "TVA validée ✅", description: "Le client bénéficie maintenant des prix HT." });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de valider la TVA.", variant: "destructive" });
    },
  });

  const rejectVatMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.from("profiles").update({ vat_number: null, is_vat_validated: false }).eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "vat-requests"] });
      toast({ title: "TVA refusée", description: "Le numéro TVA a été supprimé." });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de refuser la TVA.", variant: "destructive" });
    },
  });

  // Approve a review
  const approveReviewMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      const { error } = await (supabase as any)
        .from("product_reviews")
        .update({ status: "approved" })
        .eq("id", reviewId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "pending-reviews"] });
      toast({ title: "Avis approuvé ✅" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible d'approuver l'avis.", variant: "destructive" });
    },
  });

  // Delete/reject a review
  const deleteReviewMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      const { error } = await (supabase as any)
        .from("product_reviews")
        .delete()
        .eq("id", reviewId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "pending-reviews"] });
      toast({ title: "Avis supprimé" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de supprimer l'avis.", variant: "destructive" });
    },
  });

  const updatePaymentStatusMutation = useMutation({
    mutationFn: async ({ orderId, paymentStatus }: { orderId: string; paymentStatus: string }) => {
      const { error } = await supabase.from("orders").update({ payment_status: paymentStatus }).eq("id", orderId);
      if (error) throw error;

      // If marking as paid, fetch fresh order data and send confirmation email
      if (paymentStatus === "paid") {
        const { data: freshOrder } = await supabase
          .from("orders")
          .select("guest_email, user_id")
          .eq("id", orderId)
          .single();

        let email = freshOrder?.guest_email;
        if (!email && freshOrder?.user_id) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("email")
            .eq("id", freshOrder.user_id)
            .single();
          email = profile?.email;
        }

        if (email) {
          supabase.functions.invoke("send-order-confirmation", {
            body: { orderId },
          }).catch((e) => console.error("Invoice email error:", e));
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      toast({ title: "Paiement mis à jour ✅" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de mettre à jour le paiement.", variant: "destructive" });
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      // Best-effort cleanup of dependent rows (no FK cascade defined)
      await supabase.from("order_items").delete().eq("order_id", orderId);
      await supabase.from("order_status_history" as any).delete().eq("order_id", orderId);
      await supabase.from("delivery_mileage" as any).delete().eq("order_id", orderId);
      await supabase.from("promo_code_usage" as any).delete().eq("order_id", orderId);
      const { error } = await supabase.from("orders").delete().eq("id", orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      toast({ title: "Commande supprimée 🗑️" });
    },
    onError: (e: any) => {
      toast({ title: "Erreur", description: e?.message || "Impossible de supprimer la commande.", variant: "destructive" });
    },
  });


  return {
    proRequests: proRequests || [],
    vatRequests: vatRequests || [],
    allOrders: allOrders || [],
    pendingReviews: pendingReviews || [],
    loadingProRequests,
    loadingVatRequests,
    loadingOrders,
    loadingPendingReviews,
    validatePro: (userId: string) => validateProMutation.mutate(userId),
    rejectPro: (userId: string) => rejectProMutation.mutate(userId),
    validateVat: (userId: string) => validateVatMutation.mutate(userId),
    rejectVat: (userId: string) => rejectVatMutation.mutate(userId),
    updateOrderStatus: (orderId: string, status: string) =>
      updateOrderStatusMutation.mutate({ orderId, status }),
    updatePaymentStatus: (orderId: string, paymentStatus: string) =>
      updatePaymentStatusMutation.mutate({ orderId, paymentStatus }),
    approveReview: (reviewId: string) => approveReviewMutation.mutate(reviewId),
    deleteReview: (reviewId: string) => deleteReviewMutation.mutate(reviewId),
    isValidating: validateProMutation.isPending,
    isRejecting: rejectProMutation.isPending,
    isValidatingVat: validateVatMutation.isPending,
    isRejectingVat: rejectVatMutation.isPending,
    isUpdatingOrder: updateOrderStatusMutation.isPending,
    isUpdatingPayment: updatePaymentStatusMutation.isPending,
    isApprovingReview: approveReviewMutation.isPending,
    isDeletingReview: deleteReviewMutation.isPending,
  };
};
