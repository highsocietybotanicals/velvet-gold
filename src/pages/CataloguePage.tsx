import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Filter, Grid, List, Search, ShoppingCart } from "lucide-react";
import { flowers, resins, ProductCategory } from "@/data/products";
import { useCart } from "@/contexts/CartContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type ViewMode = "grid" | "list";
type SortOption = "name" | "price-asc" | "price-desc" | "cbd";

const CataloguePage = () => {
  const { addToCart } = useCart();
  const [category, setCategory] = useState<"all" | ProductCategory>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const [showFilters, setShowFilters] = useState(false);

  const allProducts = useMemo(() => [...flowers, ...resins], []);

  const filteredProducts = useMemo(() => {
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
            <h1 className="font-display text-4xl md:text-5xl text-gold-gradient mb-4">
              Le Coffre
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Découvrez notre collection complète de fleurs et résines CBD
              d'exception, sélectionnées avec soin pour les connaisseurs.
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

            {/* Category tabs */}
            <div className="flex items-center gap-2 bg-card border border-border rounded-full p-1">
              {[
                { key: "all", label: "Tous" },
                { key: "fleur", label: "Fleurs" },
                { key: "resine", label: "Résines" },
              ].map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setCategory(cat.key as typeof category)}
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
                        <option value="cbd">Taux CBD</option>
                      </select>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results count */}
          <p className="text-muted-foreground mb-6">
            {filteredProducts.length} produit{filteredProducts.length > 1 ? "s" : ""} trouvé{filteredProducts.length > 1 ? "s" : ""}
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
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.03 }}
                  className={
                    viewMode === "grid"
                      ? "product-card group bg-card border border-border rounded-xl overflow-hidden"
                      : "product-card group bg-card border border-border rounded-xl overflow-hidden flex"
                  }
                >
                  <Link
                    to={`/produit/${product.id}`}
                    className={viewMode === "list" ? "flex flex-1" : "block"}
                  >
                    <div
                      className={
                        viewMode === "grid"
                          ? "relative aspect-square overflow-hidden"
                          : "relative w-32 h-32 flex-shrink-0 overflow-hidden"
                      }
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className={viewMode === "grid" ? "p-4" : "flex-1 p-4 flex items-center justify-between"}>
                      <div>
                        <span className="text-xs text-primary tracking-wider uppercase">
                          {product.category === "fleur" ? "Fleur" : "Résine"}
                        </span>
                        <h3 className="font-display text-lg text-foreground mt-1">
                          {product.name}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {product.subtitle}
                        </p>
                      </div>
                      <div className={viewMode === "list" ? "text-right" : "flex justify-between items-center mt-4"}>
                        <span className="text-sm text-muted-foreground">
                          {product.cbdPercentage} CBD
                        </span>
                        <span className="text-lg font-display text-primary">
                          {product.price}€<span className="text-xs text-muted-foreground">/g</span>
                        </span>
                      </div>
                    </div>
                  </Link>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      addToCart(product);
                    }}
                    className={`${
                      viewMode === "grid"
                        ? "absolute bottom-4 right-4 opacity-0 group-hover:opacity-100"
                        : "m-4 flex-shrink-0"
                    } p-3 bg-primary text-primary-foreground rounded-full transition-all hover:glow-gold`}
                  >
                    <ShoppingCart className="w-5 h-5" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {filteredProducts.length === 0 && (
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
