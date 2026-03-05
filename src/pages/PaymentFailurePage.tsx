import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { XCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const PaymentFailurePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <XCircle className="w-20 h-20 text-destructive mx-auto mb-6" />
          <h1 className="font-display text-3xl text-foreground mb-4">
            Paiement échoué
          </h1>
          <p className="text-muted-foreground mb-8">
            Le paiement n'a pas pu être traité. Aucun montant n'a été débité. Veuillez réessayer.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => navigate("/catalogue")}
              className="w-full btn-luxury py-3"
            >
              Retour au catalogue
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

export default PaymentFailurePage;
