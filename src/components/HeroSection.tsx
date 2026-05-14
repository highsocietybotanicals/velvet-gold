import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import GoldParticles from "./GoldParticles";

const HeroSection = () => {
  return (
    <section
      id="accueil"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-hero" />

      {/* Texture overlay */}
      <div className="absolute inset-0 texture-velvet opacity-30" />

      {/* Gold radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-gold-radial opacity-40" />

      {/* Gold particles */}
      <GoldParticles />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 pt-24">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="text-primary/80 tracking-[0.3em] uppercase text-sm mb-4 font-body"
          >
            Collection Exclusive
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0, duration: 0.3 }}
            className="font-display text-4xl md:text-5xl lg:text-6xl xl:text-7xl leading-tight mb-6"
          >
            <span className="text-gold-gradient">L'Excellence</span>
            <br />
            <span className="text-foreground">Botanique</span>
          </motion.h1>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="w-32 h-px bg-gradient-to-r from-primary via-primary to-transparent mb-6"
          />

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="text-lg md:text-xl text-muted-foreground max-w-lg mb-8 font-body leading-relaxed"
          >
            Découvrez notre sélection raffinée de fleurs et résines CBD, 
            cultivées avec passion pour les connaisseurs les plus exigeants.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link to="/catalogue" className="btn-luxury shimmer">
              Explorer la Collection
            </Link>
            <Link to="/sommelier" className="btn-luxury-outline">
              Le Sommelier
            </Link>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex flex-col items-center gap-2 text-muted-foreground"
          >
            <span className="text-xs uppercase tracking-widest">Défiler</span>
            <ChevronDown className="w-5 h-5 text-primary" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
