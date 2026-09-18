import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const db = supabase as any;
export const LABELS_BUCKET = "product-labels";

export const MAX_LABEL_SIZE = 10 * 1024 * 1024;
export const ACCEPTED_LABEL_TYPES = ["image/png", "image/jpeg", "application/pdf"];

/** Étiquettes importées : product_id -> chemin de stockage */
export const useProductLabelPaths = () =>
  useQuery({
    queryKey: ["product-labels"],
    queryFn: async () => {
      const { data, error } = await db
        .from("products")
        .select("id, label_image_path")
        .not("label_image_path", "is", null);
      if (error) throw error;
      const map: Record<string, string> = {};
      (data ?? []).forEach((p: { id: string; label_image_path: string | null }) => {
        if (p.label_image_path) map[p.id] = p.label_image_path;
      });
      return map;
    },
    staleTime: 60_000,
  });

/** Lien signé temporaire vers une étiquette importée */
export const signedLabelUrl = async (path: string): Promise<string> => {
  const { data, error } = await supabase.storage.from(LABELS_BUCKET).createSignedUrl(path, 300);
  if (error || !data?.signedUrl) throw error ?? new Error("Étiquette indisponible");
  return data.signedUrl;
};

/** Import / suppression des étiquettes imprimables (admin) */
export const useProductLabelAdmin = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["product-labels"] });
    qc.invalidateQueries({ queryKey: ["admin", "db-products"] });
  };

  const upload = async (productId: string, file: File) => {
    if (!ACCEPTED_LABEL_TYPES.includes(file.type)) {
      toast({
        title: "Format non accepté",
        description: "Choisissez une image PNG ou JPEG, ou un PDF.",
        variant: "destructive",
      });
      return;
    }
    if (file.size > MAX_LABEL_SIZE) {
      toast({ title: "Fichier trop lourd", description: "Maximum 10 Mo.", variant: "destructive" });
      return;
    }

    setBusyId(productId);
    try {
      const ext = file.type === "application/pdf" ? "pdf" : file.type === "image/png" ? "png" : "jpg";
      const path = `${productId}/${Date.now()}-etiquette.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(LABELS_BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;

      const { data: previous } = await db
        .from("products")
        .select("label_image_path")
        .eq("id", productId)
        .maybeSingle();

      const { error } = await db.from("products").update({ label_image_path: path }).eq("id", productId);
      if (error) throw error;

      const old = previous?.label_image_path;
      if (old && old !== path) await supabase.storage.from(LABELS_BUCKET).remove([old]);

      invalidate();
      toast({ title: "Étiquette importée" });
    } catch (e: any) {
      toast({ title: "Erreur", description: e?.message, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (productId: string, path: string) => {
    setBusyId(productId);
    try {
      await supabase.storage.from(LABELS_BUCKET).remove([path]);
      const { error } = await db.from("products").update({ label_image_path: null }).eq("id", productId);
      if (error) throw error;
      invalidate();
      toast({ title: "Étiquette supprimée" });
    } catch (e: any) {
      toast({ title: "Erreur", description: e?.message, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  return { upload, remove, busyId };
};
