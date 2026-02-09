import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import GoldParticles from "./GoldParticles";
import heroBook from "@/assets/hero-book.jpg";

// Real product images
import amnesiaOniria from "@/assets/flowers/amnesia-oniria-real.jpg";
import platinumOg from "@/assets/flowers/platinum-og-real.jpg";
import mintKush from "@/assets/flowers/mint-kush-real.jpg";
import blueMango from "@/assets/flowers/blue-mango-real.jpg";
import og911 from "@/assets/flowers/911-og-real.jpg";
import iceOlator from "@/assets/resins/ice-o-lator-real.jpg";
import goldenCbn from "@/assets/resins/golden-cbn-real.jpg";

const orbitProducts = [
  { src: amnesiaOniria, name: "Amnesia Oniria" },
  { src: platinumOg, name: "Platinum OG" },
  { src: mintKush, name: "Mint Kush" },
  { src: blueMango, name: "Blue Mango" },
  { src: og911, name: "911 OG" },
  { src: iceOlator, name: "Ice O Lator" },
  { src: goldenCbn, name: "Golden CBN" },
];

const OrbitComposition = () => {
  const [angle, setAngle] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAngle((prev) => (prev + 0.15) % 360);
    }, 16);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-[320px] h-[320px] md:w-[480px] md:h-[480px] mx-auto">
      {/* Glow behind book */}
      <div className="absolute inset-0 bg-gradient-gold-radial opacity-60 blur-3xl scale-110" />

      {/* Central book */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 flex items-center justify-center z-10"
      >
        <img
          src={heroBook}
          alt="Livre illuminé"
          className="w-32 h-32 md:w-44 md:h-44 object-contain drop-shadow-[0_0_30px_rgba(212,175,55,0.6)]"
        />
      </motion.div>

      {/* Orbiting products */}
      {orbitProducts.map((product, i) => {
        const baseAngle = (360 / orbitProducts.length) * i;
        const currentAngle = ((baseAngle + angle) * Math.PI) / 180;
        const radiusX = typeof window !== "undefined" && window.innerWidth < 768 ? 120 : 190;
        const radiusY = radiusX * 0.85;
        const x = Math.cos(currentAngle) * radiusX;
        const y = Math.sin(currentAngle) * radiusY;
        const floatOffset = Math.sin(Date.now() / 1000 + i * 1.2) * 6;
        const scale = 0.8 + 0.2 * ((Math.sin(currentAngle) + 1) / 2);
        const zIndex = Math.round(scale * 10);

        return (
          <motion.div
            key={product.name}
            className="absolute"
            style={{
              left: "50%",
              top: "50%",
              transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y + floatOffset}px)) scale(${scale})`,
              zIndex,
            }}
          >
            {/* Gold trail glow */}
            <div
              className="absolute inset-0 rounded-full blur-md"
              style={{
                background: "radial-gradient(circle, rgba(212,175,55,0.4) 0%, transparent 70%)",
                transform: "scale(1.8)",
              }}
            />
            <img
              src={product.src}
              alt={product.name}
              className="w-14 h-14 md:w-20 md:h-20 rounded-full object-cover border-2 border-primary/60 relative"
              style={{
                boxShadow: "0 0 20px rgba(212,175,55,0.4), 0 0 40px rgba(212,175,55,0.15)",
              }}
            />
          </motion.div>
        );
      })}
    </div>
  );
};

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
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center lg:text-left"
          >
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-primary/80 tracking-[0.3em] uppercase text-sm mb-4 font-body"
            >
              Collection Exclusive
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
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
              className="w-32 h-px bg-gradient-to-r from-primary to-transparent mb-6 mx-auto lg:mx-0"
            />

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="text-lg md:text-xl text-muted-foreground max-w-lg mx-auto lg:mx-0 mb-8 font-body leading-relaxed"
            >
              Découvrez notre sélection raffinée de fleurs et résines CBD, 
              cultivées avec passion pour les connaisseurs les plus exigeants.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Link to="/catalogue" className="btn-luxury shimmer">
                Explorer la Collection
              </Link>
              <Link to="/sommelier" className="btn-luxury-outline">
                Le Sommelier
              </Link>
            </motion.div>
          </motion.div>

          {/* Orbiting products composition */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="relative"
          >
            <OrbitComposition />

            {/* Floating badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.2 }}
              className="absolute -bottom-4 right-0 md:bottom-0 md:right-4 bg-card border border-primary/30 rounded-lg p-4 shadow-gold backdrop-blur-sm"
            >
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Qualité Premium
              </p>
              <p className="text-primary font-display text-lg">
                CBD &lt; 0.3% THC
              </p>
            </motion.div>
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
