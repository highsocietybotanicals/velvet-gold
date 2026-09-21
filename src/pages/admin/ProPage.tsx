import ProRequestsSection from "@/components/admin/ProRequestsSection";
import ProInvoicingManager from "@/components/admin/ProInvoicingManager";
import { Button } from "@/components/ui/button";
import { Printer, FileText, Landmark, FileDown, Loader2 } from "lucide-react";
import { useState } from "react";
import { useCatalogProducts } from "@/hooks/useCatalogProducts";
import { useProPriceTiers } from "@/hooks/useProPriceTiers";
import { downloadProOrderForm, downloadProClientForm } from "@/lib/proFormsPdf";
import { downloadProPriceGrid, downloadProCatalogue, downloadProGuide, type DocProduct } from "@/lib/proDocsPdf";
import { proFormatPrices } from "@/lib/proPricing";
import { useToast } from "@/hooks/use-toast";

const ProPage = () => {
  const { toast } = useToast();
  const { all: products } = useCatalogProducts();
  const { tiers } = useProPriceTiers();
  const [busy, setBusy] = useState<string | null>(null);

  const toDocProducts = (): DocProduct[] =>
    products.map((p) => ({
      id: p.id,
      name: p.name,
      subtitle: p.subtitle,
      description: p.description,
      category: p.category,
      cbdPercentage: p.cbdPercentage,
      molecule: p.molecule,
      isForceNoire: p.isForceNoire,
      isExotique: p.isExotique,
      publicPrice: p.price,
      priceGroup: p.priceGroup,
      image: p.image,
    }));

  const handleOrderForm = () => {
    const formProducts = products.map((p) => ({
      id: p.id,
      name: p.name,
      formats: proFormatPrices(tiers, p.id, { price: p.price, priceGroup: p.priceGroup }).map(
        (r) => ({ format: r.format, unitHT: r.proUnitHT })
      ),
      isOutOfStock: p.isOutOfStock,
    }));
    downloadProOrderForm(formProducts);
    toast({ title: "Bon de commande téléchargé" });
  };

  const run = async (key: string, fn: () => void | Promise<void>, label: string) => {
    setBusy(key);
    try {
      await fn();
      toast({ title: `${label} téléchargé` });
    } catch {
      toast({ title: "Erreur de génération", variant: "destructive" });
    } finally {
      setBusy(null);
    }
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
        <Button
          variant="outline"
          size="sm"
          disabled={busy !== null}
          onClick={() => run("grille", () => downloadProPriceGrid(toDocProducts(), tiers), "Grille tarifaire")}
        >
          {busy === "grille" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}
          Grille tarifaire pro
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={busy !== null}
          onClick={() => run("catalogue", () => downloadProCatalogue(toDocProducts(), tiers), "Catalogue pro")}
        >
          {busy === "catalogue" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}
          Catalogue pro
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={busy !== null}
          onClick={() => run("guide", () => downloadProGuide(), "Guide commercial")}
        >
          {busy === "guide" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}
          Guide commercial
        </Button>
        <Button asChild variant="outline" size="sm">
          <a href="/documents/HSB-RIB.pdf" target="_blank" rel="noopener noreferrer">
            <Landmark className="h-4 w-4 mr-2" /> RIB High Society Botanicals
          </a>
        </Button>
      </div>

      <ProRequestsSection />
      <ProInvoicingManager />
    </div>
  );
};

export default ProPage;
