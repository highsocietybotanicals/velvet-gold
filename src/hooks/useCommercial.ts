import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface SalesRep {
  id: string;
  user_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  zone: string | null;
  commission_percent: number;
  is_active: boolean;
  notes: string | null;
}

export interface Prospect {
  id: string;
  rep_id: string;
  business_name: string;
  city: string | null;
  postal_code: string | null;
  address: string | null;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  status: ProspectStatus;
  next_followup: string | null;
  notes: string | null;
  created_at: string;
}

export type ProspectStatus =
  | "a_visiter"
  | "visite"
  | "echantillon"
  | "negociation"
  | "signe"
  | "refuse";

export const PROSPECT_STATUSES: { value: ProspectStatus; label: string }[] = [
  { value: "a_visiter", label: "À visiter" },
  { value: "visite", label: "Visité" },
  { value: "echantillon", label: "Échantillon remis" },
  { value: "negociation", label: "En négociation" },
  { value: "signe", label: "Signé" },
  { value: "refuse", label: "Refusé" },
];

export const prospectStatusLabel = (s: string) =>
  PROSPECT_STATUSES.find((p) => p.value === s)?.label ?? s;

export interface Commission {
  id: string;
  rep_id: string;
  order_id: string | null;
  client_label: string;
  period_month: string;
  revenue_ht: number;
  commission_percent: number;
  commission_amount: number;
  status: string;
  paid_at: string | null;
  notes: string | null;
}

const db = supabase as any;

/** Fiche du commercial connecté (null si l'utilisateur n'est pas commercial) */
export const useMyRep = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["sales-rep", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await db
        .from("sales_reps")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return (data as SalesRep) ?? null;
    },
  });
};

export const useProspects = (repId?: string) => {
  const qc = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ["sales-prospects", repId ?? "all"],
    queryFn: async () => {
      let q = db.from("sales_prospects").select("*").order("created_at", { ascending: false });
      if (repId) q = q.eq("rep_id", repId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Prospect[];
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["sales-prospects"] });

  const createProspect = useMutation({
    mutationFn: async (payload: Partial<Prospect> & { rep_id: string; business_name: string }) => {
      const { error } = await db.from("sales_prospects").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Prospect ajouté" });
    },
    onError: (e: Error) =>
      toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const updateProspect = useMutation({
    mutationFn: async ({ id, ...patch }: Partial<Prospect> & { id: string }) => {
      const { error } = await db.from("sales_prospects").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
    onError: (e: Error) =>
      toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const deleteProspect = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("sales_prospects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Prospect supprimé" });
    },
  });

  return {
    prospects: query.data ?? [],
    isLoading: query.isLoading,
    createProspect,
    updateProspect,
    deleteProspect,
  };
};

export const useCommissions = (repId?: string) => {
  const query = useQuery({
    queryKey: ["sales-commissions", repId ?? "all"],
    queryFn: async () => {
      let q = db.from("sales_commissions").select("*").order("period_month", { ascending: false });
      if (repId) q = q.eq("rep_id", repId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Commission[];
    },
  });

  return { commissions: query.data ?? [], isLoading: query.isLoading };
};
