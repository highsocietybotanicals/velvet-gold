import { useState, useEffect } from "react";
import AgeGate from "@/components/AgeGate";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import ProductSection from "@/components/ProductSection";
import AccessoriesSection from "@/components/AccessoriesSection";
import Footer from "@/components/Footer";
import WelcomePopup from "@/components/WelcomePopup";

const Index = () => {
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);

  useEffect(() => {
    const verified = sessionStorage.getItem("hsb-age-verified");
    if (verified === "true") {
      setIsVerified(true);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (isVerified) {
      const alreadyShown = localStorage.getItem("hsb-welcome-popup-shown");
      if (!alreadyShown) {
        const timer = setTimeout(() => setShowWelcomePopup(true), 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [isVerified]);

  const handleVerified = () => {
    sessionStorage.setItem("hsb-age-verified", "true");
    setIsVerified(true);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isVerified) {
    return <AgeGate onVerified={handleVerified} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <ProductSection />
      </main>
      <Footer />
      {showWelcomePopup && (
        <WelcomePopup onClose={() => setShowWelcomePopup(false)} />
      )}
    </div>
  );
};

export default Index;
