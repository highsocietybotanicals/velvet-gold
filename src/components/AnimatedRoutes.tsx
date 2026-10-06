import { lazy, Suspense, useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Routes, Route, useLocation, type Location } from "react-router-dom";
import PageTransition, { PagePresenceContext } from "./PageTransition";
import Index from "@/pages/Index";

// Lazy load non-critical pages for faster initial load
const CataloguePage = lazy(() => import("@/pages/CataloguePage"));
const ProductPage = lazy(() => import("@/pages/ProductPage"));
const AccessoryPage = lazy(() => import("@/pages/AccessoryPage"));
const SampleSelectionPage = lazy(() => import("@/pages/SampleSelectionPage"));
const SommelierPage = lazy(() => import("@/pages/SommelierPage"));
const SocietePage = lazy(() => import("@/pages/SocietePage"));
const ContactPage = lazy(() => import("@/pages/ContactPage"));
const AuthPage = lazy(() => import("@/pages/AuthPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const AdminLayout = lazy(() => import("@/pages/admin/AdminLayout"));
const AdminDashboardPage = lazy(() => import("@/pages/admin/DashboardPage"));
const AdminOrdersPage = lazy(() => import("@/pages/admin/OrdersPage"));
const AdminClientsPage = lazy(() => import("@/pages/admin/ClientsPage"));
const AdminClientDetailPage = lazy(() => import("@/pages/admin/ClientDetailPage"));
const AdminProductsPage = lazy(() => import("@/pages/admin/ProductsPage"));
const AdminInventoryPage = lazy(() => import("@/pages/admin/InventoryPage"));
const AdminPricesPage = lazy(() => import("@/pages/admin/PricesPage"));
const AdminProPage = lazy(() => import("@/pages/admin/ProPage"));
const AdminRentabilitePage = lazy(() => import("@/pages/admin/RentabilitePage"));
const AdminMarketingPage = lazy(() => import("@/pages/admin/MarketingPage"));
const AdminLogisticsPage = lazy(() => import("@/pages/admin/LogisticsPage"));
const AdminAccountingPage = lazy(() => import("@/pages/admin/AccountingPage"));
const AdminCommerciauxPage = lazy(() => import("@/pages/admin/CommerciauxPage"));
const MentionsLegalesPage = lazy(() => import("@/pages/MentionsLegalesPage"));
const ConfidentialitePage = lazy(() => import("@/pages/ConfidentialitePage"));
const CGVPage = lazy(() => import("@/pages/CGVPage"));
const LivraisonRetoursPage = lazy(() => import("@/pages/LivraisonRetoursPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const PaymentSuccessPage = lazy(() => import("@/pages/PaymentSuccessPage"));
const PaymentFailurePage = lazy(() => import("@/pages/PaymentFailurePage"));
const OAuthConsentPage = lazy(() => import("@/pages/OAuthConsentPage"));

const ProLandingPage = lazy(() => import("@/pages/pro/ProLandingPage"));
const ProLayout = lazy(() => import("@/pages/pro/ProLayout"));
const ProCataloguePage = lazy(() => import("@/pages/pro/ProCataloguePage"));
const ProCartPage = lazy(() => import("@/pages/pro/ProCartPage"));
const ProOrdersPage = lazy(() => import("@/pages/pro/ProOrdersPage"));
const CommercialLayout = lazy(() => import("@/pages/commercial/CommercialLayout"));
const CommercialCataloguePage = lazy(() => import("@/pages/commercial/CommercialCataloguePage"));
const CommercialProspectsPage = lazy(() => import("@/pages/commercial/CommercialProspectsPage"));
const CommercialCommissionsPage = lazy(() => import("@/pages/commercial/CommercialCommissionsPage"));
const CommercialDocumentsPage = lazy(() => import("@/pages/commercial/CommercialDocumentsPage"));
const CommercialFacturationPage = lazy(() => import("@/pages/commercial/CommercialFacturationPage"));


const LazyFallback = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

// Durée du fondu de sortie (.page-transition-exit dans index.css)
const EXIT_MS = 400;

const AnimatedRoutes = () => {
  const location = useLocation();

  // Équivalent CSS d'AnimatePresence mode="wait" : à un changement de chemin, l'ancienne page reste
  // affichée le temps de son fondu de sortie, puis la nouvelle est montée (avec son fondu d'entrée).
  const [shown, setShown] = useState(location);
  const latest = useRef(location);
  latest.current = location;
  const withExit = useRef(0); // nombre de PageTransition montées (les seules à avoir une sortie en fondu)
  const exiting = shown.pathname !== location.pathname;
  // même chemin (recherche, ancre…) : on suit sans transition, pour que la page qui s'efface garde ses paramètres exacts
  if (!exiting && shown !== location) setShown(location);

  const exitDone = useCallback(() => setShown(latest.current), []);
  const register = useCallback(() => {
    withExit.current += 1;
    return () => { withExit.current -= 1; };
  }, []);

  useLayoutEffect(() => {
    if (!exiting) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (withExit.current === 0 || reduce) { exitDone(); return; } // rien à faire disparaître : bascule immédiate
    const t = window.setTimeout(exitDone, EXIT_MS + 100); // filet si animationend n'arrive jamais
    return () => window.clearTimeout(t);
  }, [exiting, exitDone]);

  const presence = useMemo(() => ({ exiting, register, exitDone }), [exiting, register, exitDone]);
  const current: Location = exiting ? shown : location;
  // élément mémorisé : pendant la sortie, la page qui s'efface n'est pas re-rendue (seul son conteneur change de classe)
  const routes = useMemo(() => renderRoutes(current), [current]);

  return (
    <Suspense fallback={<LazyFallback />}>
      <PagePresenceContext.Provider value={presence}>{routes}</PagePresenceContext.Provider>
    </Suspense>
  );
};

function renderRoutes(location: Location) {
  return (
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageTransition><Index /></PageTransition>} />
          <Route path="/catalogue" element={<PageTransition><CataloguePage /></PageTransition>} />
          <Route path="/produit/:id" element={<PageTransition><ProductPage /></PageTransition>} />
          <Route path="/accessoire/:id" element={<PageTransition><AccessoryPage /></PageTransition>} />
          <Route path="/echantillon" element={<PageTransition><SampleSelectionPage /></PageTransition>} />
          <Route path="/sommelier" element={<PageTransition><SommelierPage /></PageTransition>} />
          <Route path="/societe" element={<PageTransition><SocietePage /></PageTransition>} />
          <Route path="/contact" element={<PageTransition><ContactPage /></PageTransition>} />
          <Route path="/auth" element={<PageTransition><AuthPage /></PageTransition>} />
          <Route path="/profil" element={<PageTransition><ProfilePage /></PageTransition>} />
          <Route path="/pro" element={<PageTransition><ProLandingPage /></PageTransition>} />
          <Route path="/pro" element={<ProLayout />}>
            <Route path="catalogue" element={<ProCataloguePage />} />
            <Route path="panier" element={<ProCartPage />} />
            <Route path="commandes" element={<ProOrdersPage />} />
          </Route>
          <Route path="/commercial" element={<CommercialLayout />}>
            <Route index element={<CommercialCataloguePage />} />
            <Route path="catalogue" element={<CommercialCataloguePage />} />
            <Route path="prospects" element={<CommercialProspectsPage />} />
            <Route path="facturation" element={<CommercialFacturationPage />} />

            <Route path="commissions" element={<CommercialCommissionsPage />} />
            <Route path="documents" element={<CommercialDocumentsPage />} />
          </Route>
          <Route path="/admin" element={<AdminLayout />}>

            <Route index element={<AdminDashboardPage />} />
            <Route path="tableau-de-bord" element={<AdminDashboardPage />} />
            <Route path="commandes" element={<AdminOrdersPage />} />
            <Route path="clients" element={<AdminClientsPage />} />
            <Route path="clients/:key" element={<AdminClientDetailPage />} />
            <Route path="produits" element={<AdminProductsPage />} />
            <Route path="inventaire" element={<AdminInventoryPage />} />
            <Route path="prix" element={<AdminPricesPage />} />
            <Route path="pro" element={<AdminProPage />} />
            <Route path="rentabilite" element={<AdminRentabilitePage />} />
            <Route path="marketing" element={<AdminMarketingPage />} />
            <Route path="logistique" element={<AdminLogisticsPage />} />
            <Route path="comptabilite" element={<AdminAccountingPage />} />
            <Route path="commerciaux" element={<AdminCommerciauxPage />} />
          </Route>
          <Route path="/mentions-legales" element={<PageTransition><MentionsLegalesPage /></PageTransition>} />
          <Route path="/confidentialite" element={<PageTransition><ConfidentialitePage /></PageTransition>} />
          <Route path="/cgv" element={<PageTransition><CGVPage /></PageTransition>} />
          <Route path="/livraison-retours" element={<PageTransition><LivraisonRetoursPage /></PageTransition>} />
          <Route path="/payment-success" element={<PageTransition><PaymentSuccessPage /></PageTransition>} />
          <Route path="/payment-failure" element={<PageTransition><PaymentFailurePage /></PageTransition>} />
          <Route path="/.lovable/oauth/consent" element={<OAuthConsentPage />} />
          <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />

        </Routes>
  );
}

export default AnimatedRoutes;
