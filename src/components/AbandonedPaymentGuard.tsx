import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/**
 * Supprime les commandes "fantômes" : si le client a été redirigé vers Viva
 * puis est revenu sur le site sans finaliser le paiement, la commande non
 * payée est effacée (après vérification côté Viva).
 */
const AbandonedPaymentGuard = () => {
  const location = useLocation();

  useEffect(() => {
    // La page de succès gère elle-même la vérification du paiement
    if (location.pathname === "/payment-success") return;

    const raw = localStorage.getItem("pending_payment");
    if (!raw) return;

    let parsed: { orderId?: string; vivaOrderCode?: string } | null = null;
    try {
      parsed = JSON.parse(raw);
    } catch {
      localStorage.removeItem("pending_payment");
      return;
    }

    if (!parsed?.orderId || !parsed?.vivaOrderCode) {
      localStorage.removeItem("pending_payment");
      return;
    }

    localStorage.removeItem("pending_payment");

    supabase.functions
      .invoke("abandon-order", {
        body: { orderId: parsed.orderId, vivaOrderCode: parsed.vivaOrderCode },
      })
      .catch((err) => {
        if (import.meta.env.DEV) console.error("abandon-order error:", err);
      });
  }, [location.pathname]);

  return null;
};

export default AbandonedPaymentGuard;
