import { Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateProductLabel, SUPPORTED_LABEL_IDS } from "@/lib/labelPdf";
import { toast } from "sonner";
import { useState } from "react";

interface MolecularLabelProps {
  productId: string;
  productName: string;
  weight: number | null;
}

export function MolecularLabel({ productId, productName, weight }: MolecularLabelProps) {
  const [loading, setLoading] = useState(false);

  if (!SUPPORTED_LABEL_IDS.includes(productId) || !weight) return null;

  const handleClick = async () => {
    setLoading(true);
    try {
      await generateProductLabel({ productName, weight, productId });
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors de la génération de l'étiquette");
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
      className="gap-1 text-xs border-amber-600/50 text-amber-400 hover:bg-amber-600/10"
    >
      <Tag className="h-3 w-3" />
      {loading ? "..." : "Étiquette 10×15"}
    </Button>
  );
}
