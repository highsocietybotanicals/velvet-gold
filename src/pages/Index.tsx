import { useState, useEffect } from "react";
import AgeGate from "@/components/AgeGate";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import ProductSection from "@/components/ProductSection";
import AccessoriesSection from "@/components/AccessoriesSection";
import SommelierSection from "@/components/SommelierSection";
import AboutSection from "@/components/AboutSection";
import Footer from "@/components/Footer";

const Index = () => {
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user has already verified age in this session
    const verified = sessionStorage.getItem("hsb-age-verified");
    if (verified === "true") {
      setIsVerified(true);
    }
    setIsLoading(false);
  }, []);

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
        <SommelierSection />
        <HeroSection />
        <ProductSection />
        <AccessoriesSection />
        <AboutSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
