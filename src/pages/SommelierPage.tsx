import Header from "@/components/Header";
import SommelierSection from "@/components/SommelierSection";
import Footer from "@/components/Footer";
import { useMinuitSkin } from "@/components/minuit/useMinuitSkin";

// « La cave du Sommelier » : habillage Minuit Carat de l'espace /sommelier.
const SommelierPage = () => {
  useMinuitSkin("sommelier");

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {/* data-fx-off : la cave gère ses propres animations (le kit hsb-fx ne découpe ni n'anime ces titres et sections) */}
      <main className="pt-20" data-fx-off="">
        <SommelierSection />
      </main>
      <Footer />
    </div>
  );
};

export default SommelierPage;
