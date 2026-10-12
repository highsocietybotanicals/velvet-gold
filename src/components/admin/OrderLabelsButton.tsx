import { useState } from "react";
import { Loader2, Tags } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { generateLabelBatch, orderLabelsFileName } from "@/lib/labelPdf";
import { notifyLabelResult, useLabelResolver, type LabelItem } from "@/components/admin/labelResolver";

interface OrderLabelsButtonProps {
  items: LabelItem[] | undefined;
  /** Numéro affiché de la commande (HSB-833204) : sert au nom du fichier */
  orderNumber: string;
}

/** Un seul PDF pour toute la commande : une page 10×15 par sachet, dans l'ordre des lignes */
export function OrderLabelsButton({ items, orderNumber }: OrderLabelsButtonProps) {
  const [loading, setLoading] = useState(false);
  const { unitsFor, resolve, ready } = useLabelResolver();

  const list = items ?? [];
  const total = list.reduce((sum, item) => sum + unitsFor(item), 0);

  const handleClick = async () => {
    setLoading(true);
    try {
      const resolved = await resolve(list);
      if (resolved.lines.length === 0) {
        toast.error("Aucune étiquette à imprimer pour cette commande");
        return;
      }
      const result = await generateLabelBatch(resolved.lines, orderLabelsFileName(orderNumber));
      notifyLabelResult(result, resolved);
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors de la génération des étiquettes", {
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
      disabled={loading || !ready || total === 0}
      title="Toutes les étiquettes de la commande (PDF) : une page 10×15 par sachet"
      className="gap-1 text-xs border-amber-600/50 text-amber-400 hover:bg-amber-600/10"
    >
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Tags className="h-3 w-3" />}
      {loading ? "Génération…" : `Étiquettes (${total})`}
    </Button>
  );
}
