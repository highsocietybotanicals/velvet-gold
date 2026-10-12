import { Loader2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatGrams, generateProductLabel, unitWeight } from "@/lib/labelPdf";
import { toast } from "sonner";
import { useState } from "react";
import { notifyLabelResult, useLabelResolver } from "@/components/admin/labelResolver";

interface MolecularLabelProps {
  productId: string;
  productName: string;
  /** Poids de la ligne (TOTAL de la ligne quand quantity > 1) */
  weight: number | null;
  /** Nombre de sachets de la ligne : une étiquette par sachet */
  quantity?: number | null;
  productType?: string | null;
}

/** Étiquettes 10×15 d'une ligne : une page par sachet, au poids unitaire */
export function MolecularLabel({ productId, productName, weight, quantity, productType }: MolecularLabelProps) {
  const [loading, setLoading] = useState(false);
  const { unitsFor, resolve } = useLabelResolver();

  const item = { product_id: productId, product_name: productName, product_type: productType, weight, quantity };
  const count = unitsFor(item);
  if (count === 0) return null;
  const unit = unitWeight(Number(weight), quantity);

  const handleClick = async () => {
    setLoading(true);
    try {
      const resolved = await resolve([item]);
      const line = resolved.lines[0];
      if (!line) throw new Error("Aucune étiquette pour ce produit");
      const result = await generateProductLabel(line);
      notifyLabelResult(result, resolved);
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors de la génération de l'étiquette", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={loading}
      title={`${count} × ${formatGrams(unit)} — étiquette 10×15 (PDF)`}
      className="gap-1 text-xs border-amber-600/50 text-amber-400 hover:bg-amber-600/10"
    >
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Tag className="h-3 w-3" />}
      {loading ? "..." : count > 1 ? `${count} étiquettes 10×15` : "Étiquette 10×15"}
    </Button>
  );
}
