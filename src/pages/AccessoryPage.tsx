import { useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Minus, Plus, ShoppingCart, Package } from "lucide-react";
import { accessories } from "@/data/accessories";
import { useCart } from "@/contexts/CartContext";
import { calculateAccessoryPrice } from "@/lib/pricing";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const AccessoryPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addAccessory } = useCart();
  const [quantity, setQuantity] = useState(1);

  const accessory = useMemo(
    () => accessories.find((a) => a.id === id),
    [id]
  );

  const otherAccessories = useMemo(
    () => accessories.filter((a) => a.id !== id),
    [id]
  );

  if (!accessory) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-display text-foreground mb-4">
            Accessoire non trouvé
          </h1>
          <Link to="/catalogue" className="btn-luxury">
            Retour au catalogue
          </Link>
        </div>
      </div>
    );
  }

  const unitPrice = accessory.price;
  const priceInfo = calculateAccessoryPrice(unitPrice, quantity);

  const handleAddToCart = () => {
    addAccessory(accessory, quantity);
  };

  const incrementQuantity = () => setQuantity((q) => q + 1);
  const decrementQuantity = () => setQuantity((q) => Math.max(1, q - 1));

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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Product Image */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-card border border-border">
                <img
                  src={accessory.image}
                  alt={accessory.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                />
              </div>
            </motion.div>

            {/* Product Info */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex flex-col"
            >
              {/* Category badge */}
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-4 h-4 text-primary" />
                <span className="text-primary text-sm tracking-widest uppercase">
                  {accessory.category === "pochon" ? "Pochon" : "Accessoire"}
                </span>
              </div>

              {/* Name */}
              <h1 className="font-display text-4xl md:text-5xl text-foreground mb-2">
                {accessory.name}
              </h1>

              {/* Subtitle */}
              <p className="text-lg text-muted-foreground mb-6">
                {accessory.description}
              </p>

              {/* Long description */}
              <div className="prose prose-invert mb-8">
                <p className="text-muted-foreground">
                  {accessory.category === "pochon" ? (
                    <>
                      Pochon zip haute qualité au design noir mat élégant. 
                      Fermeture hermétique garantissant la fraîcheur de vos produits. 
                      Design exclusif avec finitions dorées premium.
                    </>
                  ) : accessory.id === "feuilles-slim" ? (
                    <>
                      Paquet de feuilles slim ultra-fines pour une combustion parfaite. 
                      Papier naturel non blanchi, sans additifs chimiques. 
                      Format king size idéal pour tous vos mélanges.
                    </>
                  ) : (
                    <>
                      Briquet BIC personnalisé aux couleurs de la maison. 
                      Design noir mat avec logo doré gravé. 
                      Fiabilité BIC légendaire pour une flamme constante.
                    </>
                  )}
                </p>
              </div>

              {/* Price per unit */}
              <div className="mb-6">
                <span className="text-3xl font-display text-primary">
                  {unitPrice.toFixed(2)}€
                </span>
                <span className="text-muted-foreground ml-2">/ unité</span>
              </div>

              {/* Discount info */}
              <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 mb-6">
                <p className="text-primary text-sm font-medium">
                  🎁 -33% dès 10 unités achetées !
                </p>
              </div>

              {/* Quantity selector */}
              <div className="flex items-center gap-6 mb-6">
                <span className="text-muted-foreground">Quantité :</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={decrementQuantity}
                    className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center text-xl font-display">
                    {quantity}
                  </span>
                  <button
                    onClick={incrementQuantity}
                    className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-6 mb-8">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total</span>
                  <div className="text-right">
                    {priceInfo.discount > 0 ? (
                      <>
                        <span className="text-muted-foreground line-through mr-3">
                          {priceInfo.rawTotal.toFixed(2)}€
                        </span>
                        <span className="text-2xl font-display text-primary">
                          {priceInfo.finalTotal.toFixed(2)}€
                        </span>
                        <span className="ml-2 text-sm text-green-500 font-medium">
                          {priceInfo.discountLabel}
                        </span>
                      </>
                    ) : (
                      <span className="text-2xl font-display text-primary">
                        {priceInfo.finalTotal.toFixed(2)}€
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Add to cart button */}
              <button
                onClick={handleAddToCart}
                className="btn-luxury w-full flex items-center justify-center gap-3"
              >
                <ShoppingCart className="w-5 h-5" />
                Ajouter au panier
              </button>
            </motion.div>
          </div>

          {/* Other accessories section */}
          {otherAccessories.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-20"
            >
              <h2 className="font-display text-2xl text-foreground mb-8 text-center">
                Autres Accessoires
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
                {otherAccessories.map((acc) => (
                  <Link
                    key={acc.id}
                    to={`/accessoire/${acc.id}`}
                    className="group bg-card border border-border rounded-xl overflow-hidden hover:border-primary transition-colors"
                  >
                    <div className="aspect-square overflow-hidden">
                      <img
                        src={acc.image}
                        alt={acc.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-3">
                      <h3 className="font-display text-sm text-foreground">
                        {acc.name}
                      </h3>
                      <span className="text-primary text-sm">
                        {acc.price.toFixed(2)}€
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AccessoryPage;

