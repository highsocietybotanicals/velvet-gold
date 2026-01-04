import { motion } from "framer-motion";
import ProductCard from "./ProductCard";
import productOrNoir from "@/assets/product-or-noir.jpg";
import productTresor from "@/assets/product-tresor.jpg";
import productNectar from "@/assets/product-nectar.jpg";
import productVelvet from "@/assets/product-velvet.jpg";

const products = [
  {
    id: "or-noir",
    name: "L'Or Noir",
    subtitle: "Collection Signature",
    description: "Une variété d'exception aux reflets dorés, offrant des notes profondes de pin et de citron. Pour les moments de pure contemplation.",
    price: 12,
    cbdPercentage: "18%",
    image: productOrNoir,
    terpenes: { boise: 85, fruite: 60, epice: 40, terreux: 70 },
    mood: "Relaxation",
  },
  {
    id: "tresor-oublie",
    name: "Trésor Oublié",
    subtitle: "Édition Limitée",
    description: "Un héritage génétique rare, aux arômes complexes de fruits rouges et d'épices orientales. Une expérience sensorielle unique.",
    price: 15,
    cbdPercentage: "22%",
    image: productTresor,
    terpenes: { boise: 50, fruite: 90, epice: 75, terreux: 45 },
    mood: "Créativité",
  },
  {
    id: "nectar-des-rois",
    name: "Nectar des Rois",
    subtitle: "Collection Prestige",
    description: "La quintessence de notre savoir-faire. Une résine dorée aux propriétés exceptionnelles, réservée aux palais les plus raffinés.",
    price: 25,
    cbdPercentage: "45%",
    image: productNectar,
    terpenes: { boise: 70, fruite: 55, epice: 80, terreux: 90 },
    mood: "Méditation",
  },
  {
    id: "velvet-crown",
    name: "Velvet Crown",
    subtitle: "Indoor Premium",
    description: "Cultivée avec une attention méticuleuse, cette fleur veloutée révèle des notes subtiles de lavande et de bois précieux.",
    price: 14,
    cbdPercentage: "20%",
    image: productVelvet,
    terpenes: { boise: 75, fruite: 70, epice: 55, terreux: 60 },
    mood: "Sérénité",
  },
];

const ProductSection = () => {
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
          className="text-center mb-20"
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

          <p className="text-muted-foreground max-w-2xl mx-auto text-lg font-body">
            Chaque variété est sélectionnée avec une rigueur absolue pour vous offrir 
            une expérience sensorielle d'exception.
          </p>
        </motion.div>

        {/* Product grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>

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
