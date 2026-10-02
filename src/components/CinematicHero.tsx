import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, FlaskConical, Leaf, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import emblemSource from "@/assets/brand/hsb-emblem.svg?raw";
import mangoImage from "@/assets/flowers/mango-x-ice-real.jpg";
import platinumImage from "@/assets/flowers/platinum-og-real.jpg";
import lemonImage from "@/assets/resins/lemon-punch-hash-real.jpg";
import bhmImage from "@/assets/resins/bhm-real.jpg";
import lemonVideo from "@/assets/videos/lemon-punch-hash.mp4.asset.json";
import { allProducts } from "@/data/products";
import TerpeneRadar from "@/components/TerpeneRadar";
import Title3D from "@/components/Title3D";

const mangoTerpenes = allProducts.find((product) => product.id === "mango-x-ice")?.terpenes ?? {
  boise: 0,
  fruite: 0,
  epice: 0,
  terreux: 0,
};

const collection = [
  { name: "Mango X Ice", kind: "Fleur Exotique", image: mangoImage },
  { name: "Platinum OG", kind: "Cali Genetics", image: platinumImage },
  { name: "Lemon Punch Hash", kind: "Résine Force Noire", image: lemonImage, video: lemonVideo.url },
  { name: "BHM", kind: "Résine Exotique", image: bhmImage },
];

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const segment = (progress: number, start: number, end: number) => clamp((progress - start) / (end - start));
const ease = (value: number) => value < 0.5 ? 4 * value ** 3 : 1 - ((-2 * value + 2) ** 3) / 2;

