import { Mail, MapPin, Instagram, Facebook } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useMinuitSkin } from "@/components/minuit/useMinuitSkin";
import { EmblemSprite, Emb, Live, NeonSign, Guichet, EngravedCard, WaxSeal } from "@/components/minuit/areas/contact/ContactDecor";
import "@/components/minuit/areas/contact/contact.css";

// « Le guichet de nuit » : enseigne néon, guichet de laiton, carte de visite gravée, lettre scellée.
const ContactPage = () => {
  useMinuitSkin("contact");

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {/* data-fx-off : le guichet gère ses propres animations (le kit hsb-fx ne découpe ni n'anime ces sections) */}
      <main className="pt-20 mnc" data-fx-off="">
        <EmblemSprite />

        <Live tag="section" className="mnc-front" threshold={0} labelledBy="mnc-t">
          <span className="mnc-halo" aria-hidden="true" />
          <div className="mnc-grid">
            <NeonSign />

            <div className="mnc-txt">
              <p className="mnc-kick mnc-rv">Nous Contacter</p>
              <h1 id="mnc-t" className="mnc-h1 mnc-rv mnc-d1">Contact</h1>
              <p className="mnc-sub mnc-rv mnc-d2">Le guichet de nuit</p>
              <p className="mnc-lead mnc-rv mnc-d3">
                Une question sur un lot, une commande, une analyse&nbsp;? Sonnez au guichet&nbsp;:
                <em> notre carte vous attend sur le comptoir.</em>
              </p>
            </div>

            {/* filet de 4 s : la carte (coordonnées) sort même si le seuil de 30 % reste hors d'atteinte */}
            <Live className="mnc-booth-col" threshold={0.3} fallbackMs={4000}>
              <Guichet />
              <EngravedCard>
                <div className="mnc-card-top">
                  <Emb className="mnc-card-emb" />
                  <span className="mnc-card-tag" aria-hidden="true">Guichet de nuit</span>
                </div>
                <p className="mnc-card-name">
                  <span className="mnc-card-hs">High Society</span>
                  <span className="mnc-card-bo">Botanicals</span>
                </p>
                <p className="mnc-card-role">Maison&nbsp;française · Collection&nbsp;N°&nbsp;26</p>
                <span className="mnc-card-rule" aria-hidden="true" />
                <ul className="mnc-card-lines">
                  <li>
                    <Mail aria-hidden="true" />
                    <span className="mnc-mail">contact@<wbr />highsocietybotanicals.com</span>
                  </li>
                  <li>
                    <MapPin aria-hidden="true" />
                    <span>Paris, France</span>
                  </li>
                </ul>

                <div className="mnc-card-social">
                  <a href="#" aria-label="Instagram">
                    <Instagram aria-hidden="true" />
                  </a>
                  <a href="#" aria-label="Facebook">
                    <Facebook aria-hidden="true" />
                  </a>
                </div>
              </EngravedCard>
            </Live>

            <div className="mnc-plate mnc-rv mnc-d4">
              <p className="mnc-plate-t">Au tableau du guichet</p>
              <dl>
                <div><dt>Expédition</dt><dd>discrète, 48&nbsp;h</dd></div>
                <div><dt>Main propre</dt><dd>autour du&nbsp;44</dd></div>
                <div><dt>Analyse laboratoire</dt><dd>sur demande</dd></div>
                <div><dt>Tous les 10&nbsp;g</dt><dd>kit et 1&nbsp;g offerts</dd></div>
                <div><dt>THC</dt><dd>&lt;&nbsp;0,3&nbsp;%</dd></div>
                <div><dt>Accès</dt><dd>réservé aux majeurs</dd></div>
              </dl>
            </div>
          </div>
        </Live>

        <Live tag="section" className="mnc-desk" threshold={0.12} labelledBy="mnc-l-t">
          <span className="mnc-beam" aria-hidden="true" />
          <article className="mnc-letter">
            <header className="mnc-lh">
              <Emb className="mnc-lh-emb" />
              <p className="mnc-lh-name">High Society Botanicals</p>
              <p className="mnc-lh-sub">Maison de nuit · Collection&nbsp;N°&nbsp;26</p>
            </header>

            <p className="mnc-date">Au guichet, à la nuit tombée</p>
            <h2 id="mnc-l-t" className="mnc-l-t">Écrire à la maison</h2>

            <div className="mnc-ruled">
              <p className="mnc-salut">Chère cliente, cher client,</p>
              <p>
                Écrivez-nous quand bon vous semble, à l'adresse gravée sur notre carte&nbsp;:{" "}
                <span className="mnc-mail">contact@<wbr />highsocietybotanicals.com</span>
              </p>
              <p>Pour une réponse précise, indiquez-nous simplement&nbsp;:</p>
              <ol className="mnc-list">
                <li><b>une commande</b>&nbsp;: son numéro et le nom indiqué à l'achat&nbsp;;</li>
                <li><b>une analyse laboratoire</b>&nbsp;: le nom du lot concerné (disponible sur demande)&nbsp;;</li>
                <li><b>une livraison</b>&nbsp;: votre ville, pour une expédition discrète en 48&nbsp;h ou une remise en main propre autour du&nbsp;44&nbsp;;</li>
                <li><b>un établissement</b>&nbsp;: son nom et sa ville, pour un échange entre professionnels.</li>
              </ol>
              <p>Avec nos salutations distinguées,</p>
            </div>

            <footer className="mnc-signoff">
              <div>
                <p className="mnc-sig">La Maison</p>
                <svg className="mnc-flourish" viewBox="0 0 160 16" aria-hidden="true">
                  <path d="M2 11C30 3 52 3 70 8s40 7 62-1c10-3 18-4 26-2" />
                </svg>
                <p className="mnc-sig-sub">High Society Botanicals</p>
              </div>
              <WaxSeal />
            </footer>

            <p className="mnc-ps">Réservé aux personnes majeures · THC&nbsp;&lt;&nbsp;0,3&nbsp;%</p>
          </article>
        </Live>
      </main>
      <Footer />
    </div>
  );
};

export default ContactPage;
