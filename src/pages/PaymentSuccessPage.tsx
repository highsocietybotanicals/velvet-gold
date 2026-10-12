import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, Clock, Loader2, Mail } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

// Retour de Viva : /payment-success?t=<transaction>&s=<code de commande Viva>…
// On interroge verify-payment jusqu'à 6 fois (toutes les 3 s). Le panier n'est vidé que si
// le paiement est confirmé ou si la commande existe bien.

type Phase = "checking" | "paid" | "pending" | "unknown";
type PendingPayment = { orderId?: string; vivaOrderCode?: string | number };
type VerifyResult = { status?: string; orderNumber?: string | null };

const MAX_ATTEMPTS = 6;
const RETRY_DELAY_MS = 3000;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ORDER_CODE_RE = /^\d{6,24}$/;
const TRANSACTION_ID_RE = /^[0-9a-f-]{32,36}$/i;
const CONTACT_EMAIL = "contact@highsocietybotanicals.com"; // adresse du pied de page et des mentions légales

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function readPendingPayment(): PendingPayment | null {
  try {
    const raw = localStorage.getItem("pending_payment");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as PendingPayment) : null;
  } catch {
    return null;
  }
}

function forgetPendingPayment() {
  try {
    localStorage.removeItem("pending_payment");
  } catch {
    // stockage indisponible : rien à faire
  }
}

