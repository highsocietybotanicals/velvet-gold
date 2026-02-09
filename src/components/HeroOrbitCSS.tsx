import { motion } from "framer-motion";
import { useEffect, useState, useCallback } from "react";

import amnesiaOniria from "@/assets/flowers/amnesia-oniria-real.jpg";
import platinumOg from "@/assets/flowers/platinum-og-real.jpg";
import mintKush from "@/assets/flowers/mint-kush-real.jpg";
import blueMango from "@/assets/flowers/blue-mango-real.jpg";
import og911 from "@/assets/flowers/911-og-real.jpg";
import iceOlator from "@/assets/resins/ice-o-lator-real.jpg";
import goldenCbn from "@/assets/resins/golden-cbn-real.jpg";

const products = [
  { src: amnesiaOniria, name: "Amnesia Oniria" },
  { src: platinumOg, name: "Platinum OG" },
  { src: mintKush, name: "Mint Kush" },
  { src: blueMango, name: "Blue Mango" },
  { src: og911, name: "911 OG" },
  { src: iceOlator, name: "Ice O Lator" },
  { src: goldenCbn, name: "Golden CBN" },
];

const HeroOrbitCSS = () => {
  const [angle, setAngle] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    let raf: number;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setAngle((prev) => prev + dt * 18); // 18 degrees/sec → ~20s per full orbit
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const radius = isMobile ? 110 : 185;
  const imgSize = isMobile ? 56 : 80;
  const containerSize = isMobile ? 300 : 460;

  return (
    <div
      className="relative mx-auto"
      style={{ width: containerSize, height: containerSize }}
    >
      {/* Central golden glow */}
      <div
        className="absolute rounded-full"
        style={{
          width: containerSize * 0.5,
          height: containerSize * 0.5,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background:
            "radial-gradient(circle, rgba(212,175,55,0.35) 0%, rgba(212,175,55,0.12) 40%, transparent 70%)",
          filter: "blur(20px)",
        }}
      />

      {/* Pulsing inner core */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute rounded-full"
        style={{
          width: 60,
          height: 60,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background:
            "radial-gradient(circle, rgba(245,215,110,0.9) 0%, rgba(212,175,55,0.4) 50%, transparent 100%)",
          boxShadow: "0 0 60px 20px rgba(212,175,55,0.3)",
        }}
      />

      {/* Orbit ring (subtle) */}
      <div
        className="absolute rounded-full border border-primary/10"
        style={{
          width: radius * 2,
          height: radius * 2,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />

      {/* Gold dust falling particles */}
      {[...Array(12)].map((_, i) => {
        const px = 20 + Math.random() * 60;
        const py = 10 + Math.random() * 80;
        return (
          <motion.div
            key={`dust-${i}`}
            className="absolute rounded-full"
            style={{
              width: 2 + Math.random() * 3,
              height: 2 + Math.random() * 3,
              left: `${px}%`,
              top: `${py}%`,
              background: "rgba(212,175,55,0.8)",
            }}
            animate={{
              y: [0, 40, 80],
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 3,
              delay: Math.random() * 4,
              repeat: Infinity,
              ease: "easeIn",
            }}
          />
        );
      })}

      {/* Orbiting products */}
      {products.map((product, i) => {
        const baseAngle = (360 / products.length) * i;
        const currentDeg = baseAngle + angle;
        const rad = (currentDeg * Math.PI) / 180;
        const x = Math.cos(rad) * radius;
        const y = Math.sin(rad) * radius * 0.45; // ellipse for 3D perspective
        const floatY = Math.sin(rad * 1.3 + i) * 8;
        // Scale based on position: bigger when "in front"
        const depth = (Math.sin(rad) + 1) / 2; // 0 = back, 1 = front
        const scale = 0.7 + depth * 0.35;
        const zIndex = Math.round(depth * 20);
        const brightness = 0.6 + depth * 0.4;

        return (
          <div
            key={product.name}
            className="absolute"
            style={{
              left: "50%",
              top: "50%",
              transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y + floatY}px)) scale(${scale})`,
              zIndex,
              transition: "filter 0.3s",
              filter: `brightness(${brightness})`,
            }}
          >
            {/* Gold trail glow */}
            <div
              className="absolute rounded-full"
              style={{
                width: imgSize * 1.6,
                height: imgSize * 1.6,
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                background: `radial-gradient(circle, rgba(212,175,55,${0.15 + depth * 0.15}) 0%, transparent 70%)`,
                filter: "blur(8px)",
              }}
            />
            {/* Product image */}
            <img
              src={product.src}
              alt={product.name}
              className="relative rounded-full object-cover"
              style={{
                width: imgSize,
                height: imgSize,
                border: "2px solid rgba(212,175,55,0.5)",
                boxShadow: `0 0 ${12 + depth * 16}px rgba(212,175,55,${0.25 + depth * 0.2}), inset 0 0 20px rgba(0,0,0,0.3)`,
              }}
            />
            {/* Product name tooltip on hover - desktop only */}
            {!isMobile && (
              <div
                className="absolute left-1/2 -translate-x-1/2 -bottom-6 whitespace-nowrap text-xs text-primary/70 font-body opacity-0 hover:opacity-100 transition-opacity pointer-events-none"
                style={{ zIndex: 30 }}
              >
                {product.name}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default HeroOrbitCSS;
