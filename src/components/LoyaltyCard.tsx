import { Gift, Star } from "lucide-react";
import { motion } from "framer-motion";

interface LoyaltyCardProps {
  qualifyingOrdersCount: number;
  freeGramsAvailable: number;
}

const LoyaltyCard = ({ qualifyingOrdersCount, freeGramsAvailable }: LoyaltyCardProps) => {
  const progress = (qualifyingOrdersCount / 10) * 100;
  const remaining = 10 - qualifyingOrdersCount;

  return (
    <div className="bg-gradient-to-br from-primary/20 via-card to-primary/10 border border-primary/30 rounded-xl p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Gift className="w-5 h-5 text-primary" />
        <h2 className="font-display text-lg text-foreground">Programme Fidélité</h2>
      </div>

      {/* Free grams available */}
      {freeGramsAvailable > 0 && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center gap-3 p-4 bg-green-500/20 border border-green-500/40 rounded-lg mb-4"
        >
          <Star className="w-6 h-6 text-green-400 fill-green-400" />
          <div>
            <p className="font-medium text-green-400">
              🎉 Vous avez {freeGramsAvailable}g offerts !
            </p>
            <p className="text-sm text-green-300/80">
              À utiliser lors de votre prochaine commande
            </p>
          </div>
        </motion.div>
      )}

      {/* Progress bar */}
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Progression</span>
          <span className="text-primary font-medium">{qualifyingOrdersCount}/10 commandes</span>
        </div>

        <div className="relative h-3 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary/70 rounded-full"
          />
          {/* Stars markers */}
          <div className="absolute inset-0 flex justify-between px-1 items-center">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full ${
                  i < qualifyingOrdersCount ? "bg-background" : "bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>
        </div>

        <p className="text-center text-sm">
          {remaining > 0 ? (
            <span className="text-muted-foreground">
              Plus que <span className="text-primary font-medium">{remaining} commande{remaining > 1 ? "s" : ""}</span> de +10g pour{" "}
              <span className="text-primary font-medium">10g offerts !</span>
            </span>
          ) : (
            <span className="text-green-400 font-medium">
              🎁 Félicitations ! Vous avez débloqué 10g offerts !
            </span>
          )}
        </p>
      </div>

      {/* Info */}
      <div className="mt-4 pt-4 border-t border-border/50">
        <p className="text-xs text-muted-foreground text-center">
          Chaque commande de 10g ou plus de fleurs compte pour la fidélité
        </p>
      </div>
    </div>
  );
};

export default LoyaltyCard;
