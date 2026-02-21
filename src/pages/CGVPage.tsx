import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";

const CGVPage = () => {
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
            Conditions Générales de Vente
          </motion.h1>

          <motion.div
            className="space-y-10 text-muted-foreground font-body text-sm leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <section>
              <h2 className="font-display text-xl text-foreground mb-4">1. Objet</h2>
              <p>
                Les présentes Conditions Générales de Vente régissent les ventes de produits effectuées
                par la société SASU High Society Botanicals via le site highsocietybotanicals.lovable.app.
                Toute commande implique l'acceptation sans réserve de ces conditions.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-foreground mb-4">2. Produits</h2>
              <p>
                Les produits proposés sont des fleurs de collection issues de variétés Cannabis Sativa L.
                autorisées, dont la teneur en THC est inférieure à 0.3%, conformément à la réglementation
                en vigueur. Ils sont réservés aux personnes majeures (+18 ans).
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-foreground mb-4">3. Prix</h2>
              <p>
                Les prix sont indiqués en euros TTC. High Society Botanicals se réserve le droit de modifier
                ses prix à tout moment. Les produits sont facturés au tarif en vigueur au moment de la
                validation de la commande. Des tarifs préférentiels sont appliqués pour les clients professionnels validés.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-foreground mb-4">4. Commande</h2>
              <p>
                La commande est validée après confirmation du paiement. Un email de confirmation est envoyé
                au client. High Society Botanicals se réserve le droit de refuser toute commande pour motif
                légitime (stock insuffisant, suspicion de fraude, etc.).
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-foreground mb-4">5. Paiement</h2>
              <p>
                Le paiement s'effectue en ligne par les moyens de paiement proposés sur le site.
                Le paiement est sécurisé et traité par notre prestataire de paiement.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-foreground mb-4">6. Droit de rétractation</h2>
              <p>
                Conformément à l'article L.221-18 du Code de la consommation, vous disposez d'un délai
                de <strong className="text-foreground">14 jours</strong> à compter de la réception de votre commande pour exercer
                votre droit de rétractation, sans avoir à justifier de motif ni à payer de pénalité.
              </p>
              <p className="mt-3">
                Pour exercer ce droit, contactez-nous par email à contact@highsocietybotanicals.com.
                Les produits doivent être retournés dans leur état d'origine, non ouverts et dans leur
                emballage d'origine.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-foreground mb-4">7. Responsabilité</h2>
              <p>
                High Society Botanicals ne saurait être tenue responsable de l'inexécution du contrat
                en cas de force majeure, de rupture de stock, ou de tout événement indépendant de sa volonté.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-foreground mb-4">8. Litiges</h2>
              <p>
                Les présentes CGV sont soumises au droit français. En cas de litige, une solution amiable
                sera recherchée avant toute action judiciaire. À défaut, les tribunaux compétents de Paris
                seront seuls compétents.
              </p>
            </section>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CGVPage;
