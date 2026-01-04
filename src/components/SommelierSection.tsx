import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Moon, Sun, Palette, ArrowRight, RotateCcw } from "lucide-react";
import productOrNoir from "@/assets/product-or-noir.jpg";
import productTresor from "@/assets/product-tresor.jpg";
import productNectar from "@/assets/product-nectar.jpg";
import productVelvet from "@/assets/product-velvet.jpg";

interface MoodOption {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  recommendation: {
    name: string;
    description: string;
    image: string;
  };
}

const moods: MoodOption[] = [
  {
    id: "detente",
    label: "Détente",
    description: "Un moment de calme après une longue journée",
    icon: <Moon className="w-8 h-8" />,
    recommendation: {
      name: "L'Or Noir",
      description: "Ses notes boisées et sa puissance contrôlée vous transporteront vers un état de relaxation profonde.",
      image: productOrNoir,
    },
  },
  {
    id: "creativite",
    label: "Créativité",
    description: "Libérer votre imagination et vos idées",
    icon: <Palette className="w-8 h-8" />,
    recommendation: {
      name: "Trésor Oublié",
      description: "Son bouquet fruité et épicé stimulera votre créativité tout en maintenant votre clarté d'esprit.",
      image: productTresor,
    },
  },
  {
    id: "sommeil",
    label: "Sommeil",
    description: "Préparer une nuit de repos réparateur",
    icon: <Sparkles className="w-8 h-8" />,
    recommendation: {
      name: "Velvet Crown",
      description: "Ses notes apaisantes de lavande et de bois précieux vous guideront vers un sommeil serein.",
      image: productVelvet,
    },
  },
  {
    id: "energie",
    label: "Énergie",
    description: "Démarrer la journée avec vitalité",
    icon: <Sun className="w-8 h-8" />,
    recommendation: {
      name: "Nectar des Rois",
      description: "Sa concentration exceptionnelle vous apportera l'énergie focalisée dont vous avez besoin.",
      image: productNectar,
    },
  },
];

const SommelierSection = () => {
  const [selectedMood, setSelectedMood] = useState<MoodOption | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleMoodSelect = (mood: MoodOption) => {
    setSelectedMood(mood);
    setTimeout(() => setShowResult(true), 300);
  };

  const handleReset = () => {
    setShowResult(false);
    setTimeout(() => setSelectedMood(null), 300);
  };

  return (
    <section id="sommelier" className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-carbon-elevated" />
      <div className="absolute inset-0 texture-velvet opacity-40" />

      {/* Gold accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-gold-radial opacity-30" />

      <div className="relative container mx-auto px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-primary/80 tracking-[0.3em] uppercase text-sm mb-4 font-body"
          >
            Conseil Personnalisé
          </motion.p>

          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl mb-6">
            <span className="text-gold-gradient">Le Sommelier</span>
          </h2>

          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="w-32 h-px bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mb-6"
          />

          <p className="text-muted-foreground max-w-2xl mx-auto text-lg font-body">
            Laissez notre majordome vous guider vers la variété parfaite 
            selon votre humeur du moment.
          </p>
        </motion.div>

        {/* Quiz container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-8 md:p-12">
            <AnimatePresence mode="wait">
              {!showResult ? (
                <motion.div
                  key="question"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <h3 className="font-display text-2xl md:text-3xl text-center mb-8 text-foreground">
                    Quelle est votre intention du moment ?
                  </h3>

                  <div className="grid sm:grid-cols-2 gap-4">
                    {moods.map((mood, index) => (
                      <motion.button
                        key={mood.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleMoodSelect(mood)}
                        className={`p-6 rounded-xl border transition-all duration-300 text-left group ${
                          selectedMood?.id === mood.id
                            ? "border-primary bg-primary/10"
                            : "border-border/50 hover:border-primary/50 hover:bg-primary/5"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="text-primary/70 group-hover:text-primary transition-colors">
                            {mood.icon}
                          </div>
                          <div>
                            <h4 className="font-display text-xl text-foreground mb-1">
                              {mood.label}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {mood.description}
                            </p>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              ) : selectedMood ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="inline-flex items-center gap-2 bg-primary/20 text-primary px-4 py-2 rounded-full mb-8"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      Notre Recommandation
                    </span>
                  </motion.div>

                  <div className="grid md:grid-cols-2 gap-8 items-center">
                    {/* Product image */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 }}
                      className="relative"
                    >
                      <div className="absolute inset-0 bg-gradient-gold-radial opacity-50 blur-2xl" />
                      <img
                        src={selectedMood.recommendation.image}
                        alt={selectedMood.recommendation.name}
                        className="relative w-full max-w-sm mx-auto rounded-lg shadow-luxury"
                      />
                    </motion.div>

                    {/* Recommendation text */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-left"
                    >
                      <p className="text-primary/80 text-sm uppercase tracking-wider mb-2">
                        Pour votre {selectedMood.label.toLowerCase()}
                      </p>
                      <h3 className="font-display text-3xl md:text-4xl text-gold-gradient mb-4">
                        {selectedMood.recommendation.name}
                      </h3>
                      <p className="text-muted-foreground text-lg mb-8 font-body">
                        {selectedMood.recommendation.description}
                      </p>

                      <div className="flex flex-col sm:flex-row gap-4">
                        <motion.a
                          href="#collection"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="btn-luxury shimmer inline-flex items-center justify-center gap-2"
                        >
                          Découvrir
                          <ArrowRight className="w-4 h-4" />
                        </motion.a>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleReset}
                          className="btn-luxury-outline inline-flex items-center justify-center gap-2"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Recommencer
                        </motion.button>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default SommelierSection;
