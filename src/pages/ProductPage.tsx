import { useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ShoppingCart, Gift, Package, ChevronDown } from "lucide-react";
import { allProducts } from "@/data/products";
import { useCart } from "@/contexts/CartContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TerpeneRadar from "@/components/TerpeneRadar";
import { Input } from "@/components/ui/input";
import { PRESET_WEIGHTS, calculatePrice, getGifts } from "@/lib/pricing";
import { getPochonImage, getPochonLabel } from "@/data/accessories";

// Calculate similarity between two products based on terpenes
const calculateTerpeneSimilarity = (
  terpenes1: { boise: number; fruite: number; epice: number; terreux: number },
  terpenes2: { boise: number; fruite: number; epice: number; terreux: number }
): number => {
  const keys = ["boise", "fruite", "epice", "terreux"] as const;
  let similarity = 0;
  
  keys.forEach((key) => {
    const val1 = terpenes1[key];
    const val2 = terpenes2[key];
    similarity += 1 - Math.abs(val1 - val2) / 100;
  });
  
  return similarity / keys.length;
};

const getSimilarProducts = (currentProduct: typeof allProducts[0], count: number = 4) => {
  const similarities = allProducts
    .filter((p) => p.id !== currentProduct.id)
    .map((p) => ({
      product: p,
      similarity: calculateTerpeneSimilarity(currentProduct.terpenes, p.terpenes),
    }))
    .sort((a, b) => b.similarity - a.similarity);

  return similarities.slice(0, count).map((s) => s.product);
};

const ProductPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  const product = allProducts.find((p) => p.id === id);
  const [selectedWeight, setSelectedWeight] = useState<number>(2.5);
  const [customWeight, setCustomWeight] = useState<string>("2.5");

  const priceInfo = useMemo(() => {
    if (!product) return null;
    return calculatePrice(product.price, selectedWeight);
  }, [product?.price, selectedWeight]);

  const gifts = useMemo(() => {
    return getGifts(selectedWeight);
  }, [selectedWeight]);

  const pochonImage = useMemo(() => {
    return getPochonImage(selectedWeight);
  }, [selectedWeight]);

  const pochonLabel = useMemo(() => {
    return getPochonLabel(selectedWeight);
  }, [selectedWeight]);

  const handlePresetClick = (weight: number) => {
    setSelectedWeight(weight);
    setCustomWeight(weight.toString());
  };

  const handleCustomWeightChange = (value: string) => {
    setCustomWeight(value);
    // Allow empty or zero temporarily for typing
    if (value === '' || value === '0') {
      return;
    }
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0 && numValue <= 1000) {
      setSelectedWeight(numValue);
    }
  };

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, selectedWeight);
    }
  };

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-4xl text-primary mb-4">Produit non trouvé</h1>
          <button onClick={() => navigate("/")} className="btn-luxury-outline">
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  const similarProducts = getSimilarProducts(product, 4);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-6">
          {/* Back button */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Retour</span>
          </motion.button>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Product Image with Pochon indicator */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="relative aspect-square bg-card rounded-2xl overflow-hidden border border-border">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                />
              </div>
              
              {/* Pochon indicator - separate section below image */}
              <motion.div
                key={pochonImage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-4 flex items-center gap-4 p-4 bg-card/80 backdrop-blur-sm rounded-xl border border-border/50"
              >
                <img
                  src={pochonImage}
                  alt={pochonLabel}
                  className="w-12 h-12 object-cover rounded-lg border border-primary/20"
                />
                <div>
                  <p className="text-sm font-medium text-foreground">{pochonLabel}</p>
                  <p className="text-xs text-muted-foreground">Inclus avec votre commande</p>
                </div>
              </motion.div>
            </motion.div>

            {/* Product Info */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col"
            >
              <span className="text-primary text-sm tracking-widest uppercase mb-2">
                {product.category === "fleur" ? "Fleur CBD" : "Résine CBD"}
              </span>
              <h1 className="font-display text-4xl md:text-5xl text-foreground mb-2">
                {product.name}
              </h1>
              <p className="text-lg text-muted-foreground mb-6">
                {product.subtitle}
              </p>

              <div className="flex items-center gap-4 mb-6">
                <span className="text-3xl font-display text-primary">
                  {product.price}€
                </span>
                <span className="text-muted-foreground">/gramme</span>
                <span className="ml-auto px-4 py-1 bg-secondary/50 rounded-full text-sm text-foreground">
                  {product.cbdPercentage} CBD
                </span>
              </div>

              <p className="text-muted-foreground leading-relaxed mb-6">
                {product.description}
              </p>

              {/* Mood tag */}
              <div className="mb-6">
                <span className="text-sm text-muted-foreground">Ambiance</span>
                <span className="ml-3 px-4 py-2 bg-card border border-border rounded-full text-foreground">
                  {product.mood}
                </span>
              </div>

              {/* Weight Selection */}
              <div className="bg-card border border-border rounded-xl p-5 mb-6 space-y-4">
                <h4 className="text-sm font-medium text-foreground uppercase tracking-wider">
                  Choisissez votre grammage
                </h4>
                
                {/* Preset weight buttons */}
                <div className="flex flex-wrap gap-2">
                  {PRESET_WEIGHTS.map((weight) => (
                    <button
                      key={weight}
                      onClick={() => handlePresetClick(weight)}
                      className={`px-4 py-2.5 text-sm rounded-lg border transition-all ${
                        selectedWeight === weight
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border text-muted-foreground hover:border-primary/50 hover:text-primary"
                      }`}
                    >
                      {weight}g
                    </button>
                  ))}
                </div>

                {/* Custom weight input */}
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">ou saisissez un poids précis :</span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0.5"
                      max="1000"
                      step="0.5"
                      value={customWeight}
                      onChange={(e) => handleCustomWeightChange(e.target.value)}
                      className="w-24 h-10 text-center border-primary/30 focus:border-primary bg-background"
                    />
                    <span className="text-sm text-muted-foreground">grammes</span>
                  </div>
                </div>

                {/* Price display */}
                <div className="pt-4 border-t border-border/50">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm text-muted-foreground mb-1">Prix total</span>
                      <div className="flex items-baseline gap-3">
                        <span className="font-display text-3xl text-primary font-bold">
                          {priceInfo?.finalPrice}€
                        </span>
                        {priceInfo && priceInfo.discount > 0 && (
                          <>
                            <span className="text-lg text-muted-foreground line-through">
                              {priceInfo.rawPrice}€
                            </span>
                            <span className="text-sm bg-green-500/20 text-green-400 px-2 py-1 rounded-md font-medium">
                              {priceInfo.discountLabel}
                            </span>
                          </>
                        )}
                      </div>
                      {priceInfo && priceInfo.discount > 0 && (
                        <span className="text-sm text-green-400 mt-1">
                          Vous économisez {priceInfo.savings}€
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Gifts display */}
                {gifts && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-lg bg-primary/10 border border-primary/20"
                  >
                    <div className="flex items-center gap-3">
                      {gifts.type === "kit" ? (
                        <Package className="w-5 h-5 text-primary" />
                      ) : (
                        <Gift className="w-5 h-5 text-primary" />
                      )}
                      <span className="text-sm text-primary font-medium">
                        + {gifts.label} offert{gifts.count > 1 ? "s" : ""}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 ml-8">
                      Contenu : {gifts.contents.pochonMoyen}x Pochon Moyen, {gifts.contents.feuillesSlim}x Feuilles Slim, {gifts.contents.briquetHSB}x Briquet HSB, {gifts.contents.elastique}x Élastique
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Add to cart button */}
              <button
                onClick={handleAddToCart}
                className="w-full btn-luxury flex items-center justify-center gap-3 py-4"
              >
                <ShoppingCart className="w-5 h-5" />
                Ajouter au panier ({selectedWeight}g)
              </button>

              {/* Link to accessories */}
              <Link
                to="/#accessoires"
                className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mt-4"
              >
                Besoin d'un pochon en plus ?
                <ChevronDown className="w-4 h-4" />
              </Link>

              {/* Terpene Radar */}
              <div className="bg-card border border-border rounded-2xl p-6 mt-6">
                <h3 className="font-display text-lg text-foreground mb-4 text-center">
                  Profil Terpénique
                </h3>
                <div className="flex justify-center">
                  <TerpeneRadar terpenes={product.terpenes} size={220} />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Similar Products Section */}
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-20"
          >
            <h2 className="font-display text-3xl text-foreground text-center mb-2">
              Produits Similaires
            </h2>
            <p className="text-muted-foreground text-center mb-10">
              Basé sur le profil terpénique de {product.name}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {similarProducts.map((similarProduct, index) => (
                <motion.div
                  key={similarProduct.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                >
                  <Link
                    to={`/produit/${similarProduct.id}`}
                    className="group block"
                  >
                    <div className="relative aspect-square bg-card rounded-xl overflow-hidden border border-border group-hover:border-primary/50 transition-all duration-300">
                      <img
                        src={similarProduct.image}
                        alt={similarProduct.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.svg';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span className="text-xs text-primary uppercase tracking-wider">
                          {similarProduct.category === "fleur" ? "Fleur" : "Résine"}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3">
                      <h3 className="font-display text-lg text-foreground group-hover:text-primary transition-colors">
                        {similarProduct.name}
                      </h3>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-primary font-medium">
                          {similarProduct.price}€/g
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {similarProduct.cbdPercentage} CBD
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductPage;
