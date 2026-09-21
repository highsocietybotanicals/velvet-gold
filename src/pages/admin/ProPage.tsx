import ProRequestsSection from "@/components/admin/ProRequestsSection";
import ProInvoicingManager from "@/components/admin/ProInvoicingManager";
import { Button } from "@/components/ui/button";
import { Printer, FileText } from "lucide-react";
import { useCatalogProducts } from "@/hooks/useCatalogProducts";
import { useProPriceTiers } from "@/hooks/useProPriceTiers";
import { downloadProOrderForm, downloadProClientForm } from "@/lib/proFormsPdf";
import { getGammeForProduct, getProPricePerGram } from "@/lib/margin";
import { useToast } from "@/hooks/use-toast";

const ProPage = () => {
  const { toast } = useToast();
  const { all: products } = useCatalogProducts();
  const { tiers } = useProPriceTiers();

  const handleOrderForm = () => {
    const formProducts = products.map((p) => {
      const basePrice = getProPricePerGram(tiers, getGammeForProduct(p.id), 50) ?? 0;
      return {
        id: p.id,
        name: p.name,
        pricePerGram: basePrice,
        isOutOfStock: p.isOutOfStock,
      };
    });
    downloadProOrderForm(formProducts);
    toast({ title: "Bon de commande téléchargé" });
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold gold-text">Pro & Facturation</h1>

      <div className="flex gap-3 flex-wrap">
        <Button variant="outline" size="sm" onClick={handleOrderForm}>
          <Printer className="h-4 w-4 mr-2" /> Bon de commande papier
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            downloadProClientForm();
            toast({ title: "Fiche client téléchargée" });
          }}
        >
          <FileText className="h-4 w-4 mr-2" /> Fiche nouveau client pro
        </Button>
      </div>

      <ProRequestsSection />
      <ProInvoicingManager />
    </div>
  );
};

export default ProPage;
