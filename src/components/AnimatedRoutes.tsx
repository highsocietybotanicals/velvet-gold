import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import PageTransition from "./PageTransition";
import Index from "@/pages/Index";
import CataloguePage from "@/pages/CataloguePage";
import ProductPage from "@/pages/ProductPage";
import AccessoryPage from "@/pages/AccessoryPage";
import SampleSelectionPage from "@/pages/SampleSelectionPage";
import SommelierPage from "@/pages/SommelierPage";
import SocietePage from "@/pages/SocietePage";
import ContactPage from "@/pages/ContactPage";
import AuthPage from "@/pages/AuthPage";
import ProfilePage from "@/pages/ProfilePage";
import AdminPage from "@/pages/AdminPage";
import NotFound from "@/pages/NotFound";

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
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
        <Route path="/admin" element={<PageTransition><AdminPage /></PageTransition>} />
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

export default AnimatedRoutes;
