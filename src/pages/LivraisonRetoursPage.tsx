import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Truck, HandCoins, RotateCcw, Clock } from "lucide-react";

const LivraisonRetoursPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-28 pb-20">
        <div className="container mx-auto px-6 max-w-4xl">
          <motion.h1
            className="font-display text-4xl md:text-5xl text-primary mb-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Livraison & Retours
          </motion.h1>

          {/* Icons summary */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {[
              { icon: Truck, label: "Envoi postal", sub: "France métropolitaine" },
              { icon: HandCoins, label: "Remise en main propre", sub: "Rayon 100km" },
              { icon: Clock, label: "Expédition rapide", sub: "48-72h ouvrées" },
              { icon: RotateCcw, label: "Retours", sub: "14 jours" },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="text-center p-4 rounded-xl border border-border/30 bg-card/50">
                <Icon className="w-8 h-8 text-primary mx-auto mb-3" />
                <p className="text-foreground font-display text-sm">{label}</p>
                <p className="text-muted-foreground text-xs mt-1">{sub}</p>
              </div>
            ))}
          </motion.div>

          <motion.div
            className="space-y-10 text-muted-foreground font-body text-sm leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <section>
              <h2 className="font-display text-xl text-foreground mb-4">1. Modes de livraison</h2>
              <h3 className="font-display text-lg text-primary/80 mb-3">Envoi postal standard</h3>
              <p>
                Livraison en France métropolitaine via un service d'envoi postal suivi.
                Les commandes sont expédiées sous 48 à 72 heures ouvrées après confirmation du paiement.
              </p>

              <h3 className="font-display text-lg text-primary/80 mb-3 mt-6">Remise en main propre</h3>
              <p>
                Disponible dans un <strong className="text-foreground">rayon de 100 km autour de Puceul (44170)</strong>.
                Ce mode de livraison est réservé aux :
              </p>
              <ul className="list-disc list-inside mt-3 space-y-2">
                <li>Clients professionnels (compte Pro validé)</li>
                <li>Commandes d'un poids total supérieur ou égal à 100g</li>
              </ul>
              <p className="mt-3">
                Un rendez-vous sera convenu par téléphone ou email après validation de la commande.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-foreground mb-4">2. Frais de livraison</h2>
              <p>
                Les frais de livraison sont calculés en fonction du poids de la commande et du mode
                de livraison choisi. Ils sont affichés avant la validation de la commande.
                La remise en main propre est gratuite.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-foreground mb-4">3. Suivi de commande</h2>
              <p>
                Un numéro de suivi vous est communiqué par email dès l'expédition de votre colis.
                Vous pouvez également suivre l'état de votre commande depuis votre espace client.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-foreground mb-4">4. Politique de retour</h2>
              <p>
                Conformément à la législation, vous disposez d'un délai de <strong className="text-foreground">14 jours</strong> à
                compter de la réception pour retourner un produit. Les conditions suivantes s'appliquent :
              </p>
              <ul className="list-disc list-inside mt-3 space-y-2">
                <li>Le produit doit être retourné dans son emballage d'origine, non ouvert</li>
                <li>Les frais de retour sont à la charge du client</li>
                <li>Le remboursement est effectué dans un délai de 14 jours après réception du retour</li>
              </ul>
              <p className="mt-4">
                Pour toute demande de retour, contactez-nous à : <strong className="text-foreground">contact@highsocietybotanicals.com</strong>
              </p>
            </section>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default LivraisonRetoursPage;
