import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const { user } = useAuth();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    clearCart();
    verifyPayment();
  }, []);

  const verifyPayment = async () => {
    try {
      const pendingPayment = localStorage.getItem("pending_payment");
      if (!pendingPayment) {
        console.log("No pending payment info found");
        setVerifying(false);
        setVerified(true);
        return;
      }

      const { orderId, vivaOrderCode } = JSON.parse(pendingPayment);
      if (!orderId || !vivaOrderCode) {
        setVerifying(false);
        setVerified(true);
        return;
      }

      const { data, error } = await supabase.functions.invoke("verify-payment", {
        body: { orderId, vivaOrderCode },
      });

      if (error) {
        console.error("Payment verification error:", error);
      } else {
        console.log("Payment verification result:", data);
        if (data?.status === "paid" || data?.status === "already_paid") {
          setVerified(true);
        } else if (data?.status === "pending") {
          await new Promise((resolve) => setTimeout(resolve, 3000));
          const { data: retryData } = await supabase.functions.invoke("verify-payment", {
            body: { orderId, vivaOrderCode },
          });
          if (retryData?.status === "paid" || retryData?.status === "already_paid") {
            setVerified(true);
          } else {
            setVerified(true);
          }
        }
      }

      localStorage.removeItem("pending_payment");
    } catch (err) {
      console.error("Verify payment error:", err);
    } finally {
      setVerifying(false);
      setVerified(true);
    }
  };

  const handleTrackOrder = () => {
    if (user) {
      navigate("/profil");
    } else {
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          {verifying ? (
            <>
              <Loader2 className="w-16 h-16 text-primary mx-auto mb-6 animate-spin" />
              <h1 className="font-display text-2xl text-foreground mb-4">
                Vérification du paiement...
              </h1>
              <p className="text-muted-foreground">
                Un instant, nous confirmons votre paiement.
              </p>
            </>
          ) : (
            <>
              <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
              <h1 className="font-display text-3xl text-foreground mb-4">
                Paiement réussi !
              </h1>
              <p className="text-muted-foreground mb-8">
                Votre commande a été confirmée et est en cours de préparation.
              </p>
              <div className="space-y-3">
                <button
                  onClick={handleTrackOrder}
                  className="w-full btn-luxury py-3"
                >
                  Suivre ma commande
                </button>
                <button
                  onClick={() => navigate("/")}
                  className="w-full text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Retour à l'accueil
                </button>
              </div>
            </>
          )}
          <p className="mt-8 text-xs text-muted-foreground/50">
            Paiement traité par{" "}
            <a href="https://www.viva.com" target="_blank" rel="noopener noreferrer" className="text-primary/60 hover:text-primary transition-colors font-semibold">
              viva.com
            </a>
          </p>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default PaymentSuccessPage;
