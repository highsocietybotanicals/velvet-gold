import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { useProCart } from "@/contexts/ProCartContext";
import { useProCartTotals } from "@/hooks/useProCartTotals";
import { PRO_FORMATS, proPricePerGram } from "@/lib/proPricing";
import { calculateItemPrice } from "@/lib/pricing";

import ProTierBar from "@/components/pro/ProTierBar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Package, AlertTriangle, XCircle } from "lucide-react";
import { useProPriceTiers } from "@/hooks/useProPriceTiers";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import ProTicker from "@/components/minuit/areas/pro/ProTicker";
import { ProFlap } from "@/components/minuit/areas/pro/ProDecor";

const eur = (n: number) => `${n.toFixed(2)} €`;

interface StockRow {
  product_id: string;
  stock_grams: number;
  low_stock_threshold_g: number;
}

const useProStock = () =>
  useQuery({
    queryKey: ["pro", "stock"],
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

// Voyants de stock de la cote (habillage « Minuit Carat » : voir areas/pro/pro.css)
const StockBadge = ({ stock }: { stock?: StockRow }) => {
  if (!stock) return null;
  if (stock.stock_grams <= 0)
    return (
      <Badge className="pr-led is-out gap-1">
        <XCircle className="h-3 w-3" aria-hidden="true" /> Rupture
      </Badge>
    );
  if (stock.stock_grams <= stock.low_stock_threshold_g)
    return (
      <Badge className="pr-led is-low gap-1">
        <AlertTriangle className="h-3 w-3" aria-hidden="true" /> Stock faible — {stock.stock_grams} g
      </Badge>
    );
  return (
    <Badge className="pr-led is-ok gap-1">
      <Package className="h-3 w-3" aria-hidden="true" /> {stock.stock_grams} g en stock
    </Badge>
  );
};

// Date de la séance (affichage seul)
const seanceDate = () =>
  new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

const ProCataloguePage = () => {
  const { setUnits, getUnits } = useProCart();
  const { totals, products, isLoading } = useProCartTotals();
  const { tiers } = useProPriceTiers();
  const { data: stockMap } = useProStock();

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center gap-4">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
        <p className="pr-seance" aria-hidden="true">Ouverture de la séance…</p>
      </div>
    );
  }

  // Bandeau défilant : doublon visuel des références et de leur prix pro « dès » (même calcul que chaque ligne)
  const tickerItems = products.map((p) => {
    const stock = stockMap?.get(p.id);
    const info = { price: p.price, priceGroup: p.priceGroup };
    return {
      id: p.id,
      name: p.name,
      cote: `dès ${eur(proPricePerGram(tiers, p.id, totals.totalWeightG, 10, info))}`,
      out: !!stock && stock.stock_grams <= 0,
    };
  });

  return (
    <div className="pr-cote space-y-6">
      <div className="pr-cote-hd">
        <h1>
          <span className="k">Catalogue professionnel</span>
          <span className="m">
            La cote <span className="pr-foil">du jour</span>
          </span>
        </h1>
        <div className="pr-cote-side">
          <span className="pr-neon-sign" aria-hidden="true">
            Séance de nuit
          </span>
          <p className="pr-seance">
            Séance du <b>{seanceDate()}</b> · prix <b>HT</b> au gramme
          </p>
        </div>
      </div>

      <ProTicker items={tickerItems} />

      <div className="pr-notice">
        <p>
          Tous les prix sont <strong>HT</strong> (hors TVA 20 %), par gramme, positionnés à
          exactement <strong>50 % du prix public HT</strong> — identiques quel que soit le format,
          pochon aluminium, Boveda 62 % et étiquette inclus sans supplément. Remise dégressive
          automatique sur l'ensemble de la commande : <strong>-5 %</strong> dès 100 g,{" "}
          <strong>-10 %</strong> dès 250 g, <strong>-15 %</strong> dès 500 g, <strong>-20 %</strong>{" "}
          dès 1 kg. Le prix est plafonné pour te garantir un coefficient de rentabilité minimum de{" "}
          <strong>x2</strong> sur les formats 1 g, 2,5 g et 5 g, et <strong>x1,7</strong> sur le
          10 g, en revendant aux <strong>mêmes prix que le site</strong> — coefficient calculé{" "}
          <strong>HT/HT</strong>, TVA collectée déjà déduite. Le gain HT par pochon est indiqué sous
          chaque format. Saisis le nombre de pochons par format.
        </p>
      </div>

      <ProTierBar
        totalWeightG={totals.totalWeightG}
        currentTierMaxG={totals.currentTierMaxG}
        gramsToNextTier={totals.gramsToNextTier}
        nextTierSavingPerGram={totals.nextTierSavingPerGram}
        retailTotalTTC={totals.retailTotalTTC}
        retailTotalHT={totals.retailTotalHT}
        totalHT={totals.totalHT}
        resellerMarginTotal={totals.resellerMarginTotal}
      />

      {/* Tableau de cote : une ligne par référence */}
      <div className="pr-board-wrap">
        <div className="pr-board-hd" aria-hidden="true">
          <span>N° · Référence · cote pro</span>
          <span>Formats · pochons · sous-total HT</span>
        </div>
        <div className="pr-board">
          {products.map((p, i) => {
            const stock = stockMap?.get(p.id);
            const rupture = !!stock && stock.stock_grams <= 0;
            const info = { price: p.price, priceGroup: p.priceGroup };
            const basePpg = proPricePerGram(tiers, p.id, totals.totalWeightG, 10, info);
            const productSubtotal = PRO_FORMATS.reduce(
              (s, f) =>
                s +
                f * getUnits(p.id, f) * proPricePerGram(tiers, p.id, totals.totalWeightG, f, info),
              0
            );

            return (
              <Card
                key={p.id}
                className={`pr-row ${rupture ? "opacity-60" : ""}`}
                style={{ "--i": i } as CSSProperties}
              >
                <CardContent className="pr-row-in">
                  <div className="pr-row-id">
                    <span className="pr-row-no" aria-hidden="true">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <img
                      src={p.image}
                      alt={`Pochon préconditionné ${p.name}`}
                      loading="lazy"
                      decoding="async"
                      className="pr-row-img"
                    />
                    <div className="min-w-0">
                      <p className="pr-row-name truncate">{p.name}</p>
                      <p className="pr-row-meta">
                        <span>PV public conseillé : {eur(p.price)} /g TTC</span>
                        <span className="sep" aria-hidden="true">
                          ·
                        </span>
                        <span>
                          Prix pro dès <ProFlap text={eur(basePpg)} className="pr-cote-v" /> /g HT
                        </span>
                      </p>
                      <div className="mt-2">
                        <StockBadge stock={stock} />
                      </div>
                    </div>
                  </div>

                  <div className="pr-formats">
                    {PRO_FORMATS.map((f) => {
                      const ppgF = proPricePerGram(tiers, p.id, totals.totalWeightG, f, info);
                      const retailF = calculateItemPrice(p.price, f, p.priceGroup, p.id).finalPrice;
                      // Le buraliste revend au MÊME prix public que le site : son
                      // encaissement réel est HT (TVA reversée), d'où le coef HT/HT.
                      const coefF = ppgF > 0 ? retailF / 1.2 / f / ppgF : 0;
                      // Gain HT par pochon : prix public HT du format - achat HT du pochon
                      const gainF = retailF / 1.2 - ppgF * f;
                      const fieldId = `pr-q-${p.id}-${f}`;
                      return (
                        <div key={f} className="pr-fmt">
                          <label htmlFor={fieldId} className="pr-fmt-l">
                            <span className="pr-fmt-f">{f} g</span>
                            <span className="pr-fmt-sep"> · </span>
                            {eur(ppgF)}/g
                            <span className="pr-fmt-coef block">x{coefF.toFixed(2)}</span>
                            <span className="pr-fmt-gain block">
                              +{gainF.toFixed(2)} €/pochon
                            </span>
                          </label>

                          <Input
                            id={fieldId}
                            type="number"
                            min={0}
                            inputMode="numeric"
                            value={getUnits(p.id, f) || ""}
                            placeholder="0"
                            disabled={rupture}
                            onChange={(e) => setUnits(p.id, p.name, f, Number(e.target.value))}
                            className="pr-qty h-10"
                          />
                        </div>
                      );
                    })}
                    <div className="pr-fmt-sub">
                      <p>Sous-total</p>
                      <p>{eur(productSubtotal)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Ticket de séance : place laissée au bouton du Sommelier (voir pro.css) */}
      <div className="pr-ticket sticky bottom-0 flex items-center justify-between gap-4 flex-wrap">
        <div className="pr-ticket-sum">
          <span className="l">Total</span>
          <strong>{totals.totalWeightG} g</strong>
          <span className="ttc"> · </span>
          <strong className="ht">{eur(totals.totalHT)} HT</strong>
          <span className="ttc"> ({eur(totals.totalTTC)} TTC)</span>
        </div>
        <Button asChild disabled={totals.totalWeightG === 0}>
          <Link to="/pro/panier">Voir mon panier</Link>
        </Button>
      </div>
    </div>
  );
};

export default ProCataloguePage;
