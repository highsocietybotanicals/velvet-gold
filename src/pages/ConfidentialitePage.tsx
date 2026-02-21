import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";

const ConfidentialitePage = () => {
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
            Politique de Confidentialité
          </motion.h1>

          <motion.div
            className="space-y-10 text-muted-foreground font-body text-sm leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <section>
              <h2 className="font-display text-xl text-foreground mb-4">1. Collecte des données</h2>
              <p>
                Dans le cadre de la création de votre compte et de vos commandes, nous collectons les
                données suivantes : nom, prénom, adresse email, numéro de téléphone, adresse de livraison,
                et le cas échéant, numéro SIRET et numéro de TVA intracommunautaire pour les comptes professionnels.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-foreground mb-4">2. Utilisation des données</h2>
              <p>Vos données personnelles sont utilisées pour :</p>
              <ul className="list-disc list-inside mt-3 space-y-2">
                <li>La gestion de votre compte client</li>
                <li>Le traitement et le suivi de vos commandes</li>
                <li>La livraison de vos produits</li>
                <li>La gestion du programme de fidélité</li>
                <li>L'envoi d'informations commerciales (avec votre consentement)</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-xl text-foreground mb-4">3. Cookies</h2>
              <p>
                Ce site utilise des cookies techniques nécessaires au bon fonctionnement du site
                (authentification, panier d'achat). Aucun cookie publicitaire ou de traçage tiers
                n'est utilisé sans votre consentement explicite.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-foreground mb-4">4. Conservation des données</h2>
              <p>
                Vos données personnelles sont conservées pendant la durée de votre relation commerciale
                avec nous, puis pendant une durée de 3 ans à compter de votre dernière commande,
                conformément aux obligations légales.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-foreground mb-4">5. Vos droits (RGPD)</h2>
              <p>Conformément au Règlement Général sur la Protection des Données, vous disposez des droits suivants :</p>
              <ul className="list-disc list-inside mt-3 space-y-2">
                <li><strong className="text-foreground">Droit d'accès</strong> : obtenir une copie de vos données personnelles</li>
                <li><strong className="text-foreground">Droit de rectification</strong> : corriger des données inexactes</li>
                <li><strong className="text-foreground">Droit de suppression</strong> : demander l'effacement de vos données</li>
                <li><strong className="text-foreground">Droit à la portabilité</strong> : recevoir vos données dans un format structuré</li>
                <li><strong className="text-foreground">Droit d'opposition</strong> : vous opposer au traitement de vos données</li>
              </ul>
              <p className="mt-4">
                Pour exercer ces droits, contactez-nous à : <strong className="text-foreground">contact@highsocietybotanicals.com</strong>
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-foreground mb-4">6. Sécurité</h2>
              <p>
                Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles appropriées
                pour protéger vos données contre tout accès non autorisé, modification, divulgation ou destruction.
              </p>
            </section>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ConfidentialitePage;
