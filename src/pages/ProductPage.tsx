import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Minus, ShoppingCart, ZoomIn, RotateCcw } from "lucide-react";
import { allProducts } from "@/data/products";
import { useCart } from "@/contexts/CartContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TerpeneRadar from "@/components/TerpeneRadar";

const ProductPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  const product = allProducts.find((p) => p.id === id);
  
  const [quantity, setQuantity] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showLoupe, setShowLoupe] = useState(false);
  const [loupePosition, setLoupePosition] = useState({ x: 0, y: 0 });
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  const imageRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef(0);
  const lastRotation = useRef(0);

  // 360° rotation handling
  const handleMouseDown = (e: React.MouseEvent) => {
    if (showLoupe) return;
    setIsDragging(true);
    dragStartX.current = e.clientX;
    lastRotation.current = rotation;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && !showLoupe) {
      const deltaX = e.clientX - dragStartX.current;
      setRotation(lastRotation.current + deltaX * 0.5);
    }
    
    // Loupe position
    if (showLoupe && imageRef.current) {
      const rect = imageRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setLoupePosition({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
      setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, []);

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity);
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
            {/* Product Image with 360° and Loupe */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div
                ref={imageRef}
                className={`relative aspect-square bg-card rounded-2xl overflow-hidden border border-border cursor-${showLoupe ? 'zoom-in' : 'grab'} ${isDragging ? 'cursor-grabbing' : ''}`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={() => setIsDragging(false)}
              >
                <motion.img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  style={{
                    transform: `rotateY(${rotation}deg) scale(1.1)`,
                    transformStyle: "preserve-3d",
                  }}
                  draggable={false}
                />
                
                {/* Loupe overlay */}
                <AnimatePresence>
                  {showLoupe && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute w-40 h-40 border-2 border-primary rounded-full overflow-hidden pointer-events-none shadow-lg"
                      style={{
                        left: mousePosition.x - 80,
                        top: mousePosition.y - 80,
                        backgroundImage: `url(${product.image})`,
                        backgroundSize: "400%",
                        backgroundPosition: `${loupePosition.x}% ${loupePosition.y}%`,
                      }}
                    />
                  )}
                </AnimatePresence>

                {/* Controls overlay */}
                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowLoupe(!showLoupe);
                      }}
                      className={`p-3 rounded-full border transition-all ${
                        showLoupe
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background/80 border-border hover:border-primary"
                      }`}
                    >
                      <ZoomIn className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRotation(0);
                      }}
                      className="p-3 rounded-full bg-background/80 border border-border hover:border-primary transition-all"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </button>
                  </div>
                  <span className="text-xs text-muted-foreground bg-background/80 px-3 py-1 rounded-full">
                    {showLoupe ? "Mode loupe actif" : "Glissez pour pivoter"}
                  </span>
                </div>
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

              <p className="text-muted-foreground leading-relaxed mb-8">
                {product.description}
              </p>

              {/* Mood tag */}
              <div className="mb-8">
                <span className="text-sm text-muted-foreground">Ambiance</span>
                <span className="ml-3 px-4 py-2 bg-card border border-border rounded-full text-foreground">
                  {product.mood}
                </span>
              </div>

              {/* Quantity & Add to cart */}
              <div className="flex items-center gap-4 mb-8">
                <div className="flex items-center bg-card border border-border rounded-full">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="p-4 hover:text-primary transition-colors"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="w-12 text-center font-medium">{quantity}g</span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="p-4 hover:text-primary transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <button
                  onClick={handleAddToCart}
                  className="flex-1 btn-luxury flex items-center justify-center gap-3"
                >
                  <ShoppingCart className="w-5 h-5" />
                  Ajouter au panier
                </button>
              </div>

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
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductPage;