const GoldDustCanvas = ({ progress }: { progress: React.MutableRefObject<number> }) => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const mobile = window.matchMedia("(max-width: 767px)").matches;
    let width = 0;
    let height = 0;
    let frame = 0;
    let particles: Array<{ x: number; y: number; r: number; v: number; d: number; phase: number }> = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = Array.from({ length: mobile ? 35 : 80 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 0.4 + Math.random() * 1.6,
        v: 0.08 + Math.random() * 0.35,
        d: (Math.random() - 0.5) * 0.2,
        phase: Math.random() * 6.28,
      }));
    };

    const draw = (time: number) => {
      frame = 0;
      if (document.hidden) return;
      ctx.clearRect(0, 0, width, height);
      const boost = 1 + progress.current * 6;
      for (const particle of particles) {
        particle.y -= particle.v * boost;
        particle.x += particle.d;
        if (particle.y < -5) {
          particle.y = height + 5;
          particle.x = Math.random() * width;
        }
        const alpha = 0.25 + Math.sin(time / 700 + particle.phase) * 0.25;
        ctx.fillStyle = `hsl(40 70% 69% / ${alpha})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.r, 0, 6.283);
        ctx.fill();
      }
      frame = requestAnimationFrame(draw);
    };

    const onVisibility = () => {
      if (document.hidden) {
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
      } else if (!frame) {
        frame = requestAnimationFrame(draw);
      }
    };

    resize();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);
    frame = requestAnimationFrame(draw);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [progress]);

  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none absolute inset-0 z-[5] h-full w-full" />;
};

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
      for (const particle of particles) {
        particle.y -= particle.speed;
        particle.x += particle.drift;
        if (particle.y < -0.02) particle.y = 1.02;
        if (particle.x < -0.02) particle.x = 1.02;
        if (particle.x > 1.02) particle.x = -0.02;
        const glow = 0.35 + Math.sin(time * 0.0015 + particle.phase) * 0.25;
        ctx.fillStyle = `hsl(43 70% 60% / ${glow})`;
        ctx.beginPath();
        ctx.arc(particle.x * width, particle.y * height, particle.size, 0, Math.PI * 2);
        ctx.fill();
      }
      frame = requestAnimationFrame(draw);
    };
    const resume = () => {
      visible = !document.hidden;
      if (!visible) {
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
      } else if (!frame) {
        frame = requestAnimationFrame(draw);
      }
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

  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />;
};

const CinematicHero = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const emblemInnerRef = useRef<HTMLDivElement>(null);
  const emblemRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const targetRef = useRef(0);
  const reducedMotion = useReducedMotion();
  const [mobile, setMobile] = useState(false);
  const [activeAct, setActiveAct] = useState(0);
  const smoothProgress = useMotionValue(0);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });

  const emblemMarkup = useMemo(() => emblemSource
    .replace("<svg ", '<svg aria-label="High Society Botanicals" ')
    .replace("<g ", '<defs><linearGradient id="goldFill" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6e5020"/><stop offset=".28" stop-color="#d9b968"/><stop offset=".42" stop-color="#fff1c2"/><stop offset=".55" stop-color="#c79d45"/><stop offset=".78" stop-color="#f0d68e"/><stop offset="1" stop-color="#5e4219"/></linearGradient><linearGradient id="goldStroke" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8a6a2c"/><stop offset=".5" stop-color="#ffe9a8"/><stop offset="1" stop-color="#8a6a2c"/></linearGradient><linearGradient id="sheen" x1="0" y1="0" x2="1" y2="0" gradientUnits="userSpaceOnUse" gradientTransform="rotate(18)"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".47" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".85"/><stop offset=".53" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity="0"/><animate attributeName="x1" values="-6000;3300" dur="5.5s" begin="4s" repeatCount="indefinite"/><animate attributeName="x2" values="0;9300" dur="5.5s" begin="4s" repeatCount="indefinite"/></linearGradient></defs><g ')
    .replace('<path ', '<path class="emblem-draw" pathLength="1" ')
    .replace('</g></svg>', '</g><g transform="translate(0,3400) scale(0.1,-0.1)" class="emblem-fill"><use href="#official-emblem-path"/></g><g transform="translate(0,3400) scale(0.1,-0.1)" class="emblem-sheen"><use href="#official-emblem-path"/></g></svg>')
    .replace('class="emblem-draw" pathLength="1" d=', 'id="official-emblem-path" class="emblem-draw" pathLength="1" d='), []);

  const imageScale = useTransform(smoothProgress, [0.48, 0.62, 0.72], [1.35, 3, 1.08]);
  const imageOpacity = useTransform(smoothProgress, [0.44, 0.54, 0.76, 1], [0, 1, 0.3, 0]);
  const actTwoOpacity = useTransform(smoothProgress, [0.48, 0.56, 0.65, 0.7], [0, 1, 1, 0]);
  const actThreeOpacity = useTransform(smoothProgress, [0.66, 0.72, 0.81, 0.86], [0, 1, 1, 0]);
  const actFourOpacity = useTransform(smoothProgress, [0.82, 0.89, 1], [0, 1, 1]);
  const cardsY = useTransform(smoothProgress, [0.68, 0.76, 0.84], [120, 0, -50]);
  const carouselX = useTransform(smoothProgress, [0.84, 1], ["15%", "-12%"]);
  const thcCount = useTransform(smoothProgress, [0.54, 0.64], [0, 0.3]);
  const leftCardRotate = useTransform(smoothProgress, [0.7, 0.78], [-8, 0]);
  const leftCardDepth = useTransform(smoothProgress, [0.7, 0.78], [-100, 0]);
  const centerCardDepth = useTransform(smoothProgress, [0.7, 0.78], [-40, 0]);
  const rightCardRotate = useTransform(smoothProgress, [0.7, 0.78], [8, 0]);
  const rightCardDepth = useTransform(smoothProgress, [0.7, 0.78], [-100, 0]);
  const [thc, setThc] = useState("0,0");

  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const update = () => setMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    let frame = 0;
    const animate = () => {
      progressRef.current += (targetRef.current - progressRef.current) * 0.09;
      const progress = progressRef.current;
      smoothProgress.set(progress);
      const dive = ease(segment(progress, 0.12, 0.52));
      const scale = Math.exp(Math.log(90) * dive);
      const tilt = (1 - dive) * Math.sin(performance.now() / 2400) * 2;
      if (emblemInnerRef.current) emblemInnerRef.current.style.transform = `scale(${scale}) rotate(${tilt}deg)`;
      if (emblemRef.current) emblemRef.current.style.opacity = `${1 - segment(progress, 0.46, 0.53)}`;
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [reducedMotion, smoothProgress]);

  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    targetRef.current = progress;
    setActiveAct(progress < 0.52 ? 0 : progress < 0.7 ? 1 : progress < 0.86 ? 2 : 3);
  });
  useMotionValueEvent(thcCount, "change", (value) => setThc(value.toFixed(1).replace(".", ",")));

  const flashOpacity = useTransform(smoothProgress, (progress) => Math.sin(Math.PI * segment(progress, 0.42, 0.6)) * 0.95);
  const emblemSceneOpacity = useTransform(smoothProgress, [0, 0.38, 0.48, 0.54], [1, 1, 0.35, 0]);

  if (reducedMotion) {
    return (
      <section ref={sectionRef} className="relative flex min-h-[88vh] items-center overflow-hidden bg-carbon-deep">
        <div className="absolute inset-0 bg-gradient-gold-radial opacity-40" />
        <div className="relative z-10 container mx-auto px-6 pt-24 text-center">
          <div className="mx-auto mb-5 w-[min(50vw,260px)] text-primary" dangerouslySetInnerHTML={{ __html: emblemSource }} />
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">Maison de fleurs & résines CBD</p>
          <Title3D as="h1" className="mt-5 text-5xl md:text-7xl">L'Excellence Botanique</Title3D>
          <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row">
            <Link to="/catalogue" className="btn-luxury">Explorer la collection</Link>
            <Link to="/sommelier" className="btn-luxury-outline">Le Sommelier</Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} className="relative h-[380vh] bg-carbon-deep md:h-[600vh]">
      <div className="sticky top-0 h-screen h-[100svh] overflow-hidden bg-[radial-gradient(ellipse_at_50%_42%,hsl(var(--gold-dark)/0.24)_0%,hsl(var(--background))_45%,hsl(var(--carbon-deep))_100%)] [perspective:1400px]">
        <motion.img src={mangoImage} alt="Mango X Ice, fleur premium" width={1200} height={1200} {...{ fetchpriority: "high" }} style={{ scale: imageScale, opacity: imageOpacity }} className="absolute inset-0 h-full w-full object-cover will-change-transform" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/35 to-background/70" />

        <motion.div style={{ opacity: emblemSceneOpacity }} className="absolute inset-0 z-20">
          <GoldDustCanvas progress={progressRef} />
          <p className="emblem-kicker absolute left-0 right-0 top-[9vh] z-30 text-center font-mono text-[11px] uppercase tracking-[0.42em] text-primary/75">Maison de fleurs & résines CBD</p>
          <div ref={emblemRef} className="emblem-stage absolute left-1/2 top-1/2 z-20 aspect-[3300/3400] w-[min(62vmin,560px)] -translate-x-1/2 -translate-y-1/2 will-change-transform">
            <div ref={emblemInnerRef} className="h-full w-full origin-[47.95%_35.13%] will-change-transform" dangerouslySetInnerHTML={{ __html: emblemMarkup }} />
          </div>
          <div className="emblem-hint absolute bottom-[5vh] left-0 right-0 z-30 text-center font-mono text-[10px] uppercase tracking-[0.4em] text-muted-foreground">Faites défiler<i className="mx-auto mt-3 block h-[42px] w-px bg-gradient-to-b from-primary to-transparent" /></div>
        </motion.div>

        <motion.div style={{ opacity: flashOpacity }} className="pointer-events-none absolute inset-0 z-40 bg-[radial-gradient(circle_at_50%_50%,hsl(43_100%_92%)_0%,hsl(43_66%_68%)_30%,hsl(var(--gold-dark))_70%,hsl(40_62%_10%)_100%)]" />

        <motion.div style={{ opacity: actTwoOpacity }} className="absolute inset-0 z-20 flex items-center justify-center px-6 text-center backdrop-blur-[1px]">
          <TrichomeCanvas active={activeAct === 1} />
          <div className="relative max-w-3xl">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary/70">Acte II</p>
            <Title3D className="mt-4 text-4xl md:text-7xl">Au cœur de la fleur</Title3D>
            <p className="mt-5 text-lg text-foreground/85 md:text-2xl">Chaque variété analysée en laboratoire</p>
            <div className="mx-auto mt-8 w-fit border border-primary/50 bg-background/55 px-6 py-3 backdrop-blur-md">
              <span className="font-mono text-sm uppercase tracking-[0.2em] text-muted-foreground">THC </span>
              <span className="font-mono text-3xl text-primary">&lt; {thc} %</span>
            </div>
          </div>
        </motion.div>

        <motion.div style={{ opacity: actThreeOpacity, y: cardsY }} className="absolute inset-0 z-30 flex items-center px-5 md:px-10">
          <div className="mx-auto w-full max-w-6xl">
            <div className="mb-7 text-center">
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary/70">Acte III</p>
              <Title3D className="mt-3 text-4xl md:text-6xl">Décomposition</Title3D>
            </div>
            <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [scrollbar-width:none] md:grid md:grid-cols-3 md:overflow-visible">
              <motion.article style={mobile ? undefined : { rotateY: leftCardRotate, z: leftCardDepth }} className="min-w-[82vw] snap-center border border-primary/40 bg-card/65 p-5 backdrop-blur-xl md:min-w-0">
                <div className="flex items-center gap-3 text-primary"><Leaf className="h-5 w-5" /><h3 className="font-display text-xl">Profil terpénique</h3></div>
                <div className="mt-2 flex justify-center"><TerpeneRadar terpenes={mangoTerpenes} size={190} /></div>
              </motion.article>
              <motion.article style={mobile ? undefined : { z: centerCardDepth }} className="min-w-[82vw] snap-center border border-primary/40 bg-card/65 p-6 backdrop-blur-xl md:min-w-0">
                <FlaskConical className="h-6 w-6 text-primary" />
                <h3 className="mt-5 font-display text-2xl text-primary">Analyse labo</h3>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">Résultats d'analyses laboratoire consultables pour nos variétés.</p>
                <div className="divider-gold mt-8" />
                <p className="mt-5 font-mono text-xs uppercase tracking-[0.2em] text-foreground/75">THC inférieur à 0,3 %</p>
              </motion.article>
              <motion.article style={mobile ? undefined : { rotateY: rightCardRotate, z: rightCardDepth }} className="min-w-[82vw] snap-center border border-primary/40 bg-card/65 p-6 backdrop-blur-xl md:min-w-0">
                <MapPin className="h-6 w-6 text-primary" />
                <h3 className="mt-5 font-display text-2xl text-primary">Origine & culture</h3>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">Chaque variété est sélectionnée pour son profil aromatique et sa finition.</p>
                <div className="divider-gold mt-8" />
                <p className="mt-5 font-mono text-xs uppercase tracking-[0.2em] text-foreground/75">Sélection haute couture</p>
              </motion.article>
            </div>
          </div>
        </motion.div>

        <motion.div style={{ opacity: actFourOpacity }} className="absolute inset-0 z-40 flex flex-col justify-center bg-background/92 pt-20 backdrop-blur-sm">
          <div className="px-6 text-center">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary/70">Acte IV</p>
            <Title3D className="mt-3 text-4xl md:text-6xl">La Collection</Title3D>
          </div>
          <div className="mt-7 overflow-hidden">
            <motion.div style={{ x: carouselX }} className="flex w-max gap-4 px-5 md:gap-6">
              {collection.map((item) => (
                <article key={item.name} className="relative h-[34vh] w-[70vw] max-w-[360px] overflow-hidden border border-primary/30 bg-card md:h-[40vh] md:w-[28vw]">
                  {item.video ? <video src={item.video} poster={item.image} autoPlay muted loop playsInline preload="metadata" className="h-full w-full object-cover" /> : <img src={item.image} alt={item.name} loading="lazy" width={1200} height={1200} className="h-full w-full object-cover" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 p-5"><p className="font-mono text-xs uppercase tracking-[0.2em] text-primary/75">{item.kind}</p><h3 className="mt-1 font-display text-2xl text-foreground">{item.name}</h3></div>
                </article>
              ))}
            </motion.div>
          </div>
          <div className="mt-7 flex flex-col justify-center gap-3 px-6 sm:flex-row">
            <Link to="/catalogue" className="btn-luxury inline-flex items-center justify-center gap-2">Explorer la collection <ArrowRight className="h-4 w-4" /></Link>
            <Link to="/sommelier" className="btn-luxury-outline text-center">Le Sommelier</Link>
          </div>
        </motion.div>

        <div aria-hidden="true" className="hero-film-grain absolute -inset-1/2 z-[60] opacity-[0.07]" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-50 shadow-[inset_0_0_220px_60px_hsl(var(--carbon-deep))]" />
        <div className="absolute right-2 top-1/2 z-[70] flex -translate-y-1/2 flex-col gap-2.5 md:right-[22px]" aria-label={`Acte ${activeAct + 1} sur 4`}>
          {[0, 1, 2, 3].map((act) => <span key={act} className={`block h-5 w-px transition-colors duration-300 md:h-[30px] ${act === activeAct ? "bg-primary" : "bg-foreground/15"}`} />)}
        </div>
      </div>
    </section>
  );
};

export default CinematicHero;