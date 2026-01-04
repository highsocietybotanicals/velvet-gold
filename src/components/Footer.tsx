import { motion } from "framer-motion";
import { Instagram, Facebook, Mail, MapPin } from "lucide-react";
import logo from "@/assets/logo.jpeg";

const Footer = () => {
  return (
    <footer id="contact" className="relative py-20 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-carbon-deep" />
      <div className="absolute inset-0 texture-velvet opacity-10" />

      {/* Top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      <div className="relative container mx-auto px-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-3 mb-6">
              <img
                src={logo}
                alt="High Society Botanicals"
                className="w-12 h-12 object-contain rounded"
              />
              <div>
                <h3 className="font-display text-lg text-primary leading-none">
                  High Society
                </h3>
                <p className="text-xs text-muted-foreground tracking-widest uppercase">
                  Botanicals
                </p>
              </div>
            </div>
            <p className="text-muted-foreground text-sm font-body leading-relaxed">
              L'excellence botanique au service des connaisseurs les plus exigeants.
            </p>
          </motion.div>

          {/* Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <h4 className="font-display text-lg text-foreground mb-6">Navigation</h4>
            <ul className="space-y-3">
              {["Accueil", "La Collection", "Le Sommelier", "La Société"].map((item) => (
                <li key={item}>
                  <a
                    href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                    className="text-muted-foreground hover:text-primary transition-colors text-sm font-body"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Legal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <h4 className="font-display text-lg text-foreground mb-6">Informations</h4>
            <ul className="space-y-3">
              {[
                "Mentions Légales",
                "Politique de Confidentialité",
                "CGV",
                "Livraison & Retours",
              ].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-primary transition-colors text-sm font-body"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <h4 className="font-display text-lg text-foreground mb-6">Contact</h4>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-muted-foreground text-sm font-body">
                <Mail className="w-4 h-4 text-primary" />
                contact@highsocietybotanicals.fr
              </li>
              <li className="flex items-center gap-3 text-muted-foreground text-sm font-body">
                <MapPin className="w-4 h-4 text-primary" />
                Paris, France
              </li>
            </ul>

            {/* Social links */}
            <div className="flex gap-4 mt-6">
              <a
                href="#"
                className="w-10 h-10 rounded-full border border-border/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full border border-border/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
              >
                <Facebook className="w-4 h-4" />
              </a>
            </div>
          </motion.div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-border/30">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-muted-foreground/60 font-body text-center md:text-left">
              © 2024 High Society Botanicals - SASU au capital de 1€ - Paris
            </p>
            <p className="text-xs text-muted-foreground/60 font-body">
              Produit réservé aux personnes majeures • CBD &lt; 0.3% THC
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
