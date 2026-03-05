import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCart } from "@/contexts/CartContext";

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();

  useEffect(() => {
    clearCart();
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
          <h1 className="font-display text-3xl text-foreground mb-4">
            Paiement réussi !
          </h1>
          <p className="text-muted-foreground mb-8">
            Votre commande a été confirmée. Vous recevrez un email de confirmation sous peu.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => navigate("/profil")}
              className="w-full btn-luxury py-3"
            >
              Voir mes commandes
            </button>
            <button
              onClick={() => navigate("/")}
              className="w-full text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Retour à l'accueil
            </button>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default PaymentSuccessPage;
