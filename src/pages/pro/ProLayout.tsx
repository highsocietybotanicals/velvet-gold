import { Outlet, Navigate, Link } from "react-router-dom";
import { Loader2, ShieldAlert } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ProCartProvider } from "@/contexts/ProCartContext";
import ProHeader from "@/components/pro/ProHeader";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import { useMinuitSkin } from "@/components/minuit/useMinuitSkin";
import ProMemberCard from "@/components/minuit/areas/pro/ProMemberCard";
import "@/components/minuit/areas/pro/pro.css";

const ProLayout = () => {
  // Habillage « Minuit Carat » de l'espace pro : le salon privé (visuel uniquement).
  useMinuitSkin("pro");
  const { user, isPro, isProValidated, isAdmin, isCommercial, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="pr-wait min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
        <p className="pr-wait-t">Ouverture du salon…</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  const hasAccess =
    isAdmin || isCommercial || (isPro && isProValidated && !!profile?.vat_number && profile?.is_vat_validated);

  if (!hasAccess) {
    return (
      <main
        className="pr-gate min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center gap-4"
        data-fx-off=""
      >
        <div className="pr-gate-card">
          <ProMemberCard holder={profile?.company_name} pending />
        </div>
        <ShieldAlert className="pr-gate-ico h-6 w-6" aria-hidden="true" />
        <h1 className="pr-gate-t">Compte partenaire en cours de validation</h1>
        <p className="pr-gate-p max-w-md">
          Ton accès à l'espace professionnel sera ouvert dès que ton SIRET et ton numéro de TVA
          intracommunautaire auront été vérifiés (24 à 48 h ouvrées).
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild variant="outline">
            <Link to="/pro">Compléter mon dossier</Link>
          </Button>
          <Button asChild>
            <Link to="/">Retour au site</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <ProCartProvider>
      <div className="pr-shell min-h-screen bg-background flex flex-col">
        <ProHeader />
        {/* data-fx-off : le salon privé gère ses propres animations (le kit hsb-fx ne découpe ni n'anime rien ici) */}
        <main className="pr-main flex-1 w-full max-w-7xl mx-auto px-4 py-6" data-fx-off="">
          <Outlet />
        </main>
        <Footer />
      </div>
    </ProCartProvider>
  );
};

export default ProLayout;
