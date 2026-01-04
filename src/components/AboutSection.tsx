import { motion } from "framer-motion";
import { Shield, Leaf, Award, Heart } from "lucide-react";

const values = [
  {
    icon: <Leaf className="w-8 h-8" />,
    title: "Culture d'Excellence",
    description: "Nos fleurs sont cultivées dans des conditions optimales, sans pesticides ni produits chimiques.",
  },
  {
    icon: <Shield className="w-8 h-8" />,
    title: "Qualité Certifiée",
    description: "Chaque lot est analysé en laboratoire pour garantir un taux de THC < 0.3% et une pureté absolue.",
  },
  {
    icon: <Award className="w-8 h-8" />,
    title: "Sélection Rigoureuse",
    description: "Seules les génétiques les plus prometteuses intègrent notre collection exclusive.",
  },
  {
    icon: <Heart className="w-8 h-8" />,
    title: "Passion Artisanale",
    description: "De la graine à l'emballage, chaque étape est réalisée avec une attention méticuleuse.",
  },
];

const AboutSection = () => {
  return (
    <section id="societe" className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-dark" />
      <div className="absolute inset-0 texture-velvet opacity-20" />

      <div className="relative container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Text content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-primary/80 tracking-[0.3em] uppercase text-sm mb-4 font-body"
            >
              Notre Histoire
            </motion.p>

            <h2 className="font-display text-4xl md:text-5xl mb-6">
              <span className="text-gold-gradient">La Société</span>
            </h2>

            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="w-32 h-px bg-gradient-to-r from-primary to-transparent mb-8"
            />

            <div className="space-y-6 text-muted-foreground font-body text-lg leading-relaxed">
              <p>
                <span className="text-foreground font-display text-xl">High Society Botanicals</span> est 
                née d'une passion commune pour l'excellence botanique et d'un désir 
                de redéfinir les standards du marché du CBD.
              </p>
              <p>
                Fondée à Paris, notre maison sélectionne avec une rigueur absolue 
                les plus belles génétiques pour offrir à nos membres une expérience 
                sensorielle incomparable.
              </p>
              <p>
                Chaque variété de notre collection est le fruit d'un travail méticuleux, 
                alliant traditions ancestrales et innovations modernes.
              </p>
            </div>

            <motion.a
              href="#contact"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="inline-block mt-8 btn-luxury-outline"
            >
              En Savoir Plus
            </motion.a>
          </motion.div>

          {/* Values grid */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 gap-6"
          >
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6 hover:border-primary/30 transition-colors duration-300"
              >
                <div className="text-primary mb-4">{value.icon}</div>
                <h3 className="font-display text-lg text-foreground mb-2">
                  {value.title}
                </h3>
                <p className="text-sm text-muted-foreground font-body">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
