import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useCatalogProducts } from "@/hooks/useCatalogProducts";
import { useProPriceTiers } from "@/hooks/useProPriceTiers";
import { PRO_FORMATS, VAT_RATE, proPricePerGram, minResellerCoef } from "@/lib/proPricing";
import { calculateItemPrice } from "@/lib/pricing";
import { Sparkles, Zap, ShieldCheck, Leaf, FlaskConical, Loader2, Barcode, Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLabReports, useOpenLabReport } from "@/hooks/useLabReports";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useEnsureBarcodes, wKey } from "@/hooks/useBarcodes";
import { generateBarcodeSheet } from "@/lib/barcodeSheetPdf";
import { useToast } from "@/hooks/use-toast";

const euro = (n: number) =>
  n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 2 });

const ARGUMENTS_CLES = [
  { icon: Leaf, title: "100 % Indoor", text: "Cultures indoor sélectionnées, jamais de CBD industriel bas de gamme." },
  { icon: FlaskConical, title: "Analyses laboratoire", text: "Chaque lot est testé : THC < 0,3 %, taux de CBD certifié, papiers fournis." },
  { icon: ShieldCheck, title: "Préconditionné pro", text: "Pochons 1 g / 2,5 g / 5 g / 10 g avec Boveda 62 %, prêts à vendre en rayon." },
  { icon: Sparkles, title: "Cadeaux clients", text: "Briquet BIC + feuilles slim offerts dans les pochons 10 g : le client revient." },
];

