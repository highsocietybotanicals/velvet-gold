import { lazy, Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import PageTransition from "./PageTransition";
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
const AdminProductsPage = lazy(() => import("@/pages/admin/ProductsPage"));
const AdminPricesPage = lazy(() => import("@/pages/admin/PricesPage"));
const AdminProPage = lazy(() => import("@/pages/admin/ProPage"));
const AdminRentabilitePage = lazy(() => import("@/pages/admin/RentabilitePage"));
const AdminMarketingPage = lazy(() => import("@/pages/admin/MarketingPage"));
const AdminLogisticsPage = lazy(() => import("@/pages/admin/LogisticsPage"));
const AdminAccountingPage = lazy(() => import("@/pages/admin/AccountingPage"));
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

const LazyFallback = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <Suspense fallback={<LazyFallback />}>
      <AnimatePresence mode="wait">
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
          <Route path="/admin" element={<AdminLayout />}>

            <Route index element={<AdminDashboardPage />} />
            <Route path="tableau-de-bord" element={<AdminDashboardPage />} />
            <Route path="commandes" element={<AdminOrdersPage />} />
            <Route path="produits" element={<AdminProductsPage />} />
            <Route path="prix" element={<AdminPricesPage />} />
            <Route path="pro" element={<AdminProPage />} />
            <Route path="rentabilite" element={<AdminRentabilitePage />} />
            <Route path="marketing" element={<AdminMarketingPage />} />
            <Route path="logistique" element={<AdminLogisticsPage />} />
            <Route path="comptabilite" element={<AdminAccountingPage />} />
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
      </AnimatePresence>
    </Suspense>
  );
};

export default AnimatedRoutes;
