import { NavLink, Link } from "react-router-dom";
import { Store, ShoppingCart, FileText, Home } from "lucide-react";
import { useProCart } from "@/contexts/ProCartContext";
import { Badge } from "@/components/ui/badge";

const linkCls = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
    isActive ? "bg-muted text-gold" : "text-muted-foreground hover:text-foreground"
  }`;

const ProHeader = () => {
  const { totalUnits } = useProCart();

  return (
    <header className="border-b border-border/40 bg-background/95 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link to="/pro/catalogue" className="flex items-center gap-2 shrink-0">
          <Store className="h-5 w-5 text-gold" />
          <span className="font-semibold tracking-wide">
            <span className="gold-text">HSB</span>{" "}
            <span className="text-muted-foreground text-sm">Espace Pro</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 overflow-x-auto">
          <NavLink to="/pro/catalogue" className={linkCls}>
            Catalogue
          </NavLink>
          <NavLink to="/pro/panier" className={linkCls}>
            <ShoppingCart className="h-4 w-4" />
            Panier
            {totalUnits > 0 && (
              <Badge variant="secondary" className="ml-1">
                {totalUnits}
              </Badge>
            )}
          </NavLink>
          <NavLink to="/pro/commandes" className={linkCls}>
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Commandes & devis</span>
          </NavLink>
          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground"
          >
            <Home className="h-4 w-4" />
            <span className="hidden md:inline">Site</span>
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default ProHeader;
