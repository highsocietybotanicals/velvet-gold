import { Link } from "react-router-dom";
import { useProCart } from "@/contexts/ProCartContext";
import { useProCartTotals } from "@/hooks/useProCartTotals";
import { PRO_FORMATS, proPricePerGram } from "@/lib/proPricing";
import ProTierBar from "@/components/pro/ProTierBar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useProPriceTiers } from "@/hooks/useProPriceTiers";

const eur = (n: number) => `${n.toFixed(2)} €`;


const ProCataloguePage = () => {
  const { setUnits, getUnits } = useProCart();
  const { totals, products, isLoading } = useProCartTotals();
  const { tiers } = useProPriceTiers();

  if (isLoading) {
    return (
      <div className="py-24 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold gold-text">Catalogue professionnel</h1>
        <p className="text-sm text-muted-foreground">
          Tous les prix sont <strong>HT</strong> (hors TVA 20 %), par gramme, positionnés à
          exactement <strong>50 % du prix public HT</strong> — identiques quel que soit le format,
          pochon aluminium, Boveda 62 % et étiquette inclus sans supplément. Remise dégressive
          automatique sur l'ensemble de la commande : <strong>-5 %</strong> dès 100 g,{" "}
          <strong>-10 %</strong> dès 250 g, <strong>-15 %</strong> dès 500 g, <strong>-20 %</strong>{" "}
          dès 1 kg. Saisis le nombre de pochons par format.
        </p>

      </div>

      <ProTierBar
        totalWeightG={totals.totalWeightG}
        currentTierMaxG={totals.currentTierMaxG}
        gramsToNextTier={totals.gramsToNextTier}
        nextTierSavingPerGram={totals.nextTierSavingPerGram}
        retailTotalTTC={totals.retailTotalTTC}
        totalHT={totals.totalHT}
        resellerMarginTotal={totals.resellerMarginTotal}
      />

      <div className="space-y-3">
        {products.map((p) => {
          const info = { price: p.price, priceGroup: p.priceGroup };
          const basePpg = proPricePerGram(tiers, p.id, totals.totalWeightG, 10, info);
          const productSubtotal = PRO_FORMATS.reduce(
            (s, f) =>
              s +
              f * getUnits(p.id, f) * proPricePerGram(tiers, p.id, totals.totalWeightG, f, info),
            0
          );


          return (
            <Card key={p.id} className="bg-card/60 border-border/50">
              <CardContent className="p-4 grid gap-4 md:grid-cols-[1fr_auto] items-center">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={p.image}
                    alt={`Pochon préconditionné ${p.name}`}
                    loading="lazy"
                    className="h-14 w-14 rounded object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      PV public conseillé : {eur(p.price)} /g TTC · Prix pro dès{" "}
                      <span className="text-gold font-medium">{eur(basePpg)} /g HT</span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  {PRO_FORMATS.map((f) => {
                    const ppgF = proPricePerGram(tiers, p.id, totals.totalWeightG, f);
                    return (
                      <div key={f} className="w-20">
                        <label className="text-[11px] text-muted-foreground block mb-1">
                          {f} g · {eur(ppgF)}/g
                        </label>
                        <Input
                          type="number"
                          min={0}
                          inputMode="numeric"
                          value={getUnits(p.id, f) || ""}
                          placeholder="0"
                          onChange={(e) => setUnits(p.id, p.name, f, Number(e.target.value))}
                          className="h-9"
                        />
                      </div>
                    );
                  })}
                  <div className="w-24 self-end text-right">
                    <p className="text-[11px] text-muted-foreground">Sous-total</p>
                    <p className="text-sm font-medium">{eur(productSubtotal)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>


      <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t border-border/40 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="text-sm">
          <span className="text-muted-foreground">Total </span>
          <strong>{totals.totalWeightG} g</strong>
          <span className="text-muted-foreground"> · </span>
          <strong>{eur(totals.totalHT)} HT</strong>
          <span className="text-muted-foreground"> ({eur(totals.totalTTC)} TTC)</span>
        </div>
        <Button asChild disabled={totals.totalWeightG === 0}>
          <Link to="/pro/panier">Voir mon panier</Link>
        </Button>
      </div>
    </div>
  );
};

export default ProCataloguePage;
