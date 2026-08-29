import { Outlet, NavLink, Navigate, Link } from "react-router-dom";
import {
  Loader2,
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

const links = [
  { to: "/commercial/catalogue", label: "Catalogue & argumentaire", icon: BookOpen },
  { to: "/commercial/prospects", label: "Mes prospects", icon: Users },
  { to: "/commercial/facturation", label: "Facturation", icon: ReceiptEuro },
  { to: "/commercial/commissions", label: "Mes commissions", icon: Percent },
  { to: "/commercial/documents", label: "Documents", icon: FileDown },
];


const CommercialLayout = () => {
  const { user, isAdmin, isCommercial, loading } = useAuth();
  const { data: rep, isLoading: repLoading } = useMyRep();

  if (loading || repLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (!isAdmin && !isCommercial) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center gap-4">
        <ShieldAlert className="h-10 w-10 text-gold" />
        <h1 className="text-xl font-semibold gold-text">Espace commercial réservé</h1>
        <p className="text-sm text-muted-foreground max-w-md">
          Cet espace est réservé aux commerciaux terrain High Society Botanicals. Contacte-nous si
          tu souhaites rejoindre l'équipe.
        </p>
        <Button asChild>
          <Link to="/">Retour au site</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border/50 bg-card/40 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3 justify-between">
          <Link to="/" className="flex items-center gap-2 text-gold font-semibold">
            <Briefcase className="h-5 w-5" />
            Espace Commercial
          </Link>
          <div className="text-xs text-muted-foreground">
            {rep ? (
              <>
                {rep.full_name} · Commission {Number(rep.commission_percent)} % du CA HT
                {rep.zone ? ` · ${rep.zone}` : ""}
              </>
            ) : (
              "Accès administrateur"
            )}
          </div>
        </div>
        <nav className="max-w-7xl mx-auto px-4 pb-2 flex gap-1 overflow-x-auto">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )
              }
            >
              <l.icon className="h-4 w-4" />
              {l.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default CommercialLayout;
