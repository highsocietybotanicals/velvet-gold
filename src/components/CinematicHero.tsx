import { useEffect, useRef, useState } from "react";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, FlaskConical, Leaf, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import mangoImage from "@/assets/flowers/mango-x-ice-real.jpg";
import platinumImage from "@/assets/flowers/platinum-og-real.jpg";
import lemonImage from "@/assets/resins/lemon-punch-hash-real.jpg";
import bhmImage from "@/assets/resins/bhm-real.jpg";
import lemonVideo from "@/assets/videos/lemon-punch-hash.mp4.asset.json";
import TerpeneRadar from "@/components/TerpeneRadar";

const terpeneProfile = { boise: 45, fruite: 95, epice: 35, terreux: 55 };

const collection = [
  { name: "Mango X Ice", kind: "Fleur Exotique", image: mangoImage },
  { name: "Platinum OG", kind: "Cali Genetics", image: platinumImage },
  { name: "Lemon Punch Hash", kind: "Résine Force Noire", image: lemonImage, video: lemonVideo.url },
  { name: "BHM", kind: "Résine Exotique", image: bhmImage },
];

const TrichomeCanvas = ({ active }: { active: boolean }) => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !active) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    let visible = !document.hidden;
    const mobile = window.matchMedia("(max-width: 767px)").matches;
    const count = mobile ? 40 : 90;
    let width = 0;
    let height = 0;
    const particles = Array.from({ length: count }, () => ({
      x: Math.random(), y: Math.random(), size: 0.5 + Math.random() * 1.8,
      speed: 0.0002 + Math.random() * 0.0007, drift: (Math.random() - 0.5) * 0.00025,
      phase: Math.random() * Math.PI * 2,
    }));

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (time: number) => {
      frame = 0;
      if (!visible) return;
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        p.y -= p.speed;
        p.x += p.drift;
        if (p.y < -0.02) p.y = 1.02;
        if (p.x < -0.02) p.x = 1.02;
        if (p.x > 1.02) p.x = -0.02;
        const glow = 0.35 + Math.sin(time * 0.0015 + p.phase) * 0.25;
        ctx.fillStyle = `hsl(43 70% 60% / ${glow})`;
        ctx.beginPath();
        ctx.arc(p.x * width, p.y * height, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      frame = requestAnimationFrame(draw);
    };

    const resume = () => {
      visible = !document.hidden;
      if (visible && !frame) frame = requestAnimationFrame(draw);
      if (!visible && frame) cancelAnimationFrame(frame);
    };

    resize();
    frame = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", resume);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", resume);
    };
  }, [active]);

  return <canvas ref={ref} aria-hidden="true" className="absolute inset-0 h-full w-full pointer-events-none" />;
};

