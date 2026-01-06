import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface TerpeneRadarProps {
  terpenes: {
    boise: number;
    fruite: number;
    epice: number;
    terreux: number;
  };
  size?: number;
}

const TerpeneRadar = ({ terpenes, size = 200 }: TerpeneRadarProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const labels = [
    { key: "boise", label: "Boisé", angle: -90 },
    { key: "fruite", label: "Fruité", angle: 0 },
    { key: "terreux", label: "Terreux", angle: 90 },
    { key: "epice", label: "Épicé", angle: 180 },
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const centerX = size / 2;
    const centerY = size / 2;
    const maxRadius = size / 2 - 30;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Draw concentric circles (grid)
    ctx.strokeStyle = "hsl(43 20% 20%)";
    ctx.lineWidth = 1;
    for (let i = 1; i <= 4; i++) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, (maxRadius / 4) * i, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = "hsl(43 20% 25%)";
    labels.forEach(({ angle }) => {
      const rad = (angle * Math.PI) / 180;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + Math.cos(rad) * maxRadius,
        centerY + Math.sin(rad) * maxRadius
      );
      ctx.stroke();
    });

    // Draw data polygon
    const values = labels.map(({ key }) => terpenes[key as keyof typeof terpenes] / 100);
    
    // Gradient fill
    const gradient = ctx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      maxRadius
    );
    gradient.addColorStop(0, "hsla(43, 70%, 55%, 0.4)");
    gradient.addColorStop(1, "hsla(43, 70%, 55%, 0.1)");

    ctx.beginPath();
    values.forEach((value, i) => {
      const angle = (labels[i].angle * Math.PI) / 180;
      const x = centerX + Math.cos(angle) * maxRadius * value;
      const y = centerY + Math.sin(angle) * maxRadius * value;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw data polygon stroke
    ctx.strokeStyle = "hsl(43 70% 55%)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw data points
    values.forEach((value, i) => {
      const angle = (labels[i].angle * Math.PI) / 180;
      const x = centerX + Math.cos(angle) * maxRadius * value;
      const y = centerY + Math.sin(angle) * maxRadius * value;

      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = "hsl(43 70% 55%)";
      ctx.fill();
      ctx.strokeStyle = "hsl(0 0% 4%)";
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }, [terpenes, size]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="relative"
      style={{ width: size, height: size }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
        className="block"
      />
      {/* Labels */}
      {labels.map(({ key, label, angle }) => {
        const rad = (angle * Math.PI) / 180;
        const labelRadius = size / 2 - 8;
        const x = size / 2 + Math.cos(rad) * labelRadius;
        const y = size / 2 + Math.sin(rad) * labelRadius;
        const value = terpenes[key as keyof typeof terpenes];

        return (
          <div
            key={key}
            className="absolute text-center"
            style={{
              left: x,
              top: y,
              transform: "translate(-50%, -50%)",
            }}
          >
            <span className="text-xs font-medium text-primary block">
              {label}
            </span>
            <span className="text-xs text-muted-foreground">{value}%</span>
          </div>
        );
      })}
    </motion.div>
  );
};

export default TerpeneRadar;
