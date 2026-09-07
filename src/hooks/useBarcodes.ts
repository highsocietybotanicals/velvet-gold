import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { buildEan13 } from "@/lib/barcode";
import { PRO_FORMATS } from "@/lib/proPricing";

const db = supabase as any;

export type BarcodeMap = Record<string, Record<string, string>>;

/** clé de poids normalisée (2.5 -> "2.5") */
export const wKey = (w: number) => String(w);

/** Tous les codes-barres : map[productId][poids] = EAN-13 */
export const useBarcodes = () =>
  useQuery({
    queryKey: ["product-barcodes"],
    queryFn: async () => {
      const { data, error } = await db
        .from("product_barcodes")
        .select("product_id, weight_grams, ean13");
      if (error) throw error;
      const map: BarcodeMap = {};
      (data ?? []).forEach((r: any) => {
        (map[r.product_id] ??= {})[wKey(Number(r.weight_grams))] = r.ean13;
      });
      return map;
    },
    staleTime: 5 * 60_000,
  });

/**
 * Génère en base les codes manquants pour les produits donnés (1 / 2,5 / 5 / 10 g),
 * à partir du numéro interne fixe de chaque variété.
 */
export const useEnsureBarcodes = (productIds: string[], enabled = true) => {
  const qc = useQueryClient();
  const { data: barcodes, isLoading } = useBarcodes();

  useEffect(() => {
    if (!enabled || isLoading || !barcodes || productIds.length === 0) return;

    const missing = productIds.filter((id) =>
      PRO_FORMATS.some((f) => !barcodes[id]?.[wKey(f)])
    );
    if (missing.length === 0) return;

    let cancelled = false;
    (async () => {
      const { data: prods, error } = await db
        .from("products")
        .select("id, barcode_seq")
        .in("id", missing);
      if (error || cancelled) return;

      const rows: { product_id: string; weight_grams: number; ean13: string }[] = [];
      (prods ?? []).forEach((p: any) => {
        if (!p.barcode_seq) return;
        PRO_FORMATS.forEach((f) => {
          if (barcodes[p.id]?.[wKey(f)]) return;
          rows.push({
            product_id: p.id,
            weight_grams: f,
            ean13: buildEan13(Number(p.barcode_seq), f),
          });
        });
      });
      if (rows.length === 0 || cancelled) return;

      await db.from("product_barcodes").upsert(rows, {
        onConflict: "product_id,weight_grams",
        ignoreDuplicates: true,
      });
      if (!cancelled) qc.invalidateQueries({ queryKey: ["product-barcodes"] });
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, isLoading, barcodes, productIds.join(","), qc]);

  return { barcodes: barcodes ?? {}, isLoading };
};
