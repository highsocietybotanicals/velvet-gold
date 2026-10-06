import { Gift, Star } from "lucide-react";
import { motion } from "framer-motion";
import type { CSSProperties } from "react";

// Habillage « carnet du membre » (espace Mon profil) : carte de fidélité poinçonnée.
// Styles dans src/components/minuit/areas/profil/profil.css. Calculs et textes d'origine conservés.

interface LoyaltyCardProps {
  qualifyingOrdersCount: number;
  freeGramsAvailable: number;
}

const LoyaltyCard = ({ qualifyingOrdersCount, freeGramsAvailable }: LoyaltyCardProps) => {
  const progress = (qualifyingOrdersCount / 10) * 100;
  const remaining = 10 - qualifyingOrdersCount;

  return (
    <section className="pf-page pf-loyal" data-pf-reveal="" aria-labelledby="pf-loyal-t">
      <header className="pf-page-head">
        <p className="pf-kick">
          <Gift className="w-4 h-4" aria-hidden="true" />
          <span>Fidélité</span>
        </p>
        <h2 id="pf-loyal-t" className="pf-h2">Programme Fidélité</h2>
      </header>

      {/* Free grams available */}
      {freeGramsAvailable > 0 && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="pf-voucher"
        >
          <span className="pf-voucher-seal" aria-hidden="true">
            <Star className="w-5 h-5" />
          </span>
          <div>
            <p className="pf-voucher-t">
              Vous avez {freeGramsAvailable}g offerts !
            </p>
            <p className="pf-voucher-s">
              À utiliser lors de votre prochaine commande
            </p>
          </div>
        </motion.div>
      )}

      {/* Progress : carte poinçonnée */}
      <div className="pf-punchcard">
        <div className="pf-punch-head">
          <span className="pf-punch-k">Progression</span>
          <span className="pf-punch-n">{qualifyingOrdersCount}/10 commandes</span>
        </div>

        <ol className="pf-punches" aria-hidden="true">
          {[...Array(10)].map((_, i) => (
            <li
              key={i}
              className={i < qualifyingOrdersCount ? "on" : undefined}
              style={{ "--i": i } as CSSProperties}
            >
              <span className="pf-hole">{i < qualifyingOrdersCount ? "✦" : i + 1}</span>
            </li>
          ))}
        </ol>

        <div className="pf-thread" aria-hidden="true">
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: Math.min(Math.max(progress, 0), 100) / 100 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="pf-thread-fill"
          />
        </div>

        <p className="pf-punch-msg">
          {remaining > 0 ? (
            <span>
              Plus que <b>{remaining} commande{remaining > 1 ? "s" : ""}</b> de +10g pour{" "}
              <b>10g offerts !</b>
            </span>
          ) : (
            <span className="pf-punch-done">
              Félicitations ! Vous avez débloqué 10g offerts !
            </span>
          )}
        </p>
      </div>

      {/* Info */}
      <p className="pf-loyal-info">
        Chaque commande de 10g ou plus de fleurs compte pour la fidélité
      </p>
    </section>
  );
};

export default LoyaltyCard;
