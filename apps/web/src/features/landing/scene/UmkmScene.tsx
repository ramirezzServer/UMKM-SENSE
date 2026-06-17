import { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';

// ─── Geometry primitives ──────────────────────────────────────────────────────

function Coin({
  position,
  rotation,
  scale = 1,
  color = '#F59E0B',
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  color?: string;
}) {
  return (
    <mesh position={position} rotation={rotation ?? [Math.PI / 2, 0, 0.3]} scale={scale}>
      <cylinderGeometry args={[0.75, 0.75, 0.12, 48]} />
      <meshStandardMaterial color={color} metalness={0.7} roughness={0.2} />
    </mesh>
  );
}

function BarChart({ position }: { position: [number, number, number] }) {
  const bars: Array<{ h: number; color: string; x: number }> = [
    { h: 0.55, color: '#D97706', x: -0.33 },
    { h: 1.0, color: '#0D9488', x: 0 },
    { h: 0.75, color: '#6366F1', x: 0.33 },
  ];
  return (
    <group position={position}>
      {bars.map((bar, i) => (
        <mesh key={i} position={[bar.x, bar.h / 2 - 0.5, 0]}>
          <boxGeometry args={[0.26, bar.h, 0.26]} />
          <meshStandardMaterial color={bar.color} metalness={0.05} roughness={0.55} />
        </mesh>
      ))}
    </group>
  );
}

function PackageBox({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Body */}
      <mesh>
        <boxGeometry args={[0.9, 0.85, 0.9]} />
        <meshStandardMaterial color="#0D9488" metalness={0.0} roughness={0.65} />
      </mesh>
      {/* Lid */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[0.96, 0.14, 0.96]} />
        <meshStandardMaterial color="#14B8A6" metalness={0.0} roughness={0.6} />
      </mesh>
    </group>
  );
}

function Ring({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position} rotation={[Math.PI / 4, 0, Math.PI / 6]}>
      <torusGeometry args={[0.58, 0.14, 20, 60]} />
      <meshStandardMaterial color="#6366F1" metalness={0.25} roughness={0.4} />
    </mesh>
  );
}

// ─── Scene group with mouse-driven parallax ───────────────────────────────────

function SceneObjects({
  mouseX,
  mouseY,
}: {
  mouseX: React.MutableRefObject<number>;
  mouseY: React.MutableRefObject<number>;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const groupRef = useRef<any>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    const ry = mouseX.current * 0.35;
    const rx = -mouseY.current * 0.2;
    groupRef.current.rotation.y += (ry - groupRef.current.rotation.y) * 0.04;
    groupRef.current.rotation.x += (rx - groupRef.current.rotation.x) * 0.04;
  });

  return (
    <group ref={groupRef}>
      {/* Coin 1 — top-left, large */}
      <Float speed={1.4} floatIntensity={0.55} rotationIntensity={0.3}>
        <Coin position={[-1.8, 1.3, 0]} />
      </Float>

      {/* Coin 2 — bottom-right, tilted */}
      <Float speed={1.85} floatIntensity={0.4} rotationIntensity={0.55}>
        <Coin
          position={[2.1, -1.1, -0.4]}
          rotation={[Math.PI / 3, 0.4, 0.6]}
          scale={0.65}
          color="#FCD34D"
        />
      </Float>

      {/* Bar chart — right-center */}
      <Float speed={1.25} floatIntensity={0.35} rotationIntensity={0.2}>
        <BarChart position={[1.9, 0.3, 0.2]} />
      </Float>

      {/* Package — bottom-left */}
      <Float speed={1.6} floatIntensity={0.45} rotationIntensity={0.4}>
        <PackageBox position={[-1.9, -1.1, 0.1]} />
      </Float>

      {/* Ring — near-center */}
      <Float speed={2.1} floatIntensity={0.28} rotationIntensity={0.65}>
        <Ring position={[0, 0.2, 0.6]} />
      </Float>
    </group>
  );
}

// ─── Exported canvas (lazy-loaded) ───────────────────────────────────────────

export default function UmkmScene() {
  const mouseX = useRef<number>(0);
  const mouseY = useRef<number>(0);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseX.current = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY.current = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <Canvas
      camera={{ position: [0, 0, 8.5], fov: 44 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent' }}
      aria-hidden="true"
    >
      {/* Lighting: warm ambient + cool rim */}
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 10, 6]} intensity={0.9} color="#FFFBF0" castShadow={false} />
      <pointLight position={[-5, 3, 4]} intensity={2.2} color="#F59E0B" distance={14} decay={2} />
      <pointLight position={[5, -3, 4]} intensity={1.8} color="#0D9488" distance={14} decay={2} />
      <pointLight position={[0, -5, 2]} intensity={0.6} color="#6366F1" distance={10} decay={2} />

      <SceneObjects mouseX={mouseX} mouseY={mouseY} />
    </Canvas>
  );
}
