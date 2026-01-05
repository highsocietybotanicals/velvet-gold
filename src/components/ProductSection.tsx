import { useState } from "react";
import { motion } from "framer-motion";
import ProductCard from "./ProductCard";
import { flowers, resins, type Product } from "@/data/products";

type CategoryFilter = "all" | "fleur" | "resine";

const ProductSection = () => {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");

  const getFilteredProducts = (): Product[] => {
    if (activeCategory === "fleur") return flowers.slice(0, 8);
    if (activeCategory === "resine") return resins.slice(0, 8);
    return [...flowers.slice(0, 4), ...resins.slice(0, 4)];
  };

  return (
    <section id="collection" className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-dark" />
      <div className="absolute inset-0 texture-velvet opacity-20" />

      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-gold-radial opacity-20 -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-gold-radial opacity-20 translate-x-1/2 translate-y-1/2" />

      <div className="relative container mx-auto px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-primary/80 tracking-[0.3em] uppercase text-sm mb-4 font-body"
          >
            Notre Sélection
          </motion.p>

          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl mb-6">
            <span className="text-gold-gradient">La Collection</span>
          </h2>

          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="w-32 h-px bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mb-6"
          />

          <p className="text-muted-foreground max-w-2xl mx-auto text-lg font-body mb-8">
            Chaque variété est sélectionnée avec une rigueur absolue pour vous offrir 
            une expérience sensorielle d'exception.
          </p>

          {/* Category filters */}
          <div className="flex justify-center gap-4 flex-wrap">
            {[
              { id: "all" as CategoryFilter, label: "Tout", count: flowers.length + resins.length },
              { id: "fleur" as CategoryFilter, label: "Fleurs", count: flowers.length },
              { id: "resine" as CategoryFilter, label: "Résines", count: resins.length },
            ].map((cat) => (
              <motion.button
                key={cat.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-6 py-2 rounded-full border transition-all duration-300 ${
                  activeCategory === cat.id
                    ? "border-primary bg-primary/20 text-primary"
                    : "border-border/50 text-muted-foreground hover:border-primary/50 hover:text-primary"
                }`}
              >
                <span className="font-body">{cat.label}</span>
                <span className="ml-2 text-xs opacity-70">({cat.count})</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Product grid */}
        <motion.div
          layout
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {getFilteredProducts().map((product, index) => (
            <ProductCard 
              key={product.id} 
              product={{
                ...product,
                terpenes: product.terpenes
              }} 
              index={index} 
            />
          ))}
        </motion.div>

        {/* View all button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center mt-16"
        >
          <a href="#" className="btn-luxury shimmer">
            Voir Toute la Collection
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default ProductSection;
