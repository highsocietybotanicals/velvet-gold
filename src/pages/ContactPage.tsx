import { motion } from "framer-motion";
import { Mail, MapPin, Instagram, Facebook } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const ContactPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        <section className="relative py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-dark" />
          <div className="absolute inset-0 texture-velvet opacity-20" />

          <div className="relative container mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-16"
            >
              <p className="text-primary/80 tracking-[0.3em] uppercase text-sm mb-4 font-body">
                Nous Contacter
              </p>
              <h2 className="font-display text-4xl md:text-5xl mb-6">
                <span className="text-gold-gradient">Contact</span>
              </h2>
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="w-32 h-px bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mb-6"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="max-w-lg mx-auto text-center"
            >
              <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-8 md:p-12 space-y-8">
                <div className="flex items-center justify-center gap-3 text-muted-foreground font-body">
                  <Mail className="w-5 h-5 text-primary" />
                  <span>contact@highsocietybotanicals.com</span>
                </div>
                <div className="flex items-center justify-center gap-3 text-muted-foreground font-body">
                  <MapPin className="w-5 h-5 text-primary" />
                  <span>Paris, France</span>
                </div>

                <div className="flex justify-center gap-4 pt-4">
                  <a
                    href="#"
                    className="w-12 h-12 rounded-full border border-border/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
                  >
                    <Instagram className="w-5 h-5" />
                  </a>
                  <a
                    href="#"
                    className="w-12 h-12 rounded-full border border-border/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
                  >
                    <Facebook className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ContactPage;
