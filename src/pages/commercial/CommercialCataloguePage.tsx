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
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Flame, Search } from "lucide-react";
import LogHead from "@/components/minuit/areas/commercial/LogHead";
import { typeLabel } from "@/components/minuit/minuitData";
import { responsiveProductSrcSet } from "@/lib/responsiveProductImage";

/* Pastille de lot (64 px) : la photo du catalogue (900 px, voir src/data/products.ts) est servie en
   vignette de 192 px (écran ×3). Même requête d'image que le catalogue → même URL, qui sert de clé ;
   si la photo vient d'ailleurs (surcharge en base), on garde la photo telle quelle.
   ATTENTION : la requête « ?w=900&quality=82&format=webp » ci-dessous DOIT rester identique à celle des
   imports de src/data/products.ts (lignes 5-20). Si elle change là-bas, la clé ne correspond plus, sans
   erreur : la pastille de 64 px recharge alors la photo de 900 px (le gain de poids disparaît). */
const lotFull = import.meta.glob<string>(
  ["/src/assets/flowers/*-real.jpg", "/src/assets/resins/*-real.jpg", "/src/assets/resins/*-premium.jpg", "/src/assets/resins/piatella.jpg"],
  { query: "?w=900&quality=82&format=webp", import: "default", eager: true },
);
const lotThumb = import.meta.glob<string>(
  ["/src/assets/flowers/*-real.jpg", "/src/assets/resins/*-real.jpg", "/src/assets/resins/*-premium.jpg", "/src/assets/resins/piatella.jpg"],
  { query: "?w=192&quality=82&format=webp", import: "default", eager: true },
);
const LOT_THUMBS = new Map(Object.keys(lotFull).map((k) => [lotFull[k], lotThumb[k]]));
const lotSrcSet = (src: string) => {
  const thumb = LOT_THUMBS.get(src);
  return thumb ? `${thumb} 192w, ${src} 900w` : responsiveProductSrcSet(src);
};

/** Feux tricolores du stock (décor) : rouge, orange, vert. */
const Feu = () => (
  <span className="cm-feu-l" aria-hidden="true">
    <i />
    <i />
    <i />
  </span>
);

const two = (n: number) => String(n).padStart(2, "0");

interface StockRow {
  product_id: string;
  stock_grams: number;
  low_stock_threshold_g: number;
}

const useCommercialStock = () =>
  useQuery({
    queryKey: ["commercial", "stock"],
    queryFn: async (): Promise<Map<string, StockRow>> => {
      const { data, error } = await (supabase as any)
        .from("product_inventory")
        .select("product_id, stock_grams, low_stock_threshold_g");
      if (error) throw error;
      return new Map(
        (data ?? []).map((r: any) => [
          r.product_id,
          {
            product_id: r.product_id,
            stock_grams: Number(r.stock_grams),
            low_stock_threshold_g: Number(r.low_stock_threshold_g ?? 10),
          },
        ])
      );
    },
  });

const StockBadge = ({ stock }: { stock?: StockRow }) => {
  if (!stock) return null;
  if (stock.stock_grams <= 0)
    return (
      <Badge className="cm-feu cm-feu--rouge bg-red-900/40 text-red-300 border border-red-700/50 gap-1">
        <Feu /> Rupture
      </Badge>
    );
  if (stock.stock_grams <= stock.low_stock_threshold_g)
    return (
      <Badge className="cm-feu cm-feu--orange bg-amber-600/20 text-amber-300 border border-amber-500/50 gap-1">
        <Feu /> Stock faible — {stock.stock_grams} g
      </Badge>
    );
  return (
    <Badge className="cm-feu cm-feu--vert bg-emerald-600/20 text-emerald-300 border border-emerald-500/50 gap-1">
      <Feu /> {stock.stock_grams} g en stock
    </Badge>
  );
};

const euro = (n: number) =>
  n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 2 });

const ARGUMENTS_CLES = [
  { icon: Leaf, title: "100 % Indoor", text: "Cultures indoor sélectionnées, jamais de CBD industriel bas de gamme." },
  { icon: FlaskConical, title: "Analyses laboratoire", text: "THC < 0,3 %. Analyse laboratoire disponible sur demande, papiers fournis." },
  { icon: ShieldCheck, title: "Préconditionné pro", text: "Pochons 1 g / 2,5 g / 5 g / 10 g avec Boveda 62 %, prêts à vendre en rayon." },
  { icon: Sparkles, title: "Cadeaux clients", text: "Briquet BIC + feuilles slim offerts dans les pochons 10 g : le client revient." },
];

