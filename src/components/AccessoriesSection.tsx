import { motion } from "framer-motion";
import { Package, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { accessories } from "@/data/accessories";
import AccessoryCard from "./AccessoryCard";

const AccessoriesSection = () => {
  return (
    <section id="accessoires" className="py-16 relative">
      {/* Golden gradient separator at top */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />

      <div className="container mx-auto px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-primary" />
            <span className="text-primary text-sm tracking-widest uppercase">
              Accessoires
            </span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl text-foreground mb-3">
            Les Essentiels de l'Initié
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Complétez votre expérience avec nos accessoires premium. 
            <span className="text-primary font-medium"> -33% dès 10 unités</span>
          </p>
        </motion.div>

        {/* Accessories grid - 5 columns on desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 max-w-5xl mx-auto">
          {accessories.map((accessory, index) => (
            <AccessoryCard key={accessory.id} accessory={accessory} index={index} />
          ))}
        </div>

        {/* Link to catalogue */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="text-center mt-8"
        >
          <Link
            to="/catalogue?cat=accessoire"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
          >
            <span>Voir tous les accessoires</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default AccessoriesSection;
