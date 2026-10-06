import { NavLink, Link } from "react-router-dom";
import { ShoppingCart, FileText, Home } from "lucide-react";
import { useProCart } from "@/contexts/ProCartContext";
import { Badge } from "@/components/ui/badge";
import { emblemSvg } from "@/components/minuit/areas/pro/proEmblem";

// Barre de laiton du salon privé : onglets gravés, onglet actif en néon (voir areas/pro/pro.css).
const linkCls = ({ isActive }: { isActive: boolean }) =>
  `pr-tab${isActive ? " is-active" : ""}`;

const ProHeader = () => {
  const { totalUnits } = useProCart();

  return (
    <header className="pr-brass sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link to="/pro/catalogue" className="pr-brass-brand flex items-center gap-2 shrink-0">
          <span className="pr-brass-emb" aria-hidden="true" dangerouslySetInnerHTML={{ __html: emblemSvg }} />
          <span className="pr-brass-name">
            <span className="pr-brass-hsb">HSB</span>{" "}
            <span className="pr-brass-sub">Espace Pro</span>
          </span>
        </Link>

        <nav className="pr-brass-nav flex items-center gap-1 overflow-x-auto min-w-0">
          {/* .pr-tab-l : libellé du tube néon (seule son opacité s'anime à l'allumage) */}
          <NavLink to="/pro/catalogue" className={linkCls}>
            <span className="pr-tab-l">Catalogue</span>
          </NavLink>
          <NavLink to="/pro/panier" className={linkCls}>
            <span className="pr-tab-l">
              <ShoppingCart className="h-4 w-4" />
              Panier
              {totalUnits > 0 && (
                <Badge variant="secondary" className="pr-tab-count ml-1">
                  {totalUnits}
                </Badge>
              )}
            </span>
          </NavLink>
          <NavLink to="/pro/commandes" className={linkCls} aria-label="Commandes & devis">
            <span className="pr-tab-l">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Commandes & devis</span>
            </span>
          </NavLink>
          <Link to="/" className="pr-tab is-site" aria-label="Site">
            <Home className="h-4 w-4" />
            <span className="hidden md:inline">Site</span>
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default ProHeader;
