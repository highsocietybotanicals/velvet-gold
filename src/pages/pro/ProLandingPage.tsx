import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ProPartnerApplyForm from "@/components/pro/ProPartnerApplyForm";
import { Package, ShieldCheck, Gift, Leaf, FlaskConical, Truck } from "lucide-react";

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
    title: "100 % légal, dossier complet",
    text: "Analyses laboratoire, traçabilité et documents à jour fournis avec chaque commande.",
  },
  {
    icon: FlaskConical,
    title: "CBD moléculaire de niche",
    text: "Sélection indoor haut de gamme : des produits qui fidélisent une clientèle exigeante.",
  },
  {
    icon: Truck,
    title: "Tarif dégressif au volume",
    text: "Le prix au gramme baisse sur l'intégralité de la commande dès que tu franchis un palier.",
  },
];

const ProLandingPage = () => {
  const { isPro, isProValidated, profile, isAdmin } = useAuth();
  const hasAccess =
    isAdmin || (isPro && isProValidated && !!profile?.vat_number && profile?.is_vat_validated);

  useEffect(() => {
    document.title = "Espace Pro revendeur | High Society Botanicals";
    const desc = document.querySelector('meta[name="description"]');
    if (desc)
      desc.setAttribute(
        "content",
        "Grille tarifaire revendeur High Society Botanicals : préconditionnés 1 g à 10 g, pochons alu hermétiques, Boveda 62 %, tarifs dégressifs au volume."
      );
  }, []);

  return (
    <div className="min-h-screen bg-background">


      <section className="max-w-5xl mx-auto px-4 pt-24 pb-12 text-center">
        <p className="text-xs tracking-[0.3em] text-gold uppercase mb-4">Partenaires revendeurs</p>
        <h1 className="text-3xl md:text-5xl font-bold gold-text mb-5">
          L'espace professionnel High Society Botanicals
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Un catalogue dédié, des tarifs au gramme dégressifs selon le volume, et des
          préconditionnés prêts à poser en vitrine. Réservé aux professionnels disposant d'un SIRET
          et d'un numéro de TVA intracommunautaire.
        </p>
        <div className="mt-8 flex justify-center gap-3">
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
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {arguments_.map((a) => (
          <Card key={a.title} className="bg-card/60 border-border/50">
            <CardContent className="pt-6 space-y-2">
              <a.icon className="h-5 w-5 text-gold" />
              <h2 className="font-semibold text-sm">{a.title}</h2>
              <p className="text-sm text-muted-foreground">{a.text}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section id="dossier" className="max-w-3xl mx-auto px-4 pb-24">
        <h2 className="text-xl font-semibold gold-text mb-4">Ouvrir un compte partenaire</h2>
        <ProPartnerApplyForm />
      </section>
    </div>
  );
};

export default ProLandingPage;
