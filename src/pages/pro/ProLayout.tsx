import { Outlet, Navigate, Link } from "react-router-dom";
import { Loader2, ShieldAlert } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ProCartProvider } from "@/contexts/ProCartContext";
import ProHeader from "@/components/pro/ProHeader";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";

const ProLayout = () => {
  const { user, isPro, isProValidated, isAdmin, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  const hasAccess =
    isAdmin || (isPro && isProValidated && !!profile?.vat_number && profile?.is_vat_validated);

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center gap-4">
        <ShieldAlert className="h-10 w-10 text-gold" />
        <h1 className="text-xl font-semibold gold-text">Compte partenaire en cours de validation</h1>
        <p className="text-sm text-muted-foreground max-w-md">
          Ton accès à l'espace professionnel sera ouvert dès que ton SIRET et ton numéro de TVA
          intracommunautaire auront été vérifiés (24 à 48 h ouvrées).
        </p>
        <div className="flex gap-3">
          <Button asChild variant="outline">
            <Link to="/pro">Compléter mon dossier</Link>
          </Button>
          <Button asChild>
            <Link to="/">Retour au site</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ProCartProvider>
      <div className="min-h-screen bg-background flex flex-col">
        <ProHeader />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6">
          <Outlet />
        </main>
        <Footer />
      </div>
    </ProCartProvider>
  );
};

export default ProLayout;