const CommercialCataloguePage = () => {
  const { flowers, resins } = useCatalogProducts();
  const { tiers } = useProPriceTiers();
  const { data: labReports } = useLabReports();
  const { open: openLab, openingId } = useOpenLabReport();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const products = useMemo(() => {
    const all = [...flowers, ...resins];
    const q = search.trim().toLowerCase();
    return q ? all.filter((p) => p.name.toLowerCase().includes(q)) : all;
  }, [flowers, resins, search]);

  const allProducts = useMemo(() => [...flowers, ...resins], [flowers, resins]);
  const { barcodes } = useEnsureBarcodes(allProducts.map((p) => p.id));

  const reportsFor = (id: string) => {
    const r = labReports?.[id];
    return Array.isArray(r) ? r : [];
  };

  const copyEan = async (ean: string) => {
    try {
      await navigator.clipboard.writeText(ean);
      setCopied(ean);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      toast({ title: "Copie impossible", description: ean });
    }
  };

  const printSheet = (list: typeof allProducts, fileName?: string) =>
    generateBarcodeSheet({
      products: list.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        priceGroup: p.priceGroup,
      })),
      barcodes,
      formats: [...PRO_FORMATS],
      fileName,
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold gold-text">Catalogue & argumentaire</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tout ce qu'il faut pour convaincre un buraliste : prix pro HT par format, prix public
            conseillé, marge réelle du revendeur et code-barres prêt pour la caisse.
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2 border-gold/40 text-gold hover:bg-gold/10"
          onClick={() => printSheet(products)}
        >
          <Barcode className="h-4 w-4" />
          Planche codes-barres
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ARGUMENTS_CLES.map((a) => (
          <Card key={a.title} className="bg-card/50">
            <CardContent className="pt-5 space-y-2">
              <a.icon className="h-5 w-5 text-gold" />
              <p className="font-medium text-sm">{a.title}</p>
              <p className="text-xs text-muted-foreground">{a.text}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-gold/30">
        <CardHeader>
          <CardTitle className="text-base">L'argument massue</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            Le partenaire revend <strong className="text-foreground">aux mêmes prix que notre site</strong> :
            aucune guerre de prix, aucune décote de l'image de marque.
          </p>
          <p>
            Il encaisse le prix public HT (TVA déduite) et achète au minimum deux fois moins cher :
            coefficient x2 garanti sur 1 g / 2,5 g / 5 g, x1,7 sur le 10 g.
          </p>
          <p>
            Dégressivité volume : -5 % dès 100 g, -10 % dès 250 g, -15 % dès 500 g, -20 % dès 1 kg.
          </p>
        </CardContent>
      </Card>

      <Input
        placeholder="Rechercher une variété…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      <div className="grid gap-4 md:grid-cols-2">
        {products.map((p) => (
          <Card key={p.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={p.image}
                    alt={`Photo de la variété ${p.name}`}
                    loading="lazy"
                    className="h-16 w-16 rounded-md object-cover border border-gold/20 shrink-0"
                  />
                  <div className="min-w-0">
                    <CardTitle className="text-base truncate">{p.name}</CardTitle>
                    <p className="text-xs text-muted-foreground truncate">{p.subtitle}</p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  {p.isExotique && (
                    <Badge className="bg-purple-600/20 text-purple-300 border border-purple-500/50">
                      Exotique
                    </Badge>
                  )}
                  {p.isNectarDivin && <Badge variant="secondary">Nectar Divin</Badge>}
                  {p.isForceNoire && !p.isNectarDivin && !p.isExotique && (
                    <Badge className="bg-red-900/40 text-red-300 border border-red-700/50">
                      <Zap className="h-3 w-3 mr-1" /> Force Noire
                    </Badge>
                  )}
                  {reportsFor(p.id).length === 0 ? (
                    <span className="mt-1 text-[11px] text-muted-foreground">Analyse à venir</span>
                  ) : reportsFor(p.id).length === 1 ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-1 h-7 gap-1.5 border-gold/40 text-gold hover:bg-gold/10"
                      disabled={openingId === reportsFor(p.id)[0].id}
                      onClick={() =>
                        openLab(reportsFor(p.id)[0].id, reportsFor(p.id)[0].storage_path)
                      }
                    >
                      {openingId === reportsFor(p.id)[0].id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <FlaskConical className="h-3.5 w-3.5" />
                      )}
                      Analyse labo
                    </Button>
                  ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-1 h-7 gap-1.5 border-gold/40 text-gold hover:bg-gold/10"
                        >
                          <FlaskConical className="h-3.5 w-3.5" />
                          Analyses labo ({reportsFor(p.id).length})
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="max-w-[260px]">
                        {reportsFor(p.id).map((r) => (
                          <DropdownMenuItem
                            key={r.id}
                            onClick={() => openLab(r.id, r.storage_path)}
                            className="gap-2"
                          >
                            {openingId === r.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                            ) : (
                              <FlaskConical className="h-3.5 w-3.5 shrink-0" />
                            )}
                            <span className="truncate">{r.label}</span>
                            <span className="ml-auto text-[10px] text-muted-foreground shrink-0">
                              {new Date(r.created_at).toLocaleDateString("fr-FR")}
                            </span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 gap-1.5 text-[11px] text-muted-foreground"
                    onClick={() => printSheet([p], `codes-barres-${p.id}.pdf`)}
                  >
                    <Barcode className="h-3.5 w-3.5" /> Codes-barres
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground line-clamp-3">{p.description}</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="text-muted-foreground">
                    <tr className="border-b border-border/50">
                      <th className="text-left py-1">Format</th>
                      <th className="text-right py-1">Prix pro HT</th>
                      <th className="text-right py-1">PV public TTC</th>
                      <th className="text-right py-1">Gain HT</th>
                      <th className="text-right py-1">Coef.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PRO_FORMATS.map((f) => {
                      const ppg = proPricePerGram(tiers, p.id, 0, f, {
                        price: p.price,
                        priceGroup: p.priceGroup,
                      });
                      const proHT = ppg * f;
                      const retailTTC = calculateItemPrice(p.price, f, p.priceGroup, p.id).finalPrice;
                      const retailHT = retailTTC / (1 + VAT_RATE);
                      const gain = retailHT - proHT;
                      const coef = proHT > 0 ? retailHT / proHT : 0;
                      return (
                        <tr key={f} className="border-b border-border/30 last:border-0">
                          <td className="py-1.5">{f} g</td>
                          <td className="py-1.5 text-right">{euro(proHT)}</td>
                          <td className="py-1.5 text-right">{euro(retailTTC)}</td>
                          <td className="py-1.5 text-right text-emerald-400">+{euro(gain)}</td>
                          <td className="py-1.5 text-right text-gold">
                            x{coef.toFixed(2)}
                            <span className="text-muted-foreground">
                              {" "}
                              (min x{minResellerCoef(f)})
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CommercialCataloguePage;
