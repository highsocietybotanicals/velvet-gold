import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const db = supabase as any;
const BUCKET = "lab-reports";

export type LabReport = {
  id: string;
  product_id: string;
  label: string;
  storage_path: string;
  created_at: string;
};

/** Analyses laboratoire par produit (product_id -> liste de documents) */
export const useLabReports = () =>
  useQuery({
    queryKey: ["lab-reports"],
    queryFn: async () => {
      const { data, error } = await db
        .from("product_lab_reports")
        .select("id, product_id, label, storage_path, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const map: Record<string, LabReport[]> = {};
      (data ?? []).forEach((r: LabReport) => {
        (map[r.product_id] ??= []).push(r);
      });
      return map;
    },
    staleTime: 60_000,
  });

/** Ouvre une analyse laboratoire en un clic (lien signé temporaire) */
export const useOpenLabReport = () => {
  const { toast } = useToast();
  const [openingId, setOpeningId] = useState<string | null>(null);

  const open = async (busyKey: string, path: string) => {
    setOpeningId(busyKey);
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

/** Dépôt / suppression / renommage des analyses (admin) */
export const useLabReportAdmin = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["lab-reports"] });
    qc.invalidateQueries({ queryKey: ["db-products"] });
  };

  const slug = (s: string) =>
    s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "analyse";

  const upload = async (productId: string, files: File[]) => {
    setBusyId(productId);
    try {
      for (const file of files) {
        const base = file.name.replace(/\.pdf$/i, "");
        const path = `${productId}/${Date.now()}-${slug(base)}.pdf`;
        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, { upsert: true, contentType: file.type || "application/pdf" });
        if (upErr) throw upErr;
        const { error } = await db.from("product_lab_reports").insert({
          product_id: productId,
          label: base.slice(0, 120) || `Analyse ${new Date().toLocaleDateString("fr-FR")}`,
          storage_path: path,
        });
        if (error) throw error;
        await db.from("products").update({ lab_report_path: path }).eq("id", productId);
      }
      invalidate();
      toast({ title: files.length > 1 ? `${files.length} analyses ajoutées` : "Analyse laboratoire ajoutée" });
    } catch (e: any) {
      toast({ title: "Erreur", description: e?.message, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const rename = async (reportId: string, label: string) => {
    setBusyId(reportId);
    try {
      const { error } = await db
        .from("product_lab_reports")
        .update({ label: label.slice(0, 120) })
        .eq("id", reportId);
      if (error) throw error;
      invalidate();
    } catch (e: any) {
      toast({ title: "Erreur", description: e?.message, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (report: LabReport) => {
    setBusyId(report.id);
    try {
      await supabase.storage.from(BUCKET).remove([report.storage_path]);
      const { error } = await db.from("product_lab_reports").delete().eq("id", report.id);
      if (error) throw error;

      const { data: rest } = await db
        .from("product_lab_reports")
        .select("storage_path")
        .eq("product_id", report.product_id)
        .order("created_at", { ascending: false })
        .limit(1);
      await db
        .from("products")
        .update({ lab_report_path: rest?.[0]?.storage_path ?? null })
        .eq("id", report.product_id);

      invalidate();
      toast({ title: "Analyse supprimée" });
    } catch (e: any) {
      toast({ title: "Erreur", description: e?.message, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  return { upload, rename, remove, busyId };
};