async function callVerifyPayment(body: Record<string, string>): Promise<VerifyResult | null> {
  try {
    const { data, error } = await supabase.functions.invoke("verify-payment", { body });
    if (!error) return (data as VerifyResult) ?? null;
    // Réponse non 2xx (404 commande introuvable, 400…) : on lit le statut renvoyé.
    const context = (error as { context?: unknown }).context;
    if (context instanceof Response) {
      try {
        const payload = await context.clone().json();
        if (payload && typeof payload.status === "string") return payload as VerifyResult;
      } catch {
        // corps illisible
      }
    }
    if (import.meta.env.DEV) console.error("Payment verification error:", error);
    return null;
  } catch (err) {
    if (import.meta.env.DEV) console.error("Payment verification error:", err);
    return null;
  }
}

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();
  const { user } = useAuth();
  const [phase, setPhase] = useState<Phase>("checking");
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  // Nombre de vérifications lancées (bouton « Vérifier à nouveau »).
  const [checkRun, setCheckRun] = useState(0);

  // Lu une seule fois : la mémoire locale est effacée dès l'arrivée sur la page, pour qu'un
  // départ vers une autre page pendant la vérification ne fasse jamais annuler la commande.
  const storedRef = useRef<PendingPayment | null | undefined>(undefined);
  if (storedRef.current === undefined) storedRef.current = readPendingPayment();

  // Paramètres de vérification, calculés une seule fois (null : aucun code de commande Viva).
  const verifyBodyRef = useRef<Record<string, string> | null | undefined>(undefined);
  if (verifyBodyRef.current === undefined) {
    const stored = storedRef.current ?? null;
    const codeFromUrl = (searchParams.get("s") ?? "").trim();
    const transactionFromUrl = (searchParams.get("t") ?? "").trim();
    const storedCode = stored?.vivaOrderCode != null ? String(stored.vivaOrderCode).trim() : "";

    const vivaOrderCode = ORDER_CODE_RE.test(codeFromUrl)
      ? codeFromUrl
      : ORDER_CODE_RE.test(storedCode)
        ? storedCode
        : "";
    // L'id mémorisé n'est utilisé que s'il correspond bien à la commande payée.
    const orderId =
      stored?.orderId && UUID_RE.test(stored.orderId) && storedCode === vivaOrderCode ? stored.orderId : "";

    if (!vivaOrderCode) {
      verifyBodyRef.current = null;
    } else {
      const body: Record<string, string> = { vivaOrderCode };
      if (orderId) body.orderId = orderId;
      if (TRANSACTION_ID_RE.test(transactionFromUrl)) body.transactionId = transactionFromUrl;
      verifyBodyRef.current = body;
    }
  }
  const hasVivaCode = verifyBodyRef.current !== null;

  useEffect(() => {
    let cancelled = false;
    forgetPendingPayment();

    const body = verifyBodyRef.current;
    if (!body) {
      setPhase("unknown");
      return;
    }
    setPhase("checking");

    (async () => {
      let orderExists = false;
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        const result = await callVerifyPayment(body);
        if (cancelled) return;
        if (result?.orderNumber) setOrderNumber(result.orderNumber);

        const status = result?.status;
        if (status === "paid" || status === "already_paid") {
          clearCart();
          setPhase("paid");
          return;
        }
        if (status === "pending" || status === "not_payable") orderExists = true;
        // Commande introuvable ou code incohérent : inutile d'insister.
        if (status === "not_found" || status === "mismatch" || status === "invalid") break;

        if (attempt < MAX_ATTEMPTS) await sleep(RETRY_DELAY_MS);
        if (cancelled) return;
      }
      if (orderExists) clearCart();
      setPhase(orderExists ? "pending" : "unknown");
    })();

    return () => {
      cancelled = true;
    };
    // Vérification lancée à l'arrivée sur la page, puis à chaque clic sur « Vérifier à nouveau ».
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkRun]);

  const handleTrackOrder = () => {
    if (user) {
      navigate("/profil");
    } else {
      navigate("/auth");
    }
  };

  const orderLabel = orderNumber ? ` ${orderNumber}` : "";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md w-full"
          aria-live="polite"
        >
          {phase === "checking" && (
            <>
              <Loader2 className="w-16 h-16 text-primary mx-auto mb-6 animate-spin" />
              <h1 className="font-display text-2xl text-foreground mb-4">
                Vérification du paiement...
              </h1>
              <p className="text-muted-foreground">
                Un instant, nous confirmons votre paiement auprès de la banque.
              </p>
            </>
          )}

          {phase === "paid" && (
            <>
              <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
              <h1 className="font-display text-3xl text-foreground mb-4">
                Paiement réussi !
              </h1>
              <p className="text-muted-foreground mb-8">
                Votre commande{orderLabel} a été confirmée et est en cours de préparation.
                Vous allez recevoir l'e-mail de confirmation.
              </p>
            </>
          )}

          {phase === "pending" && (
            <>
              <Clock className="w-20 h-20 text-primary mx-auto mb-6" />
              <h1 className="font-display text-3xl text-foreground mb-4">
                Paiement en cours de confirmation
              </h1>
              <p className="text-muted-foreground mb-4">
                Votre paiement est en cours de confirmation par la banque ; vous recevrez
                l'e-mail de confirmation dans quelques minutes.
              </p>
              <p className="text-sm text-muted-foreground mb-8">
                Votre commande{orderLabel} est bien enregistrée : inutile de la repasser.
              </p>
            </>
          )}

          {phase === "unknown" && (
            <>
              <Mail className="w-16 h-16 text-primary mx-auto mb-6" />
              <h1 className="font-display text-2xl text-foreground mb-4">
                Merci pour votre commande
              </h1>
              <p className="text-muted-foreground mb-4">
                Si votre paiement a bien été validé, vous recevrez l'e-mail de confirmation
                dans quelques minutes.
              </p>
              {hasVivaCode && (
                <>
                  <p className="text-sm text-foreground mb-4">
                    Nous n'avons pas encore pu confirmer votre paiement depuis cette page.
                    Merci de ne pas repasser commande avant d'avoir reçu cet e-mail ou notre
                    réponse : vous risqueriez de payer deux fois.
                  </p>
                  <button
                    onClick={() => setCheckRun((n) => n + 1)}
                    className="w-full btn-luxury py-3 mb-6"
                  >
                    Vérifier à nouveau
                  </button>
                </>
              )}
              <p className="text-sm text-muted-foreground mb-8">
                Une question ? Écrivez-nous à
                <br />
                <a href={`mailto:${CONTACT_EMAIL}`} className="inline-block mt-1 text-primary hover:underline">
                  {CONTACT_EMAIL}
                </a>
              </p>
            </>
          )}

          {phase !== "checking" && (
            <div className="space-y-3">
              {phase !== "unknown" && (
                <button
                  onClick={handleTrackOrder}
                  className="w-full btn-luxury py-3"
                >
                  Suivre ma commande
                </button>
              )}
              <button
                onClick={() => navigate("/")}
                className="w-full text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Retour à l'accueil
              </button>
            </div>
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
