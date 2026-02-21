import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";

const MentionsLegalesPage = () => {
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
            Mentions Légales
          </motion.h1>

          <motion.div
            className="space-y-10 text-muted-foreground font-body text-sm leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <section>
              <h2 className="font-display text-xl text-foreground mb-4">1. Éditeur du site</h2>
              <p>
                Le site <strong className="text-foreground">highsocietybotanicals.lovable.app</strong> est édité par :<br />
                <strong className="text-foreground">SASU High Society Botanicals</strong><br />
                Capital social : 1 €<br />
                Siège social : Paris, France<br />
                Email : contact@highsocietybotanicals.com
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-foreground mb-4">2. Directeur de la publication</h2>
              <p>Le directeur de la publication est le représentant légal de la société SASU High Society Botanicals.</p>
            </section>

            <section>
              <h2 className="font-display text-xl text-foreground mb-4">3. Hébergement</h2>
              <p>
                Le site est hébergé par :<br />
                Lovable (Lovable Technologies)<br />
                Les informations de contact de l'hébergeur sont disponibles sur leur site officiel.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-foreground mb-4">4. Propriété intellectuelle</h2>
              <p>
                L'ensemble des contenus présents sur ce site (textes, images, logos, graphismes, icônes, etc.)
                sont la propriété exclusive de High Society Botanicals ou de ses partenaires. Toute reproduction,
                représentation, modification ou exploitation, totale ou partielle, de ces contenus est strictement
                interdite sans autorisation écrite préalable.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-foreground mb-4">5. Responsabilité</h2>
              <p>
                High Society Botanicals s'efforce de fournir des informations exactes et à jour sur ce site.
                Toutefois, la société ne saurait être tenue responsable des erreurs, omissions ou résultats
                obtenus suite à l'utilisation de ces informations.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-foreground mb-4">6. Produits</h2>
              <p>
                Tous les produits proposés sur ce site sont des fleurs de collection issues de variétés
                Cannabis Sativa L. autorisées, conformément à la réglementation en vigueur. Leur teneur
                en THC est inférieure à 0.3%. La vente est réservée aux personnes majeures (+18 ans).
              </p>
            </section>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MentionsLegalesPage;
