import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileDown, Copy, Check } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const DOCS = [
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

  const copy = async () => {
    await navigator.clipboard.writeText(PITCH);
    setCopied(true);
    toast({ title: "Pitch copié" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold gold-text">Documents & pitch</h1>
        <p className="text-sm text-muted-foreground mt-1">
          À envoyer par mail ou à présenter sur tablette pendant la visite.
        </p>
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