const CommercialCataloguePage = () => {
  const { flowers, resins } = useCatalogProducts();
  const { tiers } = useProPriceTiers();
  const { data: labReports } = useLabReports();
  const { open: openLab, openingId } = useOpenLabReport();
  const { toast } = useToast();
  const { data: stockMap } = useCommercialStock();
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const products = useMemo(() => {
    const all = [...flowers, ...resins];
    const q = search.trim().toLowerCase();
    return q ? all.filter((p) => p.name.toLowerCase().includes(q)) : all;
  }, [flowers, resins, search]);

  const allProducts = useMemo(() => [...flowers, ...resins], [flowers, resins]);
  const { barcodes } = useEnsureBarcodes(allProducts.map((p) => p.id));

  const priority = useMemo(() => {
    if (!stockMap) return [];
    return allProducts
      .map((p) => ({ p, stock: stockMap.get(p.id) }))
      .filter((x) => (x.stock?.stock_grams ?? 0) > 0)
      .sort((a, b) => b.stock!.stock_grams - a.stock!.stock_grams)
      .slice(0, 5);
  }, [allProducts, stockMap]);

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
    <div className="cm-page space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <LogHead no="01" etape="Départ · le catalogue" turn="droit" className="min-w-0 flex-[1_1_22rem]">
          <h1 className="cm-h1">Catalogue & argumentaire</h1>
          <p className="cm-lead">
            Tout ce qu'il faut pour convaincre un buraliste : prix pro HT par format, prix public
            conseillé, marge réelle du revendeur et code-barres prêt pour la caisse.
          </p>
        </LogHead>
        <Button
          variant="outline"
          className="gap-2 border-gold/40 text-gold hover:bg-gold/10"
          onClick={() => printSheet(products)}
        >
          <Barcode className="h-4 w-4" />
          Planche codes-barres
        </Button>
      </div>

      {priority.length > 0 && (
        <Card className="cm-prio border-gold/40">
          <CardContent className="pt-5">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-3">
              <span className="cm-losange" aria-hidden="true">
                <Flame className="h-4 w-4 text-gold" />
              </span>
              <p className="cm-prio-t font-medium text-sm">À vendre en priorité</p>
              <p className="text-xs text-muted-foreground">
                — les variétés avec le plus de stock à écouler
              </p>
            </div>
            <div className="cm-bornes flex flex-wrap gap-2">
              {priority.map(({ p, stock }) => (
                <span key={p.id} className="cm-borne">
                  <span className="cm-borne-n font-medium">{p.name}</span>
                  <span className="cm-borne-g text-gold font-semibold">{stock!.stock_grams} g</span>
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ARGUMENTS_CLES.map((a, i) => (
          <Card key={a.title} className="cm-arg">
            <CardContent className="pt-5 space-y-2">
              <span className="cm-arg-no" aria-hidden="true">
                {two(i + 1)}
              </span>
              <span className="cm-rond" aria-hidden="true">
                <a.icon className="h-5 w-5 text-gold" />
              </span>
              <p className="cm-arg-t font-medium text-sm">{a.title}</p>
              <p className="text-xs text-muted-foreground">{a.text}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="cm-plaque">
        <CardHeader>
          <span className="cm-step" aria-hidden="true">
            Plaque de la maison
          </span>
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

      <div className="cm-search">
        <Search aria-hidden="true" />
        <Input
          placeholder="Rechercher une variété…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {products.map((p, idx) => {
          const stock = stockMap?.get(p.id);
          const outOfStock = !!stock && stock.stock_grams <= 0;
          return (
          <Card key={p.id} className={`cm-lot overflow-hidden ${outOfStock ? "opacity-50" : ""}`}>
            <span className="cm-lot-no" aria-hidden="true">
              Lot {two(idx + 1)} · {typeLabel(p)}
            </span>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={p.image}
                    srcSet={lotSrcSet(p.image)}
                    sizes="64px"
                    width={64}
                    height={64}
                    alt={`Photo de la variété ${p.name}`}
                    loading="lazy"
                    decoding="async"
                    className="cm-lot-img h-16 w-16 rounded-md object-cover border border-gold/20 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <CardTitle className="text-base truncate">{p.name}</CardTitle>
                      {p.molecule && (
                        <span className="cm-tag shrink-0 rounded-full border border-gold/50 bg-background/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold">
                          {p.molecule}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{p.subtitle}</p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <StockBadge stock={stock} />
                  {p.isExotique && (
                    <Badge className="cm-tag bg-purple-600/20 text-purple-300 border border-purple-500/50">
                      Exotique
                    </Badge>
                  )}
                  {p.isForceNoire && !p.isExotique && (
                    <Badge className="cm-tag bg-red-900/40 text-red-300 border border-red-700/50">
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
                <table className="cm-log w-full text-xs">
                  <thead className="text-muted-foreground">
                    <tr className="border-b border-border/50">
                      <th className="text-left py-1">Format</th>
                      <th className="text-right py-1">Prix pro HT</th>
                      <th className="text-right py-1">PV public TTC</th>
                      <th className="text-right py-1">Gain HT</th>
                      <th className="text-right py-1">Coef.</th>
                      <th className="text-right py-1">Code-barres</th>
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
                      const ean = barcodes[p.id]?.[wKey(f)];
                      return (
                        <tr key={f} className="border-b border-border/30 last:border-0">
                          <td className="cm-mono py-1.5">{f} g</td>
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
                          <td className="py-1.5 text-right whitespace-nowrap">
                            {ean ? (
                              <button
                                type="button"
                                onClick={() => copyEan(ean)}
                                className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground hover:text-gold"
                                aria-label={`Copier le code-barres ${ean}`}
                              >
                                {ean}
                                {copied === ean ? (
                                  <Check className="h-3 w-3 text-emerald-400" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          );
        })}
      </div>
    </div>
  );
};

export default CommercialCataloguePage;
