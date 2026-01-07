import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Sparkles, Moon, Sun, Palette, ArrowRight, RotateCcw, TreePine, Cherry, Flower2, ChevronLeft, ShoppingCart } from "lucide-react";
import { recommendationMatrix, type Product } from "@/data/products";
import { useCart } from "@/contexts/CartContext";

type IntentionId = "detente" | "creativite" | "sommeil" | "energie";
type TasteId = "boise" | "fruite" | "floral";

interface Intention {
  id: IntentionId;
  label: string;
  description: string;
  icon: React.ReactNode;
}

interface Taste {
  id: TasteId;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const intentions: Intention[] = [
  {
    id: "detente",
    label: "Détente",
    description: "Un moment de calme après une longue journée",
    icon: <Moon className="w-8 h-8" />,
  },
  {
    id: "creativite",
    label: "Créativité",
    description: "Libérer votre imagination et vos idées",
    icon: <Palette className="w-8 h-8" />,
  },
  {
    id: "sommeil",
    label: "Sommeil",
    description: "Préparer une nuit de repos réparateur",
    icon: <Sparkles className="w-8 h-8" />,
  },
  {
    id: "energie",
    label: "Énergie",
    description: "Démarrer la journée avec vitalité",
    icon: <Sun className="w-8 h-8" />,
  },
];

const tastes: Taste[] = [
  {
    id: "boise",
    label: "Boisé & Terreux",
    description: "Notes de cèdre, sous-bois et mousse",
    icon: <TreePine className="w-8 h-8" />,
  },
  {
    id: "fruite",
    label: "Fruité & Sucré",
    description: "Arômes de baies, agrumes et douceur",
    icon: <Cherry className="w-8 h-8" />,
  },
  {
    id: "floral",
    label: "Floral & Épicé",
    description: "Parfums de lavande, poivre et herbes",
    icon: <Flower2 className="w-8 h-8" />,
  },
];

const SommelierSection = () => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedIntention, setSelectedIntention] = useState<Intention | null>(null);
  const [selectedTaste, setSelectedTaste] = useState<Taste | null>(null);
  const { addToCart } = useCart();

  const handleIntentionSelect = (intention: Intention) => {
    setSelectedIntention(intention);
    setTimeout(() => setStep(2), 300);
  };

  const handleTasteSelect = (taste: Taste) => {
    setSelectedTaste(taste);
    setTimeout(() => setStep(3), 300);
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setSelectedTaste(null);
    } else if (step === 3) {
      setStep(2);
    }
  };

  const handleReset = () => {
    setStep(1);
    setSelectedIntention(null);
    setSelectedTaste(null);
  };

  const getRecommendation = (): Product | null => {
    if (!selectedIntention || !selectedTaste) return null;
    return recommendationMatrix[selectedIntention.id]?.[selectedTaste.id] || null;
  };

  return (
    <section id="sommelier" className="relative min-h-screen flex items-center py-32 overflow-hidden">
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

        {/* Progress indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center gap-3 mb-8"
        >
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 rounded-full transition-all duration-500 ${
                s === step
                  ? "w-8 bg-primary"
                  : s < step
                  ? "w-4 bg-primary/60"
                  : "w-4 bg-border/50"
              }`}
            />
          ))}
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
              {/* Step 1: Intention */}
              {step === 1 && (
                <motion.div
                  key="intention"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <h3 className="font-display text-2xl md:text-3xl text-center mb-8 text-foreground">
                    Quelle est votre intention du moment ?
                  </h3>

                  <div className="grid sm:grid-cols-2 gap-4">
                    {intentions.map((intention, index) => (
                      <motion.button
                        key={intention.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleIntentionSelect(intention)}
                        className={`p-6 rounded-xl border transition-all duration-300 text-left group ${
                          selectedIntention?.id === intention.id
                            ? "border-primary bg-primary/10"
                            : "border-border/50 hover:border-primary/50 hover:bg-primary/5"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="text-primary/70 group-hover:text-primary transition-colors">
                            {intention.icon}
                          </div>
                          <div>
                            <h4 className="font-display text-xl text-foreground mb-1">
                              {intention.label}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {intention.description}
                            </p>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Step 2: Taste */}
              {step === 2 && (
                <motion.div
                  key="taste"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={handleBack}
                    className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="text-sm">Retour</span>
                  </motion.button>

                  <h3 className="font-display text-2xl md:text-3xl text-center mb-8 text-foreground">
                    Quel goût préférez-vous ?
                  </h3>

                  <div className="grid sm:grid-cols-3 gap-4">
                    {tastes.map((taste, index) => (
                      <motion.button
                        key={taste.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleTasteSelect(taste)}
                        className={`p-6 rounded-xl border transition-all duration-300 text-center group ${
                          selectedTaste?.id === taste.id
                            ? "border-primary bg-primary/10"
                            : "border-border/50 hover:border-primary/50 hover:bg-primary/5"
                        }`}
                      >
                        <div className="flex flex-col items-center gap-3">
                          <div className="text-primary/70 group-hover:text-primary transition-colors">
                            {taste.icon}
                          </div>
                          <div>
                            <h4 className="font-display text-lg text-foreground mb-1">
                              {taste.label}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {taste.description}
                            </p>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Step 3: Result */}
              {step === 3 && selectedIntention && selectedTaste && (
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

                  {getRecommendation() && (
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
                          src={getRecommendation()!.image}
                          alt={getRecommendation()!.name}
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
                          Pour votre {selectedIntention.label.toLowerCase()} • {selectedTaste.label}
                        </p>
                        <h3 className="font-display text-3xl md:text-4xl text-gold-gradient mb-4">
                          {getRecommendation()!.name}
                        </h3>
                        <p className="text-muted-foreground text-lg mb-4 font-body">
                          {getRecommendation()!.description}
                        </p>
                        
                        {/* Product details */}
                        <div className="flex gap-4 mb-6">
                          <div className="bg-primary/10 px-3 py-1 rounded-full">
                            <span className="text-primary text-sm font-medium">
                              CBD {getRecommendation()!.cbdPercentage}
                            </span>
                          </div>
                          <div className="bg-primary/10 px-3 py-1 rounded-full">
                            <span className="text-primary text-sm font-medium">
                              {getRecommendation()!.price}€/g
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                          <Link
                            to={`/produit/${getRecommendation()!.id}`}
                            className="btn-luxury shimmer inline-flex items-center justify-center gap-2"
                          >
                            Découvrir
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => addToCart(getRecommendation()!, 2.5)}
                            className="btn-luxury-outline inline-flex items-center justify-center gap-2"
                          >
                            <ShoppingCart className="w-4 h-4" />
                            Ajouter au panier
                          </motion.button>
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
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default SommelierSection;
