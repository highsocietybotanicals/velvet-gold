import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Gift, Check, ArrowLeft } from "lucide-react";
import { flowers } from "@/data/products";
import { useCart } from "@/contexts/CartContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const SampleSelectionPage = () => {
  const navigate = useNavigate();
  const { 
    totalFlowerWeight, 
    sampleItems, 
    addSample, 
    removeSample,
    setIsCartOpen 
  } = useCart();

  const sampleAllowance = Math.floor(totalFlowerWeight / 12);
  const samplesChosen = sampleItems.length;
  const samplesRemaining = sampleAllowance - samplesChosen;

  // Check if a flower is already selected as sample
  const isSelected = (productId: string) => {
    return sampleItems.some(item => item.product.id === productId);
  };

  const handleSelectSample = (product: typeof flowers[0]) => {
    if (isSelected(product.id)) {
      removeSample(product.id);
    } else if (samplesRemaining > 0) {
      addSample(product);
      // If all samples are chosen, redirect to cart
      if (samplesRemaining === 1) {
        setTimeout(() => {
          navigate("/");
          setIsCartOpen(true);
        }, 500);
      }
    }
  };

  // If no samples available, redirect back
  if (sampleAllowance === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-6 text-center">
            <Gift className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="font-display text-3xl text-foreground mb-4">
              Pas d'échantillon disponible
            </h1>
            <p className="text-muted-foreground mb-8">
              Ajoutez 12g de fleurs dans votre panier pour débloquer un échantillon gratuit !
            </p>
            <button
              onClick={() => navigate("/catalogue")}
              className="btn-luxury"
            >
              Découvrir nos fleurs
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-6">
          {/* Back button */}
          <button
            onClick={() => {
              navigate("/");
              setIsCartOpen(true);
            }}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au panier
          </button>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 bg-primary/20 text-primary px-4 py-2 rounded-full mb-4">
              <Gift className="w-5 h-5" />
              <span className="font-medium">Cadeau Spécial</span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl text-gold-gradient mb-4">
              Choisissez Votre Échantillon
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
              Félicitations ! Vous avez débloqué {sampleAllowance} échantillon{sampleAllowance > 1 ? "s" : ""} gratuit{sampleAllowance > 1 ? "s" : ""} de 1g.
              Sélectionnez la fleur de votre choix.
            </p>
            
            {/* Counter badge */}
            <div className="inline-flex items-center gap-3 bg-card border border-border rounded-full px-6 py-3">
              <span className="text-foreground font-medium">
                Échantillons choisis :
              </span>
              <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full font-bold">
                {samplesChosen} / {sampleAllowance}
              </span>
            </div>
          </motion.div>

          {/* Product Grid */}
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {flowers.map((product, index) => {
                const selected = isSelected(product.id);
                const disabled = !selected && samplesRemaining === 0;

                return (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.03 }}
                    className={`group bg-card border rounded-xl overflow-hidden relative transition-all ${
                      selected 
                        ? "border-primary ring-2 ring-primary/30" 
                        : disabled 
                          ? "border-border opacity-50" 
                          : "border-border hover:border-primary/50"
                    }`}
                  >
                    {/* Selected overlay */}
                    {selected && (
                      <div className="absolute top-4 right-4 z-10 bg-primary text-primary-foreground p-2 rounded-full">
                        <Check className="w-4 h-4" />
                      </div>
                    )}

                    <div className="relative aspect-square overflow-hidden">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      {/* FREE badge */}
                      <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                        GRATUIT
                      </div>
                    </div>

                    <div className="p-4">
                      <span className="text-xs text-primary tracking-wider uppercase">
                        Fleur CBD
                      </span>
                      <h3 className="font-display text-lg text-foreground mt-1">
                        {product.name}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {product.subtitle}
                      </p>

                      <div className="flex justify-between items-center mt-4">
                        <div>
                          <span className="text-sm text-muted-foreground line-through mr-2">
                            {product.price}€
                          </span>
                          <span className="text-lg font-display text-green-500 font-bold">
                            0€
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          1g
                        </span>
                      </div>

                      <button
                        onClick={() => handleSelectSample(product)}
                        disabled={disabled}
                        className={`w-full mt-4 py-3 rounded-lg font-medium transition-all ${
                          selected
                            ? "bg-primary/20 text-primary border border-primary"
                            : disabled
                              ? "bg-muted text-muted-foreground cursor-not-allowed"
                              : "btn-luxury"
                        }`}
                      >
                        {selected ? "Sélectionné ✓" : "Choisir cet échantillon"}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>

          {/* Continue button when samples are chosen */}
          {samplesChosen > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40"
            >
              <button
                onClick={() => {
                  navigate("/");
                  setIsCartOpen(true);
                }}
                className="btn-luxury px-8 py-4 shadow-xl"
              >
                Continuer avec {samplesChosen} échantillon{samplesChosen > 1 ? "s" : ""}
              </button>
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SampleSelectionPage;
