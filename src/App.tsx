import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";
import { CartProvider } from "@/contexts/CartContext";
import { ProCartProvider } from "@/contexts/ProCartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import AnimatedRoutes from "./components/AnimatedRoutes";
import ErrorBoundary from "./components/ErrorBoundary";
import AbandonedPaymentGuard from "./components/AbandonedPaymentGuard";

// Tiroir panier et sommelier : fermés au chargement, chargés juste après le premier rendu (hors du bundle
// principal : ~190 Ko minifiés de calendrier, date-fns et markdown). Même place dans l'arbre, mêmes props.
// Si leur morceau ne se charge pas (réseau coupé, onglet ouvert pendant un redéploiement) : un nouvel essai, puis
// rien n'est affiché à leur place — le reste du site continue de fonctionner au lieu de tomber sur l'écran d'erreur.
const Nothing = () => null;
const CartDrawer = lazy(() =>
  import("./components/CartDrawer")
    .catch(() => import("./components/CartDrawer"))
    .catch(() => ({ default: Nothing })),
);
const SommelierChatbot = lazy(() =>
  import("./components/SommelierChatbot")
    .catch(() => import("./components/SommelierChatbot"))
    .catch(() => ({ default: Nothing })),
);

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } } });

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <ScrollToTop />
          <AbandonedPaymentGuard />
          <AuthProvider>
            <CartProvider>
              <ProCartProvider>
                <Toaster />
                <Sonner />
                <Suspense fallback={null}><CartDrawer /></Suspense>
                <Suspense fallback={null}><SommelierChatbot /></Suspense>
                <AnimatedRoutes />
              </ProCartProvider>
            </CartProvider>

          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
