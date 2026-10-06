import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileDown, Copy, Check, Printer, FileText, Landmark, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useCatalogProducts } from "@/hooks/useCatalogProducts";
import { useProPriceTiers } from "@/hooks/useProPriceTiers";
import { downloadProOrderForm, downloadProClientForm } from "@/lib/proFormsPdf";
import { downloadProPriceGrid, downloadProCatalogue, downloadProGuide, type DocProduct } from "@/lib/proDocsPdf";
import { proFormatPrices } from "@/lib/proPricing";
import emblemSvg from "@/assets/brand/hsb-emblem.svg?raw";
import LogHead from "@/components/minuit/areas/commercial/LogHead";

/** Référence de pièce dans la boîte à gants (décor). */
const pieceRef = (n: number) => `Pièce ${String(n).padStart(2, "0")}`;

const PITCH = `Bonjour,

Je suis commercial pour High Society Botanicals, une marque française de CBD haut de gamme (100 % indoor, sélection à la main, THC < 0,3 %, analyse laboratoire disponible sur demande).

Nous proposons aux buralistes une gamme préconditionnée prête à vendre : pochons 1 g, 2,5 g, 5 g et 10 g, humidité maîtrisée par Boveda 62 %, briquet BIC et feuilles slim offerts dans les 10 g.

Le principe est simple : vous revendez aux mêmes prix que notre site. Chaque variété a un prix professionnel HT fixe par format de pochon (1 g, 2,5 g, 5 g, 10 g), construit pour vous laisser un coefficient ×2 — et une remise s'ajoute sur le poids total de la commande dès 100 g (-5 %, puis -10 % dès 250 g, -15 % dès 500 g, -20 % dès 1 kg).

Je peux passer vous déposer des échantillons et la grille tarifaire complète. Quel jour vous arrange ?

Bien à vous,`;

const CommercialDocumentsPage = () => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const { all: products } = useCatalogProducts();
  const { tiers } = useProPriceTiers();

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

  const copy = async () => {
    await navigator.clipboard.writeText(PITCH);
    setCopied(true);
    toast({ title: "Pitch copié" });
    setTimeout(() => setCopied(false), 2000);
  };

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

  const GENERATED_DOCS = [
    {
      key: "grille",
      name: "Grille tarifaire pro — préconditionné",
      desc: "Prix HT du pochon par variété et par format (1 g / 2,5 g / 5 g / 10 g), prix public conseillé, remises de volume, modalités et RIB. Générée à jour à chaque téléchargement.",
      action: () => run("grille", () => downloadProPriceGrid(toDocProducts(), tiers), "Grille tarifaire"),
    },
    {
      key: "catalogue",
      name: "Catalogue pro — vente directe",
      desc: "Visuels produits et tableau de prix par format : prix pro HT, prix public conseillé et gain du revendeur. Uniquement les variétés actives.",
      action: () => run("catalogue", () => downloadProCatalogue(toDocProducts(), tiers), "Catalogue pro"),
    },
    {
      key: "guide",
      name: "Guide commercial — marque, gamme, légalité, pitch",
      desc: "11 chapitres : notre histoire, la sélection, le packaging, les analyses laboratoire, l'offre revendeur, le déroulé de visite, les objections et votre rémunération (10 % + 10 % réassorts + 50 € par nouveau client).",
      action: () => run("guide", () => downloadProGuide(), "Guide commercial"),
    },
  ];

  return (
    <div className="cm-page space-y-6">
      <LogHead no="05" etape="La boîte à gants" turn="arrivee">
        <h1 className="cm-h1">Documents & pitch</h1>
        <p className="cm-lead">
          À envoyer par mail ou à présenter sur tablette pendant la visite. Les documents sont générés à jour à chaque téléchargement.
        </p>
      </LogHead>

      {/* Formulaires à imprimer */}
      <div className="cm-docs grid gap-3 md:grid-cols-2">
        <Card className="cm-doc">
          <CardContent className="pt-5 space-y-3">
            <span className="cm-doc-ref" aria-hidden="true">
              {pieceRef(1)} · à imprimer
            </span>
            <div className="flex items-center gap-2">
              <Printer className="h-4 w-4 text-primary" />
              <p className="cm-doc-t font-medium text-sm">Bon de commande papier (A4)</p>
            </div>
            <p className="text-xs text-muted-foreground">
              À imprimer et remplir au stylo pendant la visite. Prix pro HT fixés par variété,
              dégressivité volume, coordonnées bancaires préremplies, totaux et signatures.
            </p>
            <Button variant="outline" size="sm" onClick={handleOrderForm}>
              <Printer className="h-4 w-4 mr-2" /> Télécharger le PDF
            </Button>
          </CardContent>
        </Card>
        <Card className="cm-doc">
          <CardContent className="pt-5 space-y-3">
            <span className="cm-doc-ref" aria-hidden="true">
              {pieceRef(2)} · à imprimer
            </span>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <p className="cm-doc-t font-medium text-sm">Fiche nouveau client pro (A4)</p>
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

      <div className="cm-docs grid gap-3 md:grid-cols-2">
        {GENERATED_DOCS.map((d, i) => (
          <Card key={d.key} className="cm-doc">
            <CardContent className="pt-5 space-y-3">
              <span className="cm-doc-ref" aria-hidden="true">
                {pieceRef(i + 3)} · générée à jour
              </span>
              <p className="cm-doc-t font-medium text-sm">{d.name}</p>
              <p className="text-xs text-muted-foreground">{d.desc}</p>
              <Button variant="outline" size="sm" onClick={d.action} disabled={busy !== null}>
                {busy === d.key ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileDown className="h-4 w-4 mr-2" />
                )}
                Télécharger le PDF
              </Button>
            </CardContent>
          </Card>
        ))}
        <Card className="cm-doc">
          <CardContent className="pt-5 space-y-3">
            <span className="cm-doc-ref" aria-hidden="true">
              {pieceRef(GENERATED_DOCS.length + 3)} · officielle
            </span>
            <p className="cm-doc-t font-medium text-sm">RIB — High Society Botanicals</p>
            <p className="text-xs text-muted-foreground">
              Coordonnées bancaires officielles à transmettre aux clients réglant par virement.
            </p>
            <Button asChild variant="outline" size="sm">
              <a href="/documents/HSB-RIB.pdf" target="_blank" rel="noopener noreferrer">
                <Landmark className="h-4 w-4 mr-2" /> Télécharger le PDF
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="cm-telegram">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="cm-stamp" aria-hidden="true" dangerouslySetInnerHTML={{ __html: emblemSvg }} />
            <div className="min-w-0">
              <span className="cm-step" aria-hidden="true">
                Télégramme
              </span>
              <CardTitle className="text-base">Pitch mail prêt à envoyer</CardTitle>
            </div>
          </div>
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
