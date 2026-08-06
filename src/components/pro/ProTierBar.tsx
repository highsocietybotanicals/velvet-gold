import { TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { tierLabel } from "@/lib/proPricing";

interface Props {
  totalWeightG: number;
  currentTierMaxG: number | null;
  gramsToNextTier: number | null;
  nextTierSavingPerGram: number | null;
}

const ProTierBar = ({
  totalWeightG,
  currentTierMaxG,
  gramsToNextTier,
  nextTierSavingPerGram,
}: Props) => {
  const target = currentTierMaxG && currentTierMaxG < 100000 ? currentTierMaxG + 1 : null;
  const pct = target ? Math.min(100, (totalWeightG / target) * 100) : 100;


  return (
    <div className="rounded-lg border border-gold/30 bg-card/60 p-4 space-y-2">
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
  );
};

export default ProTierBar;
