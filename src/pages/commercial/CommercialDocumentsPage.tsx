import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileDown, Copy, Check, Printer, FileText } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useCatalogProducts } from "@/hooks/useCatalogProducts";
import { useProPriceTiers } from "@/hooks/useProPriceTiers";
import { downloadProOrderForm, downloadProClientForm } from "@/lib/proFormsPdf";
import { getGammeForProduct, getProPricePerGram } from "@/lib/margin";

const DOCS = [
  {
    name: "Guide commercial — marque, gamme, légalité, pitch",
    desc: "11 chapitres : notre histoire, la sélection, le packaging, les analyses laboratoire (GC-MS / GC-FID), l'offre revendeur, le déroulé de visite, les objections et votre rémunération.",
    href: "/documents/HSB-Guide-Commercial.pdf",
  },
  {
    name: "Grille tarifaire pro — préconditionné",
    desc: "Prix HT par format (1 g / 2,5 g / 5 g / 10 g) et dégressivité volume.",
    href: "/documents/HSB-Grille-Tarifaire-Pro-Preconditionne.pdf",
  },
  {
    name: "Catalogue pro — vente directe",
    desc: "Présentation des gammes, visuels produits et argumentaire commercial.",
    href: "/documents/HSB-Catalogue-Pro-Tabac-VenteDirecte.pdf",
  },
];

const PITCH = `Bonjour,

Je suis commercial pour High Society Botanicals, une marque française de CBD haut de gamme (100 % indoor, analyses laboratoire pour chaque lot, THC < 0,3 %).

Nous proposons aux buralistes une gamme préconditionnée prête à vendre : pochons 1 g, 2,5 g, 5 g et 10 g, humidité maîtrisée par Boveda 62 %, briquet BIC et feuilles slim offerts dans les 10 g.

Le principe est simple : vous revendez aux mêmes prix que notre site, et vous achetez à moitié prix — soit un coefficient x2 sur votre prix de vente hors taxes. Dégressivité supplémentaire dès 100 g.

Je peux passer vous déposer des échantillons et la grille tarifaire complète. Quel jour vous arrange ?

Bien à vous,`;

const CommercialDocumentsPage = () => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const { all: products } = useCatalogProducts();
  const { tiers } = useProPriceTiers();

  const copy = async () => {
    await navigator.clipboard.writeText(PITCH);
    setCopied(true);
    toast({ title: "Pitch copié" });
    setTimeout(() => setCopied(false), 2000);
  };

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold gold-text">Documents & pitch</h1>
        <p className="text-sm text-muted-foreground mt-1">
          À envoyer par mail ou à présenter sur tablette pendant la visite.
        </p>
      </div>

      {/* Formulaires à imprimer */}
      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <CardContent className="pt-5 space-y-3">
            <div className="flex items-center gap-2">
              <Printer className="h-4 w-4 text-primary" />
              <p className="font-medium text-sm">Bon de commande papier (A4)</p>
            </div>
            <p className="text-xs text-muted-foreground">
              À imprimer et remplir au stylo pendant la visite. Prix pro HT fixés par variété,
              dégressivité volume imprimée, totaux et signatures.
            </p>
            <Button variant="outline" size="sm" onClick={handleOrderForm}>
              <Printer className="h-4 w-4 mr-2" /> Télécharger le PDF
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <p className="font-medium text-sm">Fiche nouveau client pro (A4)</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Toutes les informations nécessaires pour créer le compte pro en back-office.
              À remplir au stylo, cases e-mail incluses.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                downloadProClientForm();
                toast({ title: "Fiche client téléchargée" });
              }}
            >
              <FileText className="h-4 w-4 mr-2" /> Télécharger le PDF
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {DOCS.map((d) => (
          <Card key={d.href}>
            <CardContent className="pt-5 space-y-3">
              <p className="font-medium text-sm">{d.name}</p>
              <p className="text-xs text-muted-foreground">{d.desc}</p>
              <Button asChild variant="outline" size="sm">
                <a href={d.href} target="_blank" rel="noopener noreferrer">
                  <FileDown className="h-4 w-4 mr-2" /> Télécharger le PDF
                </a>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-base">Pitch mail prêt à envoyer</CardTitle>
          <Button size="sm" variant="outline" onClick={copy}>
            {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
            Copier
          </Button>
        </CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap text-xs text-muted-foreground leading-relaxed">
            {PITCH}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
};

export default CommercialDocumentsPage;
