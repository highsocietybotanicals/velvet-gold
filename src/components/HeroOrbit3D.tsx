import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { Float, Sparkles, Billboard } from "@react-three/drei";
import { useRef, useMemo, Suspense } from "react";
import * as THREE from "three";
import { TextureLoader } from "three";

import amnesiaOniria from "@/assets/flowers/amnesia-oniria-real.jpg";
import platinumOg from "@/assets/flowers/platinum-og-real.jpg";
import mintKush from "@/assets/flowers/mint-kush-real.jpg";
import blueMango from "@/assets/flowers/blue-mango-real.jpg";
import og911 from "@/assets/flowers/911-og-real.jpg";
import iceOlator from "@/assets/resins/ice-o-lator-real.jpg";
import goldenCbn from "@/assets/resins/golden-cbn-real.jpg";

const productImages = [
  amnesiaOniria, platinumOg, mintKush, blueMango, og911, iceOlator, goldenCbn,
];

// A single orbiting product disc
function OrbitingProduct({
  textureSrc,
  index,
  total,
}: {
  textureSrc: string;
  index: number;
  total: number;
}) {
  const ref = useRef<THREE.Group>(null);
  const texture = useLoader(TextureLoader, textureSrc);
  const baseAngle = (index / total) * Math.PI * 2;
  const orbitSpeed = 0.15 + index * 0.01;
  const radiusXZ = 2.8;
  const radiusY = 0.6;
  const tilt = 0.3;

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime() * orbitSpeed + baseAngle;
    ref.current.position.x = Math.cos(t) * radiusXZ;
    ref.current.position.z = Math.sin(t) * radiusXZ * 0.6;
    ref.current.position.y = Math.sin(t * 0.7 + index) * radiusY + Math.sin(t) * tilt;
  });

  return (
    <group ref={ref}>
      <Float speed={2 + index * 0.3} rotationIntensity={0.2} floatIntensity={0.5}>
        <Billboard>
          {/* Gold glow behind */}
          <mesh position={[0, 0, -0.05]}>
            <planeGeometry args={[1.2, 1.2]} />
            <meshBasicMaterial color="#d4af37" transparent opacity={0.15} />
          </mesh>
          {/* Product circle */}
          <mesh>
            <circleGeometry args={[0.45, 64]} />
            <meshBasicMaterial map={texture} transparent />
          </mesh>
          {/* Gold ring border */}
          <mesh>
            <ringGeometry args={[0.44, 0.48, 64]} />
            <meshBasicMaterial color="#d4af37" transparent opacity={0.8} />
          </mesh>
        </Billboard>
      </Float>
      {/* Trail particles per product */}
      <Sparkles
        count={8}
        size={1.5}
        scale={1}
        speed={0.4}
        color="#d4af37"
        opacity={0.5}
      />
    </group>
  );
}

// Central glowing golden core
function GoldenCore() {
  const coreRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (coreRef.current) {
      const pulse = 1 + Math.sin(clock.getElapsedTime() * 1.5) * 0.08;
      coreRef.current.scale.setScalar(pulse);
    }
    if (glowRef.current) {
      const pulse = 1 + Math.sin(clock.getElapsedTime() * 0.8) * 0.15;
      glowRef.current.scale.setScalar(pulse);
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.12 + Math.sin(clock.getElapsedTime() * 1.2) * 0.05;
    }
  });

  return (
    <group>
      {/* Outer glow sphere */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1.6, 32, 32]} />
        <meshBasicMaterial color="#d4af37" transparent opacity={0.12} />
      </mesh>
      {/* Inner bright core */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.35, 32, 32]} />
        <meshBasicMaterial color="#f5d76e" transparent opacity={0.9} />
      </mesh>
      {/* Mid glow */}
      <mesh>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshBasicMaterial color="#d4af37" transparent opacity={0.25} />
      </mesh>
      {/* Point light from core */}
      <pointLight color="#d4af37" intensity={3} distance={8} decay={2} />
      <pointLight color="#f5d76e" intensity={1.5} distance={4} decay={2} />
    </group>
  );
}

// Main scene
function Scene() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.05;
    }
  });

  return (
    <>
      <ambientLight intensity={0.3} />

      {/* Slow global rotation */}
      <group ref={groupRef}>
        <GoldenCore />
        {productImages.map((src, i) => (
          <OrbitingProduct
            key={i}
            textureSrc={src}
            index={i}
            total={productImages.length}
          />
        ))}
      </group>

      {/* Global gold sparkles */}
      <Sparkles
        count={120}
        size={2}
        scale={8}
        speed={0.3}
        color="#d4af37"
        opacity={0.6}
      />
      <Sparkles
        count={60}
        size={3.5}
        scale={6}
        speed={0.15}
        color="#f5d76e"
        opacity={0.3}
      />
    </>
  );
}

const HeroOrbit3D = () => {
  return (
    <div className="w-[320px] h-[320px] md:w-[500px] md:h-[500px] mx-auto">
      <Canvas
        camera={{ position: [0, 1.5, 6], fov: 45 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: "transparent" }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default HeroOrbit3D;