const CinematicHero = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  const [activeAct, setActiveAct] = useState(0);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });

  const imageScale = useTransform(scrollYProgress, [0, 0.23, 0.46, 0.72], [1.35, 1, 3, 1.08]);
  const imageOpacity = useTransform(scrollYProgress, [0, 0.5, 0.7, 1], [1, 1, 0.28, 0]);
  const actOneOpacity = useTransform(scrollYProgress, [0, 0.08, 0.2, 0.27], [0, 1, 1, 0]);
  const actTwoOpacity = useTransform(scrollYProgress, [0.2, 0.3, 0.43, 0.5], [0, 1, 1, 0]);
  const actThreeOpacity = useTransform(scrollYProgress, [0.44, 0.55, 0.68, 0.75], [0, 1, 1, 0]);
  const actFourOpacity = useTransform(scrollYProgress, [0.68, 0.78, 1], [0, 1, 1]);
  const cardsY = useTransform(scrollYProgress, [0.48, 0.6, 0.72], [120, 0, -50]);
  const carouselX = useTransform(scrollYProgress, [0.72, 1], ["15%", "-12%"]);
  const thcCount = useTransform(scrollYProgress, [0.27, 0.42], [0, 0.3]);
  const leftCardRotate = useTransform(scrollYProgress, [0.5, 0.62], [-8, 0]);
  const leftCardDepth = useTransform(scrollYProgress, [0.5, 0.62], [-100, 0]);
  const centerCardDepth = useTransform(scrollYProgress, [0.5, 0.62], [-40, 0]);
  const rightCardRotate = useTransform(scrollYProgress, [0.5, 0.62], [8, 0]);
  const rightCardDepth = useTransform(scrollYProgress, [0.5, 0.62], [-100, 0]);
  const [thc, setThc] = useState("0,0");

  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    setActiveAct(Math.min(3, Math.floor(progress * 4)));
  });
  useMotionValueEvent(thcCount, "change", (value) => setThc(value.toFixed(1).replace(".", ",")));

  if (reducedMotion) {
    return (
      <section ref={sectionRef} className="relative min-h-[88vh] flex items-center overflow-hidden bg-carbon-deep">
        <img ref={(node) => node?.setAttribute("fetchpriority", "high")} src={mangoImage} alt="Mango X Ice, fleur premium" width={1200} height={1200} className="absolute inset-0 h-full w-full object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/35 to-background/60" />
        <div className="relative z-10 container mx-auto px-6 pt-24 text-center">
          <p className="mb-5 text-xs uppercase text-primary tracking-[0.3em]">Collection exclusive</p>
          <h1 className="font-display text-5xl md:text-7xl text-gold-gradient">L'Excellence Botanique</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-foreground/80">Fleurs et résines CBD d'exception, sélectionnées pour les connaisseurs</p>
          <div className="mt-9 flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/catalogue" className="btn-luxury">Explorer la collection</Link>
            <Link to="/sommelier" className="btn-luxury-outline">Le Sommelier</Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} className="relative h-[250vh] md:h-[400vh] bg-carbon-deep">
      <div className="sticky top-0 h-screen overflow-hidden [perspective:1400px]">
        <motion.img
          src={mangoImage}
          alt="Mango X Ice, fleur premium"
          ref={(node) => node?.setAttribute("fetchpriority", "high")}
          width={1200}
          height={1200}
          style={{ scale: imageScale, opacity: imageOpacity }}
          className="absolute inset-0 h-full w-full object-cover will-change-transform"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/35 to-background/70" />
        <div className="absolute inset-0 bg-gradient-gold-radial opacity-40" />
        <div className="absolute inset-0 shadow-[inset_0_0_180px_hsl(var(--background))]" />

        <motion.div style={{ opacity: actOneOpacity }} className="absolute inset-0 z-10 flex items-center justify-center px-6 text-center">
          <div className="max-w-4xl pt-16">
            <p className="mb-5 text-xs uppercase text-primary/80 tracking-[0.3em]">Collection exclusive</p>
            <h1 className="font-display text-5xl sm:text-6xl md:text-8xl leading-[0.95]">
              {["L'Excellence", "Botanique"].map((word, index) => (
                <motion.span key={word} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.22, duration: 0.7 }} className="block text-gold-gradient">{word}</motion.span>
              ))}
            </h1>
            <p className="mx-auto mt-7 max-w-2xl text-base md:text-xl text-foreground/80">Fleurs et résines CBD d'exception, sélectionnées pour les connaisseurs</p>
          </div>
        </motion.div>

        <motion.div style={{ opacity: actTwoOpacity }} className="absolute inset-0 z-20 flex items-center justify-center px-6 text-center backdrop-blur-[1px]">
          <TrichomeCanvas active={activeAct === 1} />
          <div className="relative max-w-3xl">
            <p className="text-xs uppercase tracking-[0.3em] text-primary/70">Acte II</p>
            <h2 className="mt-4 font-display text-4xl md:text-7xl text-gold-gradient">Au cœur de la fleur</h2>
            <p className="mt-5 text-lg md:text-2xl text-foreground/85">Chaque variété analysée en laboratoire</p>
            <div className="mx-auto mt-8 w-fit border border-primary/50 bg-background/55 px-6 py-3 backdrop-blur-md">
              <span className="text-sm uppercase tracking-[0.2em] text-muted-foreground">THC </span>
              <span className="font-display text-3xl text-primary">&lt; {thc} %</span>
            </div>
          </div>
        </motion.div>

        <motion.div style={{ opacity: actThreeOpacity, y: cardsY }} className="absolute inset-0 z-30 flex items-center px-5 md:px-10">
          <div className="mx-auto w-full max-w-6xl">
            <div className="mb-7 text-center">
              <p className="text-xs uppercase tracking-[0.3em] text-primary/70">Acte III</p>
              <h2 className="mt-3 font-display text-4xl md:text-6xl text-gold-gradient">Décomposition</h2>
            </div>
            <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 md:grid md:grid-cols-3 md:overflow-visible [scrollbar-width:none]">
              <motion.article style={{ rotateY: leftCardRotate, z: leftCardDepth }} className="min-w-[82vw] snap-center border border-primary/40 bg-card/65 p-5 backdrop-blur-xl md:min-w-0 max-md:transform-none">
                <div className="flex items-center gap-3 text-primary"><Leaf className="h-5 w-5" /><h3 className="font-display text-xl">Profil terpénique</h3></div>
                <div className="mt-2 flex justify-center"><TerpeneRadar terpenes={terpeneProfile} size={190} /></div>
              </motion.article>
              <motion.article style={{ z: centerCardDepth }} className="min-w-[82vw] snap-center border border-primary/40 bg-card/65 p-6 backdrop-blur-xl md:min-w-0 max-md:transform-none">
                <FlaskConical className="h-6 w-6 text-primary" />
                <h3 className="mt-5 font-display text-2xl text-primary">Analyse labo</h3>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">Chaque référence est contrôlée pour garantir sa conformité, sa composition et sa traçabilité.</p>
                <div className="mt-8 divider-gold" />
                <p className="mt-5 text-xs uppercase tracking-[0.2em] text-foreground/75">THC inférieur à 0,3 %</p>
              </motion.article>
              <motion.article style={{ rotateY: rightCardRotate, z: rightCardDepth }} className="min-w-[82vw] snap-center border border-primary/40 bg-card/65 p-6 backdrop-blur-xl md:min-w-0 max-md:transform-none">
                <MapPin className="h-6 w-6 text-primary" />
                <h3 className="mt-5 font-display text-2xl text-primary">Origine & culture</h3>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">Des cultures indoor sélectionnées pour leur régularité, leur précision aromatique et leur finition.</p>
                <div className="mt-8 divider-gold" />
                <p className="mt-5 text-xs uppercase tracking-[0.2em] text-foreground/75">Sélection haute couture</p>
              </motion.article>
            </div>
          </div>
        </motion.div>

        <motion.div style={{ opacity: actFourOpacity }} className="absolute inset-0 z-40 flex flex-col justify-center bg-background/92 pt-20 backdrop-blur-sm">
          <div className="px-6 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-primary/70">Acte IV</p>
            <h2 className="mt-3 font-display text-4xl md:text-6xl text-gold-gradient">La Collection</h2>
          </div>
          <div className="mt-7 overflow-hidden">
            <motion.div style={{ x: carouselX }} className="flex w-max gap-4 px-5 md:gap-6">
              {collection.map((item) => (
                <article key={item.name} className="relative h-[34vh] w-[70vw] max-w-[360px] overflow-hidden border border-primary/30 bg-card md:h-[40vh] md:w-[28vw]">
                  {item.video ? (
                    <video src={item.video} poster={item.image} autoPlay muted loop playsInline preload="metadata" className="h-full w-full object-cover" />
                  ) : (
                    <img src={item.image} alt={item.name} loading="lazy" width={1200} height={1200} className="h-full w-full object-cover" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 p-5"><p className="text-xs uppercase tracking-[0.2em] text-primary/75">{item.kind}</p><h3 className="mt-1 font-display text-2xl text-foreground">{item.name}</h3></div>
                </article>
              ))}
            </motion.div>
          </div>
          <div className="mt-7 flex flex-col sm:flex-row justify-center gap-3 px-6">
            <Link to="/catalogue" className="btn-luxury inline-flex items-center justify-center gap-2">Explorer la collection <ArrowRight className="h-4 w-4" /></Link>
            <Link to="/sommelier" className="btn-luxury-outline text-center">Le Sommelier</Link>
          </div>
        </motion.div>

        <div className="absolute right-4 top-1/2 z-50 flex -translate-y-1/2 flex-col gap-3 md:right-7" aria-label={`Acte ${activeAct + 1} sur 4`}>
          {[0, 1, 2, 3].map((act) => <span key={act} className={`block h-8 w-px transition-colors duration-300 ${act === activeAct ? "bg-primary" : "bg-border"}`} />)}
        </div>
      </div>
    </section>
  );
};

export default CinematicHero;
