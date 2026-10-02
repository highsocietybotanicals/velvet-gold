import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, Grid, List, Search } from "lucide-react";
import { ProductCategory } from "@/data/products";
import { accessories } from "@/data/accessories";
import { useCatalogProducts } from "@/hooks/useCatalogProducts";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import Title3D from "@/components/Title3D";

type ViewMode = "grid" | "list";
type SortOption = "name" | "price-asc" | "price-desc" | "cbd";
type CategoryFilter = "all" | ProductCategory | "accessoire" | "force-noire" | "exotique";

const CataloguePage = () => {
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
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <Title3D as="h1" className="mb-4 text-4xl md:text-5xl">Le Coffre</Title3D>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Découvrez notre collection complète de fleurs, résines CBD et accessoires
              d'exception, sélectionnés avec soin pour les connaisseurs.
            </p>
          </motion.div>

          {/* Toolbar */}
          <div className="flex flex-wrap gap-4 items-center justify-between mb-8">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-full focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* Category tabs - Accessoires masqué temporairement */}
            <div className="flex items-center gap-2 bg-card border border-border rounded-full p-1">
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
                  className={`px-4 py-2 rounded-full text-sm transition-all ${
                    category === cat.key
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* View & Filter */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                aria-label={showFilters ? "Masquer les filtres" : "Afficher les filtres"}
                aria-pressed={showFilters}
                className={`p-3 rounded-full border transition-all ${
                  showFilters
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:border-primary"
                }`}
              >
                <Filter className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                aria-label="Afficher en grille"
                aria-pressed={viewMode === "grid"}
                className={`p-3 rounded-full border transition-all ${
                  viewMode === "grid"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:border-primary"
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                aria-label="Afficher en liste"
                aria-pressed={viewMode === "list"}
                className={`p-3 rounded-full border transition-all ${
                  viewMode === "list"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:border-primary"
                }`}
              >
                <List className="w-5 h-5" />
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
                className="overflow-hidden mb-8"
              >
                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex flex-wrap gap-6">
                    <div>
                      <label className="text-sm text-muted-foreground block mb-2">
                        Trier par
                      </label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary"
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
          <p className="text-muted-foreground mb-6">
            {totalResults} produit{totalResults > 1 ? "s" : ""} trouvé{totalResults > 1 ? "s" : ""}
          </p>

          {/* Product Grid */}
          <motion.div
            layout
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "flex flex-col gap-4"
            }
          >
            <AnimatePresence mode="popLayout">
              {/* Flowers & Resins */}
              {filteredProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} layout={viewMode} />
              ))}

              {/* Accessories - Masqué temporairement - rupture de stock */}
              {/* {filteredAccessories.map((accessory, index) => (
                ... code conservé pour réactivation future ...
              ))} */}
            </AnimatePresence>
          </motion.div>

          {totalResults === 0 && (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">
                Aucun produit trouvé
              </p>
              <button
                onClick={() => {
                  setCategory("all");
                  setSearchQuery("");
                }}
                className="mt-4 btn-luxury-outline"
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
