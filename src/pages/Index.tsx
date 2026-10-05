import { useState } from "react";
import Header from "@/components/Header";
import AccessoriesSection from "@/components/AccessoriesSection";
import Footer from "@/components/Footer";
import MinuitHome from "@/components/minuit/MinuitHome";

const readVerified = () => {
  try {
    return sessionStorage.getItem("hsb-age-verified") === "true";
  } catch {
    return false;
  }
};

const Index = () => {
  // La porte d'âge (rideau de fer 3D) est dans MinuitHome ; l'en-tête apparaît une fois la porte passée.
  const [entered, setEntered] = useState(readVerified);

  return (
    <div className="min-h-screen bg-background">
      {entered && <Header />}
      <main>
        <MinuitHome onEnter={() => setEntered(true)} />
        <AccessoriesSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
