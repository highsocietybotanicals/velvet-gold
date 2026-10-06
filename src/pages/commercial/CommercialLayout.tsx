import { Outlet, NavLink, Navigate, Link } from "react-router-dom";
import {
  ShieldAlert,
  BookOpen,
  Users,
  Percent,
  FileDown,
  Briefcase,
  ReceiptEuro,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useMyRep } from "@/hooks/useCommercial";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import { cn } from "@/lib/utils";
import { useMinuitSkin } from "@/components/minuit/useMinuitSkin";
import RouteBand from "@/components/minuit/areas/commercial/RouteBand";
import SignRow from "@/components/minuit/areas/commercial/SignRow";
import "@/components/minuit/areas/commercial/commercial.css";

const links = [
  { to: "/commercial/catalogue", label: "Catalogue & argumentaire", icon: BookOpen },
  { to: "/commercial/prospects", label: "Mes prospects", icon: Users },
  { to: "/commercial/facturation", label: "Facturation", icon: ReceiptEuro },
  { to: "/commercial/commissions", label: "Mes commissions", icon: Percent },
  { to: "/commercial/documents", label: "Documents", icon: FileDown },
];


const CommercialLayout = () => {
  // Habillage « Minuit Carat » de l'espace commercial : la feuille de route (visuel uniquement).
  useMinuitSkin("commercial");
  const { user, isAdmin, isCommercial, loading } = useAuth();
  const { data: rep, isLoading: repLoading } = useMyRep();

  if (loading || repLoading) {
    return (
      <div className="cm-root min-h-screen bg-background flex items-center justify-center" data-fx-off="">
        <div className="cm-radar" role="status" aria-label="Chargement de l'espace commercial">
          <span className="cm-radar-sw" aria-hidden="true" />
          <span className="cm-radar-dot" aria-hidden="true" />
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (!isAdmin && !isCommercial) {
    return (
      <main
        className="cm-root cm-gate min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center gap-4"
        data-fx-off=""
      >
        <span className="cm-noentry" aria-hidden="true">
          <ShieldAlert className="h-10 w-10 text-gold" />
        </span>
        <h1 className="cm-gate-t">Espace commercial réservé</h1>
        <p className="text-sm text-muted-foreground max-w-md">
          Cet espace est réservé aux commerciaux terrain High Society Botanicals. Contactez-nous si
          vous souhaitez rejoindre l'équipe.
        </p>
        <Button asChild>
          <Link to="/">Retour au site</Link>
        </Button>
      </main>
    );
  }

  return (
    // data-fx-off : la feuille de route gère ses propres animations (le kit hsb-fx ne découpe ni n'anime rien ici)
    <div className="cm-root min-h-screen bg-background flex flex-col" data-fx-off="">
      <header className="cm-head">
        <RouteBand>
          <div className="cm-brandrow">
            <Link to="/" className="cm-brand">
              <Briefcase aria-hidden="true" />
              Espace Commercial
            </Link>
            <div className="cm-rep">
              <span>
                {rep ? (
                  <>
                    <span className="cm-rep-n">{rep.full_name}</span> · Commission{" "}
                    {Number(rep.commission_percent)} % du CA HT
                    {rep.zone ? ` · ${rep.zone}` : ""}
                  </>
                ) : (
                  "Accès administrateur"
                )}
              </span>
            </div>
          </div>
          <div className="cm-hero">
            <span className="cm-neon" aria-hidden="true">
              High Society
            </span>
            <p className="cm-hero-t">La feuille de route</p>
            <p className="cm-hero-s">
              <span>Tournées terrain</span>
              <span>Collection N° 26</span>
              <span>Départ Abbaretz · 44</span>
            </p>
          </div>
        </RouteBand>
        <SignRow>
          {links.map((l, i) => (
            <NavLink
              key={l.to}
              to={l.to}
              style={{ ["--i" as string]: i }}
              className={({ isActive }) => cn("cm-sign", isActive && "is-on")}
            >
              <span className="cm-sign-no" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <l.icon className="cm-sign-ic" aria-hidden="true" />
              <span className="cm-sign-l">{l.label}</span>
              <span className="cm-sign-post" aria-hidden="true" />
            </NavLink>
          ))}
        </SignRow>
      </header>

      <main className="cm-main flex-1 w-full max-w-7xl mx-auto px-4">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default CommercialLayout;
