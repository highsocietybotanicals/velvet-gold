import Header from "@/components/Header";
import SommelierSection from "@/components/SommelierSection";
import Footer from "@/components/Footer";

const SommelierPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        <SommelierSection />
      </main>
      <Footer />
    </div>
  );
};

export default SommelierPage;
