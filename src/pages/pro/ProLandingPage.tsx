import { useEffect, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ProPartnerApplyForm from "@/components/pro/ProPartnerApplyForm";
import { Package, ShieldCheck, Gift, Leaf, FlaskConical, Truck } from "lucide-react";
import { useMinuitSkin } from "@/components/minuit/useMinuitSkin";
import ProMemberCard from "@/components/minuit/areas/pro/ProMemberCard";
import { ProReveal, ProVelvetRope } from "@/components/minuit/areas/pro/ProDecor";
import "@/components/minuit/areas/pro/pro.css";
import Title3D from "@/components/Title3D";
import {
  KIT_DEDUCTION_DAYS,
  KIT_PRICE_HT,
  KIT_UNITS,
  PRO_MIN_ORDER_HT,
} from "@/lib/proOffer";

const arguments_ = [
  {
    icon: Package,
    title: "Préconditionné 1 g · 2,5 g · 5 g · 10 g",
    text: "Pochons aluminium qualité alimentaire, hermétiques, à l'égérie de la marque. Vitrine prête à vendre.",
  },
  {
    icon: Leaf,
    title: "Boveda 62 % dans chaque pochon",
    text: "Hygrométrie maîtrisée : terpènes préservés, texture intacte, aucune perte en rayon.",
  },
  {
    icon: Gift,
    title: "Cadeaux client inclus",
    text: "Chaque pochon de 10 g contient un briquet BIC et un paquet de feuilles avec carton. Zéro centime en plus pour toi.",
  },
  {
    icon: ShieldCheck,
    // Texte d'origine reformulé pour la conformité (pas d'affirmation absolue ; analyses sur demande) : à valider par la cliente.
    title: "Conforme, dossier complet",
    text: "THC < 0,3 %. Analyses laboratoire, traçabilité et documents à jour disponibles sur demande.",
  },
  {
    icon: FlaskConical,
    title: "CBD haut de gamme",
    text: "Sélection indoor haut de gamme : des produits qui fidélisent une clientèle exigeante.",
  },
  {
    icon: Truck,
    title: "Ta marge affichée en direct",
    text: "Dans ton panier pro, le gain HT de chaque ligne s'affiche au prix de revente du site, TVA déduite.",
  },
];

// Conditions de l'offre revendeur, affichées avant l'inscription
const conditions = [
  {
    title: "Prix pro : 50 % du prix public HT",
    text: "Tu revends aux prix du site : x2 sur les pochons de 1 g, 2,5 g et 5 g, x1,7 sur le 10 g. Pochon, Boveda 62 % et étiquette inclus, sans supplément.",
  },
  {
    title: `Kit découverte : ${KIT_PRICE_HT} € HT`,
    text: `${KIT_UNITS} pochons de 1 g, variétés au choix, pour goûter avant de te lancer. Déduit de ta première commande passée dans les ${KIT_DEDUCTION_DAYS} jours.`,
  },
  {
    title: `Minimum ${PRO_MIN_ORDER_HT} € HT, port offert dès 300 € HT`,
    text: "Règlement par virement à la commande, expédition dès réception. Pas de dépôt-vente, pas d'engagement de volume.",
  },
];

const steps = [
  "Crée ton compte en 2 minutes (e-mail et mot de passe).",
  "Complète ton dossier : SIRET, numéro de TVA, adresse. Validation sous 24 à 48 h ouvrées.",
  "Commande en ligne, règle par virement : on expédie dès réception.",
];

const ProLandingPage = () => {
  // Habillage « Minuit Carat » de l'espace pro : le salon privé (visuel uniquement).
  useMinuitSkin("pro");
  const { user, isPro, isProValidated, profile, isAdmin, isCommercial } = useAuth();
  const hasAccess =
    isAdmin || isCommercial || (isPro && isProValidated && !!profile?.vat_number && profile?.is_vat_validated);

  useEffect(() => {
    document.title = "Espace Pro revendeur | High Society Botanicals";
    const desc = document.querySelector('meta[name="description"]');
    if (desc)
      desc.setAttribute(
        "content",
        "Grille tarifaire revendeur High Society Botanicals : préconditionnés 1 g à 10 g, pochons alu hermétiques, Boveda 62 %, prix pro à 50 % du prix public HT."
      );
  }, []);

  return (
    // data-fx-off : le salon privé gère ses propres animations (le kit hsb-fx ne découpe ni n'anime rien ici)
    <main className="pr-salon min-h-screen" data-fx-off="">
      {/* Le salon privé : enseigne au néon, carte de membre en métal noir sous le projecteur */}
      <section className="pr-hero" aria-labelledby="pr-hero-t">
        <div className="pr-hero-grid">
          <div className="pr-hero-copy">
            <span className="pr-neon-sign" aria-hidden="true">
              High Society
            </span>
            <p className="pr-kicker">Partenaires revendeurs</p>
            <h1 id="pr-hero-t">
              L'espace professionnel{" "}
              <span className="pr-h1-brand pr-foil">High Society Botanicals</span>
            </h1>
            <p className="pr-lead">
              Un catalogue dédié, un prix d'achat à 50 % du prix public HT, et des
              préconditionnés prêts à poser en vitrine. Réservé aux professionnels disposant d'un SIRET
              et d'un numéro de TVA intracommunautaire.
            </p>
            <div className="pr-cta">
              {hasAccess ? (
                <Button asChild size="lg">
                  <Link to="/pro/catalogue">Accéder au catalogue pro</Link>
                </Button>
              ) : (
                <Button asChild size="lg">
                  <a href="#dossier">Devenir partenaire</a>
                </Button>
              )}
            </div>
            <p className="pr-hero-note">
              Maison française · <b>Abbaretz, Loire-Atlantique</b> · Sélection à la main ·{" "}
              <b>THC &lt; 0,3 %</b>
            </p>
          </div>

          <div className="pr-hero-card">
            <ProMemberCard holder={hasAccess ? profile?.company_name : null} />
            <p className="pr-hero-cap" aria-hidden="true">
              Carte de membre · <b>Salon privé</b>
            </p>
          </div>
        </div>
      </section>

      <ProVelvetRope label="Sur dossier · Professionnels" />

      {/* Les privilèges du salon */}
      <section className="pr-privs" aria-labelledby="pr-privs-t">
        <ProReveal>
          <div className="pr-sec-hd" data-pr-reveal="">
            <div>
              <p className="pr-kicker">Les privilèges du salon</p>
              <h2 id="pr-privs-t">Ce que la maison met en vitrine</h2>
            </div>
            <p className="pr-sec-aside">
              Des pochons prêts à poser, une sélection faite à la main à Abbaretz, une grille
              tarifaire lisible au gramme.
            </p>
          </div>
          <div className="pr-privs-grid">
            {arguments_.map((a, i) => (
              <Card
                key={a.title}
                className="pr-priv"
                data-pr-reveal=""
                style={{ "--i": i % 3 } as CSSProperties}
              >
                <CardContent className="pr-priv-in">
                  <span className="pr-priv-no" aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="pr-coin" aria-hidden="true">
                    <a.icon className="h-5 w-5" />
                  </span>
                  <h3>{a.title}</h3>
                  <p>{a.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </ProReveal>
      </section>

      {/* Conditions et démarche, lisibles avant l'inscription */}
      <section className="pr-privs" aria-labelledby="pr-cond-t">
        <div className="pr-sec-hd">
          <div>
            <p className="pr-kicker">Conditions partenaire</p>
            <span id="pr-cond-t">
              <Title3D>Commander en trois étapes</Title3D>
            </span>
          </div>
          <ol className="pr-sec-aside list-decimal pl-5 space-y-1">
            {steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </div>
        <div className="pr-privs-grid">
          {conditions.map((c) => (
            <Card key={c.title} className="pr-priv">
              <CardContent className="pr-priv-in">
                <h3>{c.title}</h3>
                <p>{c.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="pr-cta mt-6">
          {hasAccess ? (
            <Button asChild size="lg">
              <Link to="/pro/catalogue">Accéder au catalogue pro</Link>
            </Button>
          ) : user ? (
            <Button asChild size="lg">
              <a href="#dossier">Compléter mon dossier</a>
            </Button>
          ) : (
            <Button asChild size="lg">
              <Link to="/auth?inscription=pro&next=/pro">Créer mon compte pro</Link>
            </Button>
          )}
        </div>
      </section>

      {/* Dossier d'admission */}
      <section id="dossier" className="pr-dossier" aria-labelledby="pr-dossier-t">
        <div className="pr-dossier-frame">
          <p className="pr-kicker">Admission au salon</p>
          <h2 id="pr-dossier-t">Ouvrir un compte partenaire</h2>
          <ProPartnerApplyForm />
        </div>
      </section>
    </main>
  );
};

export default ProLandingPage;
