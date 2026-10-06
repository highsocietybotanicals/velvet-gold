import Header from "@/components/Header";
import AboutSection from "@/components/AboutSection";
import Footer from "@/components/Footer";
import { useMinuitSkin } from "@/components/minuit/useMinuitSkin";

// « Le manifeste » : habillage Minuit Carat de l'espace /societe.
const SocietePage = () => {
  useMinuitSkin("societe");

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {/* data-fx-off : le manifeste gère ses propres animations (le kit hsb-fx ne découpe ni n'anime ces titres et sections) */}
      <main className="pt-20" data-fx-off="">
        <AboutSection />
      </main>
      <Footer />
    </div>
  );
};

export default SocietePage;
