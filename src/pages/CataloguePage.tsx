import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, Grid, List, Search } from "lucide-react";
import { ProductCategory } from "@/data/products";
import { accessories } from "@/data/accessories";
import { useCatalogProducts } from "@/hooks/useCatalogProducts";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useMinuitSkin } from "@/components/minuit/useMinuitSkin";
import CoffreVault from "@/components/minuit/areas/coffre/CoffreVault";
import CoffreLocker from "@/components/minuit/areas/coffre/CoffreLocker";
import { LITE } from "@/components/minuit/areas/coffre/useInViewAttr";
import "@/components/minuit/areas/coffre/coffre.css";

type ViewMode = "grid" | "list";
type SortOption = "name" | "price-asc" | "price-desc" | "cbd";
type CategoryFilter = "all" | ProductCategory | "accessoire" | "force-noire" | "exotique";

const CataloguePage = () => {
  useMinuitSkin("coffre");
  const { all: allProducts, forceNoire: forceNoireProducts, exotique: exotiqueProducts } = useCatalogProducts();
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const [showFilters, setShowFilters] = useState(false);




  const filteredProducts = useMemo(() => {
    if (category === "accessoire") return [];
    if (category === "force-noire") {
      let products = [...forceNoireProducts];
      if (searchQuery) {
        products = products.filter(
          (p) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      return products;
    }
    if (category === "exotique") {
      let products = [...exotiqueProducts];
      if (searchQuery) {
        products = products.filter(
          (p) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      return products;
    }

    let products = allProducts;

    // Filter by category
    if (category !== "all") {
      products = products.filter((p) => p.category === category);
    }

    // Filter by search
    if (searchQuery) {
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    switch (sortBy) {
      case "price-asc":
        products = [...products].sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        products = [...products].sort((a, b) => b.price - a.price);
        break;
      case "cbd":
        products = [...products].sort(
          (a, b) =>
            parseFloat(b.cbdPercentage) - parseFloat(a.cbdPercentage)
        );
        break;
      default:
        products = [...products].sort((a, b) => a.name.localeCompare(b.name));
    }

    return products;
  }, [allProducts, category, searchQuery, sortBy]);

  const filteredAccessories = useMemo(() => {
    if (category !== "all" && category !== "accessoire") return [];

    let items = [...accessories];

    // Filter by search
    if (searchQuery) {
      items = items.filter(
        (a) =>
          a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    switch (sortBy) {
      case "price-asc":
        items = items.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        items = items.sort((a, b) => b.price - a.price);
        break;
      default:
        items = items.sort((a, b) => a.name.localeCompare(b.name));
    }

    return items;
  }, [category, searchQuery, sortBy]);

  const totalResults = filteredProducts.length + filteredAccessories.length;

  return (
    <div className={`cf-page min-h-screen${LITE ? " cf-lite" : ""}`}>
      <Header />

      {/* data-fx-off : la salle des coffres gère ses propres animations (porte, casiers) */}
      <main className="cf-main" data-fx-off="">
        {/* Header : la porte du coffre s'ouvre sur le titre */}
        <CoffreVault />

        <div className="cf-wrap" id="casiers">
          <div className="cf-sec-hd">
            <div>
              <p className="cf-kicker">Collection N° 26</p>
              <h2 className="cf-h2">
                <span className="a">Les</span> <span className="b">casiers</span>
              </h2>
            </div>
            <p className="cf-sec-lead">Chaque casier renferme un lot. Ouvrez-le pour choisir votre grammage sur sa fiche.</p>
          </div>

          {/* Toolbar */}
          <div className="cf-console">
            {/* Search */}
            <div className="cf-search">
              <Search className="cf-search-ico" aria-hidden="true" />
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Rechercher un produit"
                className="cf-in"
              />
            </div>

            {/* Category tabs - Accessoires masqué temporairement */}
            <div className="cf-tabs">
              {[
                { key: "all", label: "Tous" },
                { key: "fleur", label: "Fleurs" },
                { key: "resine", label: "Résines" },
                { key: "force-noire", label: "⚡ Force Noire" },
                { key: "exotique", label: "💎 Exotique" },
                // { key: "accessoire", label: "Accessoires" }, // Masqué - rupture de stock
              ].map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setCategory(cat.key as CategoryFilter)}
                  aria-pressed={category === cat.key}
                  className={`cf-tab${category === cat.key ? " is-on" : ""}`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* View & Filter */}
            <div className="cf-knobs">
              <button
                onClick={() => setShowFilters(!showFilters)}
                aria-label={showFilters ? "Masquer les filtres" : "Afficher les filtres"}
                aria-pressed={showFilters}
                className="cf-knob"
              >
                <Filter aria-hidden="true" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                aria-label="Afficher en grille"
                aria-pressed={viewMode === "grid"}
                className="cf-knob"
              >
                <Grid aria-hidden="true" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                aria-label="Afficher en liste"
                aria-pressed={viewMode === "list"}
                className="cf-knob"
              >
                <List aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Filter panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="cf-drawer"
              >
                <div className="cf-drawer-in">
                  <div className="cf-drawer-row">
                    <div>
                      <label htmlFor="cf-sort" className="cf-sort-label">
                        Trier par
                      </label>
                      <select
                        id="cf-sort"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        className="cf-sort"
                      >
                        <option value="name">Nom</option>
                        <option value="price-asc">Prix croissant</option>
                        <option value="price-desc">Prix décroissant</option>
                        {category !== "accessoire" && (
                          <option value="cbd">Taux CBD</option>
                        )}
                      </select>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results count */}
          <p className="cf-count">
            {totalResults} produit{totalResults > 1 ? "s" : ""} trouvé{totalResults > 1 ? "s" : ""}
          </p>

          {/* Product Grid */}
          <motion.div
            layout
            className={
              viewMode === "grid"
                ? "cf-grid"
                : "cf-list"
            }
          >
            <AnimatePresence mode="popLayout">
              {/* Flowers & Resins */}
              {filteredProducts.map((product, index) => (
                <CoffreLocker key={product.id} product={product} index={index} layout={viewMode} />
              ))}

              {/* Accessories - Masqué temporairement - rupture de stock */}
              {/* {filteredAccessories.map((accessory, index) => (
                ... code conservé pour réactivation future ...
              ))} */}
            </AnimatePresence>
          </motion.div>

          {totalResults === 0 && (
            <div className="cf-empty">
              <div className="cf-empty-box" aria-hidden="true">
                <span className="door" />
                <span className="lamp" />
              </div>
              <p className="cf-empty-t">
                Aucun produit trouvé
              </p>
              <button
                onClick={() => {
                  setCategory("all");
                  setSearchQuery("");
                }}
                className="cf-reset"
              >
                Réinitialiser les filtres
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CataloguePage;
