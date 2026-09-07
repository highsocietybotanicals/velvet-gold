import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const db = supabase as any;
const BUCKET = "lab-reports";

/** Chemins des analyses laboratoire par produit (product_id -> chemin fichier) */
export const useLabReportPaths = () =>
  useQuery({
    queryKey: ["lab-reports"],
    queryFn: async () => {
      const { data, error } = await db.from("products").select("id, lab_report_path");
      if (error) throw error;
      const map: Record<string, string> = {};
      (data ?? []).forEach((r: any) => {
        if (r.lab_report_path) map[r.id] = r.lab_report_path;
      });
      return map;
    },
    staleTime: 60_000,
  });

/** Ouvre l'analyse laboratoire d'un produit en un clic (lien signé temporaire) */
export const useOpenLabReport = () => {
  const { toast } = useToast();
  const [openingId, setOpeningId] = useState<string | null>(null);

  const open = async (productId: string, path: string) => {
    setOpeningId(productId);
    try {
      const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 300);
      if (error || !data?.signedUrl) throw error ?? new Error("Lien indisponible");
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      toast({
        title: "Analyse indisponible",
        description: e?.message ?? "Impossible d'ouvrir le document.",
        variant: "destructive",
      });
    } finally {
      setOpeningId(null);
    }
  };

  return { open, openingId };
};

/** Dépôt / suppression des analyses (admin) */
export const useLabReportAdmin = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["lab-reports"] });
    qc.invalidateQueries({ queryKey: ["db-products"] });
  };

  const upload = async (productId: string, file: File) => {
    setBusyId(productId);
    try {
      const path = `${productId}/analyse-${Date.now()}.pdf`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type || "application/pdf" });
      if (upErr) throw upErr;
      const { error } = await db.from("products").update({ lab_report_path: path }).eq("id", productId);
      if (error) throw error;
      invalidate();
      toast({ title: "Analyse laboratoire ajoutée" });
    } catch (e: any) {
      toast({ title: "Erreur", description: e?.message, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (productId: string, path: string) => {
    setBusyId(productId);
    try {
      await supabase.storage.from(BUCKET).remove([path]);
      const { error } = await db.from("products").update({ lab_report_path: null }).eq("id", productId);
      if (error) throw error;
      invalidate();
      toast({ title: "Analyse supprimée" });
    } catch (e: any) {
      toast({ title: "Erreur", description: e?.message, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  return { upload, remove, busyId };
};
