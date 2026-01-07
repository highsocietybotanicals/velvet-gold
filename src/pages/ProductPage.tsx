import { useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ShoppingCart, Gift, Package } from "lucide-react";
import { allProducts } from "@/data/products";
import { useCart } from "@/contexts/CartContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TerpeneRadar from "@/components/TerpeneRadar";
import { Input } from "@/components/ui/input";

// Weight tier discounts
const WEIGHT_TIERS = [
  { min: 0, max: 9.99, discount: 0, label: "0%" },
  { min: 10, max: 24.99, discount: 0.25, label: "-25%" },
  { min: 25, max: 49.99, discount: 0.375, label: "-37.5%" },
  { min: 50, max: 99.99, discount: 0.458, label: "-45.8%" },
  { min: 100, max: Infinity, discount: 0.625, label: "-62.5%" },
];

const PRESET_WEIGHTS = [2.5, 10, 25, 50, 100];

const getDiscountTier = (weight: number) => {
  return WEIGHT_TIERS.find(tier => weight >= tier.min && weight <= tier.max) || WEIGHT_TIERS[0];
};

const calculatePrice = (basePrice: number, weight: number) => {
  const tier = getDiscountTier(weight);
  const rawPrice = basePrice * weight;
  const discountedPrice = rawPrice * (1 - tier.discount);
  return {
    rawPrice: rawPrice.toFixed(2),
    finalPrice: discountedPrice.toFixed(2),
    discount: tier.discount,
    discountLabel: tier.label,
    savings: (rawPrice - discountedPrice).toFixed(2),
  };
};

const getGifts = (weight: number) => {
  if (weight >= 100) {
    return { type: "kit", count: 1, label: "Kit Professionnel HSB" };
  }
  const packs = Math.floor(weight / 10);
  if (packs > 0) {
    return { type: "pack", count: packs, label: `${packs} Pack${packs > 1 ? "s" : ""} Accessoires` };
  }
  return null;
};

// Calculate similarity between two products based on terpenes
const calculateTerpeneSimilarity = (
  terpenes1: Record<string, number>,
  terpenes2: Record<string, number>
): number => {
  const allKeys = new Set([...Object.keys(terpenes1), ...Object.keys(terpenes2)]);
  let similarity = 0;
  
  allKeys.forEach((key) => {
    const val1 = terpenes1[key] || 0;
    const val2 = terpenes2[key] || 0;
    similarity += 1 - Math.abs(val1 - val2) / 100;
  });
  
  return similarity / allKeys.size;
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

  const handlePresetClick = (weight: number) => {
    setSelectedWeight(weight);
    setCustomWeight(weight.toString());
  };

  const handleCustomWeightChange = (value: string) => {
    setCustomWeight(value);
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
            {/* Product Image - Simple */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="aspect-square bg-card rounded-2xl overflow-hidden border border-border">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
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
                    className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20"
                  >
                    {gifts.type === "kit" ? (
                      <Package className="w-5 h-5 text-primary" />
                    ) : (
                      <Gift className="w-5 h-5 text-primary" />
                    )}
                    <span className="text-sm text-primary font-medium">
                      + {gifts.label} offert{gifts.count > 1 ? "s" : ""}
                    </span>
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

              {/* Terpene Radar */}
              <div className="bg-card border border-border rounded-2xl p-6">
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
