import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Gift, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { saveContact } from "@/lib/saveContact";
import { toast } from "sonner";

interface WelcomePopupProps {
  onClose: () => void;
}

const WelcomePopup = ({ onClose }: WelcomePopupProps) => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Veuillez entrer une adresse email valide");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("send-welcome-promo", {
        body: { email },
      });

      if (error) throw error;

      setIsSubmitted(true);
      saveContact({ email, source: "welcome_popup" });
      localStorage.setItem("hsb-welcome-popup-shown", "true");
      toast.success("Code promo envoyé dans votre boîte mail !");
      setTimeout(onClose, 3000);
    } catch (err) {
      console.error("Error sending welcome promo:", err);
      toast.error("Une erreur est survenue. Réessayez plus tard.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDismiss = () => {
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        onClick={handleDismiss}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 40 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md bg-card border border-border rounded-2xl overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Gold accent bar */}
          <div className="h-1 bg-gradient-to-r from-primary via-accent to-primary" />

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-6 sm:p-8">
            {!isSubmitted ? (
              <>
                {/* Header */}
                <div className="text-center mb-6">
                  <div className="flex justify-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Percent className="w-6 h-6 text-primary" />
                    </div>
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Gift className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-serif font-bold text-foreground mb-2">
                    Bienvenue chez HSB
                  </h2>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Inscrivez-vous et recevez votre{" "}
                    <span className="text-primary font-semibold">code promo -15%</span>{" "}
                    sur votre première commande !
                  </p>
                </div>

                {/* Offers */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-3 bg-muted/50 rounded-lg p-3">
                    <Percent className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">-15% sur votre 1ère commande</p>
                      <p className="text-xs text-muted-foreground">Code promo envoyé par email</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 bg-muted/50 rounded-lg p-3">
                    <Gift className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">5g offerts pour 10g achetés</p>
                      <p className="text-xs text-muted-foreground">Bonus automatique dans votre commande</p>
                    </div>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-3">
                  <Input
                    type="email"
                    placeholder="Votre adresse email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-muted border-border focus:border-primary"
                    required
                  />
                  <Button
                    type="submit"
                    className="w-full bg-primary text-primary-foreground hover:bg-accent font-semibold"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Envoi en cours..." : "Recevoir mon code -15%"}
                  </Button>
                </form>

                <button
                  onClick={handleDismiss}
                  className="block w-full text-center mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Non merci, continuer sans code
                </button>
              </>
            ) : (
              /* Success state */
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Gift className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-serif font-bold text-foreground mb-2">
                  C'est envoyé ! 🎉
                </h3>
                <p className="text-muted-foreground text-sm">
                  Vérifiez votre boîte mail pour récupérer votre code promo{" "}
                  <span className="text-primary font-semibold">BIENVENUE15</span>.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default WelcomePopup;
