import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import CataloguePage from "./pages/CataloguePage";
import ProductPage from "./pages/ProductPage";
import AccessoryPage from "./pages/AccessoryPage";
import SampleSelectionPage from "./pages/SampleSelectionPage";
import AuthPage from "./pages/AuthPage";
import ProfilePage from "./pages/ProfilePage";
import AdminPage from "./pages/AdminPage";
import NotFound from "./pages/NotFound";
import CartDrawer from "./components/CartDrawer";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <Toaster />
            <Sonner />
            <CartDrawer />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/catalogue" element={<CataloguePage />} />
              <Route path="/produit/:id" element={<ProductPage />} />
              <Route path="/accessoire/:id" element={<AccessoryPage />} />
              <Route path="/echantillon" element={<SampleSelectionPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/profil" element={<ProfilePage />} />
              <Route path="/admin" element={<AdminPage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
