import { TrendingUp, PiggyBank } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { tierLabel } from "@/lib/proPricing";

interface Props {
  totalWeightG: number;
  currentTierMaxG: number | null;
  gramsToNextTier: number | null;
  nextTierSavingPerGram: number | null;
  /** Valeur de revente conseillée (TTC) du panier */
  retailTotalTTC?: number;
  /** Valeur de revente HT (TVA reversée déduite) */
  retailTotalHT?: number;
  /** Total d'achat pro HT du panier */
  totalHT?: number;
  /** Marge revendeur estimée (retail HT - achat HT) */
  resellerMarginTotal?: number;
}

const eur = (n: number) => `${n.toFixed(2)} €`;

const ProTierBar = ({
  totalWeightG,
  currentTierMaxG,
  gramsToNextTier,
  nextTierSavingPerGram,
  retailTotalTTC = 0,
  retailTotalHT = 0,
  totalHT = 0,
  resellerMarginTotal = 0,
}: Props) => {
  const target = currentTierMaxG && currentTierMaxG < 100000 ? currentTierMaxG + 1 : null;
  const pct = target ? Math.min(100, (totalWeightG / target) * 100) : 100;

  const hasData = totalHT > 0;
  const coef = hasData && totalHT > 0 ? retailTotalHT / totalHT : 0;
  const marginPct = retailTotalHT > 0 ? (resellerMarginTotal / retailTotalHT) * 100 : 0;

  return (
    <div className="rounded-lg border border-gold/30 bg-card/60 p-4 grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
      <div className="space-y-2 min-w-0">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-gold" />
            <span className="font-medium">{totalWeightG} g</span>
            <span className="text-muted-foreground">
              — palier actuel : {tierLabel(currentTierMaxG)}
            </span>
          </div>
          {gramsToNextTier !== null && nextTierSavingPerGram !== null && nextTierSavingPerGram > 0 && (
            <span className="text-sm text-gold">
              Encore {gramsToNextTier} g pour économiser {nextTierSavingPerGram.toFixed(2)} €/g
            </span>
          )}
        </div>
        <Progress value={pct} className="h-2" />
      </div>

      <div className="md:border-l md:border-border/50 md:pl-4 md:min-w-[15rem]">
        <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">
          <PiggyBank className="h-3.5 w-3.5 text-gold" />
          Ta rentabilité
        </p>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Prix public TTC</span>
            <span>{hasData ? eur(retailTotalTTC) : "—"}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Encaissé HT (TVA déduite)</span>
            <span>{hasData ? eur(retailTotalHT) : "—"}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Ton achat HT</span>
            <span>{hasData ? eur(totalHT) : "—"}</span>
          </div>
          <div className="flex justify-between gap-4 font-medium">
            <span className="text-muted-foreground">Marge revendeur</span>
            <span className="text-gold">
              {hasData ? eur(resellerMarginTotal) : "—"}
            </span>
          </div>
          {hasData && (
            <p className="text-[11px] text-muted-foreground pt-0.5">
              Coefficient ×{coef.toFixed(2)} · {marginPct.toFixed(0)} % de marge sur le prix public
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProTierBar;
