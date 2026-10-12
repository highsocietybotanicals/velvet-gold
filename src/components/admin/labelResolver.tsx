import { toast } from "sonner";
import { useBarcodes, wKey } from "@/hooks/useBarcodes";
import { useProductLabelPaths, signedLabelUrl } from "@/hooks/useProductLabels";
import {
  formatGrams,
  labelUnitsForLine,
  unitWeight,
  type LabelBatchResult,
  type LabelLine,
} from "@/lib/labelPdf";

/** Ligne de commande telle que lue dans order_items */
export interface LabelItem {
  product_id: string;
  product_name: string;
  product_type?: string | null;
  weight: number | null;
  quantity?: number | null;
}

export interface ResolvedLines {
  lines: LabelLine[];
  /** Lignes produit (avec poids) sans aucune étiquette : à signaler */
  skippedProducts: string[];
  /** Cadeaux / accessoires : jamais d'étiquette produit */
  skippedOthers: number;
  /** Lignes dont le poids unitaire n'a pas de code-barres en base */
  noBarcode: string[];
}

/**
 * Accès partagé aux étiquettes importées et aux codes-barres (cache react-query
 * commun à tous les boutons de la page) + préparation des lignes à imprimer.
 */
export function useLabelResolver() {
  const barcodesQuery = useBarcodes();
  const pathsQuery = useProductLabelPaths();

  const unitsFor = (item: LabelItem) =>
    labelUnitsForLine(
      { productId: item.product_id, weight: item.weight, quantity: item.quantity },
      !!pathsQuery.data?.[item.product_id],
    );

  const resolve = async (items: LabelItem[]): Promise<ResolvedLines> => {
    // Sans la liste des étiquettes importées, on imprimerait l'ancien visuel : on s'arrête.
    const paths = pathsQuery.data ?? (await pathsQuery.refetch()).data;
    if (!paths) throw new Error("Impossible de charger les étiquettes importées. Réessayez.");
    const barcodes = barcodesQuery.data ?? (await barcodesQuery.refetch()).data;
    if (!barcodes) throw new Error("Impossible de charger les codes-barres. Réessayez.");

    const signed = new Map<string, string>();
    const out: ResolvedLines = { lines: [], skippedProducts: [], skippedOthers: 0, noBarcode: [] };

    for (const item of items) {
      const customPath = paths[item.product_id];
      const units = labelUnitsForLine(
        { productId: item.product_id, weight: item.weight, quantity: item.quantity },
        !!customPath,
      );
      if (units === 0) {
        const isProduct =
          item.weight != null && Number(item.weight) > 0 &&
          item.product_type !== "gift" && item.product_type !== "accessory";
        if (isProduct) out.skippedProducts.push(item.product_name);
        else out.skippedOthers += 1;
        continue;
      }

      let customLabelUrl: string | null = null;
      if (customPath) {
        customLabelUrl = signed.get(customPath) ?? null;
        if (!customLabelUrl) {
          try {
            customLabelUrl = await signedLabelUrl(customPath);
          } catch (e) {
            console.error(e);
            throw new Error(`Étiquette importée de « ${item.product_name} » inaccessible. Réessayez.`);
          }
          signed.set(customPath, customLabelUrl);
        }
      }

      const weight = Number(item.weight);
      const unit = unitWeight(weight, item.quantity);
      const ean13 = barcodes[item.product_id]?.[wKey(unit)] ?? null;
      const isPdf = !!customPath?.toLowerCase().endsWith(".pdf");
      if (!ean13 && !isPdf) out.noBarcode.push(`${item.product_name} (${formatGrams(unit)})`);

      out.lines.push({
        productId: item.product_id,
        productName: item.product_name,
        weight,
        quantity: item.quantity,
        ean13,
        customLabelUrl,
        customLabelIsPdf: isPdf,
      });
    }
    return out;
  };

  return { unitsFor, resolve, ready: !pathsQuery.isLoading };
}

const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;

/** Compte rendu après génération : ce qui est dans le PDF, à part, ignoré */
export function notifyLabelResult(result: LabelBatchResult, resolved: ResolvedLines) {
  const notes: string[] = [];
  for (const p of result.separatePdfs) {
    notes.push(
      p.ok
        ? `${p.productName} : étiquette importée en PDF, téléchargée à part. À imprimer ${plural(p.count, "fois", "fois")} (${formatGrams(p.weight)}).`
        : `${p.productName} : échec du téléchargement de l'étiquette PDF importée.`,
    );
  }
  if (result.separatePdfs.length > 1) {
    notes.push("Si le navigateur le demande, autorisez les téléchargements multiples.");
  }
  if (resolved.noBarcode.length) notes.push(`Sans code-barres pour ce poids : ${resolved.noBarcode.join(", ")}.`);
  if (resolved.skippedProducts.length) notes.push(`Aucune étiquette, ligne ignorée : ${resolved.skippedProducts.join(", ")}.`);
  if (resolved.skippedOthers) {
    notes.push(`${plural(resolved.skippedOthers, "cadeau ou accessoire", "cadeaux ou accessoires")} sans étiquette produit.`);
  }

  const description = notes.length ? (
    <div className="space-y-1">
      {notes.map((n, i) => <p key={i}>{n}</p>)}
    </div>
  ) : undefined;

  const downloaded = result.separatePdfs.filter((p) => p.ok).length;
  const failed = result.separatePdfs.length - downloaded;

  // Rien n'a été téléchargé du tout : c'est un échec, pas un avertissement
  if (result.pages === 0 && downloaded === 0) {
    toast.error(
      failed > 1
        ? "Échec du téléchargement des étiquettes importées"
        : "Échec du téléchargement de l'étiquette importée",
      { description, duration: 12000 },
    );
    return;
  }

  const title = result.pages > 0
    ? `${plural(result.pages, "étiquette", "étiquettes")} dans le PDF`
    : downloaded > 1
      ? `${downloaded} étiquettes importées téléchargées`
      : "Étiquette importée téléchargée";

  if (failed > 0) toast.warning(title, { description, duration: 12000 });
  else toast.success(title, { description, duration: notes.length ? 10000 : 4000 });
}
