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

/** Tous les commerciaux (visible uniquement par les admins via RLS) */
export const useAllReps = (enabled = true) =>
  useQuery({
    queryKey: ["sales-reps"],
    enabled,
    queryFn: async () => {
      const { data, error } = await db.from("sales_reps").select("*").order("full_name");
      if (error) throw error;
      return (data ?? []) as SalesRep[];
    },
  });

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
    mutationFn: async (
      payload: Partial<Prospect> & {
        rep_id: string;
        business_name: string;
        email: string;
        siret?: string;
        vat_number?: string;
        legal_name?: string;
      }
    ) => {
      // siret / tva / raison sociale servent au compte pro, pas à la fiche prospect
      const { siret, vat_number, legal_name, ...prospectRow } = payload;
      const { error } = await db.from("sales_prospects").insert(prospectRow);
      if (error) throw error;

      // Création automatique du compte pro + envoi des identifiants par email
      const { data, error: fnError } = await supabase.functions.invoke("create-pro-account", {
        body: {
          email: payload.email,
          company_name: legal_name?.trim() || payload.business_name,
          full_name: payload.contact_name ?? "",
          phone: payload.phone ?? "",
          city: payload.city ?? "",
          postal_code: payload.postal_code ?? "",
          address: payload.address ?? "",
          siret: siret ?? "",
          vat_number: vat_number ?? "",
        },
      });

      if (fnError) return { accountError: fnError.message as string };
      return data as { alreadyExists?: boolean; created?: boolean; emailSent?: boolean };
    },
    onSuccess: (res: any) => {
      invalidate();
      if (res?.accountError) {
        toast({
          title: "Prospect ajouté",
          description: `Compte pro non créé : ${res.accountError}`,
          variant: "destructive",
        });
      } else if (res?.alreadyExists) {
        toast({ title: "Prospect ajouté", description: "Un compte existe déjà pour cet email." });
      } else if (res?.emailSent === false) {
        toast({
          title: "Prospect ajouté",
          description: "Compte pro créé, mais l'email d'identifiants n'a pas pu être envoyé.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Prospect ajouté",
          description: "Compte pro créé, identifiants envoyés par email.",
        });
      }
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

// ------------------------------------------------ paliers & bonus de CA

export interface CommissionTier {
  id?: string;
  min_revenue_ht: number;
  commission_percent: number;
}

/** Paliers par défaut si la table n'est pas lisible */
export const DEFAULT_TIERS: CommissionTier[] = [
  { min_revenue_ht: 0, commission_percent: 10 },
  { min_revenue_ht: 5000, commission_percent: 12 },
  { min_revenue_ht: 10000, commission_percent: 15 },
];

export const useCommissionTiers = () => {
  const query = useQuery({
    queryKey: ["sales-commission-tiers"],
    queryFn: async () => {
      const { data, error } = await db
        .from("sales_commission_tiers")
        .select("id, min_revenue_ht, commission_percent")
        .order("min_revenue_ht");
      if (error) throw error;
      const rows = (data ?? []).map((t: any) => ({
        id: t.id,
        min_revenue_ht: Number(t.min_revenue_ht),
        commission_percent: Number(t.commission_percent),
      })) as CommissionTier[];
      return rows.length ? rows : DEFAULT_TIERS;
    },
    staleTime: 5 * 60_000,
  });

  return { tiers: query.data ?? DEFAULT_TIERS, isLoading: query.isLoading };
};

/** Palier atteint pour un CA HT mensuel donné */
export const resolveTier = (tiers: CommissionTier[], revenueHT: number): CommissionTier => {
  const sorted = [...tiers].sort((a, b) => a.min_revenue_ht - b.min_revenue_ht);
  let current = sorted[0] ?? DEFAULT_TIERS[0];
  sorted.forEach((t) => {
    if (revenueHT >= t.min_revenue_ht) current = t;
  });
  return current;
};

/** Prochain palier (null si déjà au maximum) */
export const nextTier = (tiers: CommissionTier[], revenueHT: number): CommissionTier | null => {
  const sorted = [...tiers].sort((a, b) => a.min_revenue_ht - b.min_revenue_ht);
  return sorted.find((t) => t.min_revenue_ht > revenueHT) ?? null;
};

export interface MonthlyCommission {
  month: string;
  revenueHT: number;
  baseCommission: number;
  tierPercent: number;
  tierCommission: number;
  bonus: number;
  allPaid: boolean;
}

const r2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Commission calculée par barème progressif par tranche :
 * chaque palier ne s'applique qu'à la part de CA comprise entre
 * son seuil et le seuil du palier suivant.
 */
export const computeProgressiveCommission = (
  tiers: CommissionTier[],
  revenueHT: number
): number => {
  const sorted = [...tiers].sort((a, b) => a.min_revenue_ht - b.min_revenue_ht);
  let total = 0;
  for (let i = 0; i < sorted.length; i++) {
    const floor = sorted[i].min_revenue_ht;
    if (revenueHT <= floor) break;
    const ceiling =
      i + 1 < sorted.length ? sorted[i + 1].min_revenue_ht : Infinity;
    const taxable = Math.min(revenueHT, ceiling) - floor;
    if (taxable > 0) total += (taxable * sorted[i].commission_percent) / 100;
  }
  return r2(total);
};

/** Agrégation mois par mois avec barème progressif par tranche */
export const aggregateMonthly = (
  commissions: Commission[],
  tiers: CommissionTier[]
): MonthlyCommission[] => {
  const byMonth = new Map<string, Commission[]>();
  commissions.forEach((c) => {
    const key = String(c.period_month).slice(0, 7);
    byMonth.set(key, [...(byMonth.get(key) ?? []), c]);
  });

  return [...byMonth.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([month, list]) => {
      const revenueHT = r2(list.reduce((s, c) => s + Number(c.revenue_ht), 0));
      const baseCommission = r2(list.reduce((s, c) => s + Number(c.commission_amount), 0));
      const tierCommission = computeProgressiveCommission(tiers, revenueHT);
      const effectivePercent =
        revenueHT > 0 ? r2((tierCommission / revenueHT) * 100) : 0;
      return {
        month,
        revenueHT,
        baseCommission,
        tierPercent: effectivePercent,
        tierCommission,
        bonus: r2(Math.max(0, tierCommission - baseCommission)),
        allPaid: list.length > 0 && list.every((c) => c.status === "paid"),
      };
    });
};

export interface BonusPayout {
  id: string;
  rep_id: string;
  period_month: string;
  revenue_ht: number;
  tier_percent: number;
  bonus_amount: number;
  status: string;
  paid_at: string | null;
}

export const useBonusPayouts = (repId?: string) => {
  const qc = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ["sales-bonus-payouts", repId ?? "all"],
    queryFn: async () => {
      let q = db
        .from("sales_bonus_payouts")
        .select("*")
        .order("period_month", { ascending: false });
      if (repId) q = q.eq("rep_id", repId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as BonusPayout[];
    },
  });

  const markPaid = useMutation({
    mutationFn: async (row: {
      rep_id: string;
      period_month: string;
      revenue_ht: number;
      tier_percent: number;
      bonus_amount: number;
    }) => {
      const { error } = await db.from("sales_bonus_payouts").upsert(
        {
          ...row,
          period_month: `${row.period_month}-01`,
          status: "paid",
          paid_at: new Date().toISOString(),
        },
        { onConflict: "rep_id,period_month" }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales-bonus-payouts"] });
      toast({ title: "Bonus marqué comme versé" });
    },
    onError: (e: Error) =>
      toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  return { payouts: query.data ?? [], isLoading: query.isLoading, markPaid };
};
