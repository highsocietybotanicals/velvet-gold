import { ElementType, PointerEvent, useRef } from "react";
import { useReducedMotion } from "framer-motion";

interface Title3DProps {
  children: string;
  as?: "h1" | "h2";
  className?: string;
}

const Title3D = ({ children, as = "h2", className = "" }: Title3DProps) => {
  const Component = as as ElementType;
  const ref = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    if (reducedMotion || event.pointerType === "touch") return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    event.currentTarget.style.setProperty("--title-rx", `${(0.5 - y) * 18}deg`);
    event.currentTarget.style.setProperty("--title-ry", `${(x - 0.5) * 28}deg`);
    event.currentTarget.style.setProperty("--spec", `${x * 100}%`);
  };

  const resetTilt = (event: PointerEvent<HTMLElement>) => {
    event.currentTarget.style.setProperty("--title-rx", "0deg");
    event.currentTarget.style.setProperty("--title-ry", "0deg");
    event.currentTarget.style.setProperty("--spec", "50%");
  };

  return (
    <Component
      ref={ref}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetTilt}
      className={`title-3d font-display ${reducedMotion ? "title-3d-reduced" : ""} ${className}`}
    >
      <span className="relative inline-block [transform-style:preserve-3d]">
        {Array.from({ length: 10 }, (_, index) => (
          <span
            key={index}
            aria-hidden="true"
            className="absolute inset-0 text-gold-dark"
            style={{ transform: `translateZ(${-index * 1.2}px)`, opacity: 0.92 - index * 0.055 }}
          >
            {children}
          </span>
        ))}
        <span className="title-3d-face relative block">{children}</span>
      </span>
    </Component>
  );
};

export default Title3D;