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
import CartDrawer from "./components/CartDrawer";
import SommelierChatbot from "./components/SommelierChatbot";
import ErrorBoundary from "./components/ErrorBoundary";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <ScrollToTop />
          <AuthProvider>
            <CartProvider>
              <Toaster />
              <Sonner />
              <CartDrawer />
              <SommelierChatbot />
              <AnimatedRoutes />
            </CartProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
