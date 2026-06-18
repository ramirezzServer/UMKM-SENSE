import { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Instances, Instance } from '@react-three/drei';

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
      <meshStandardMaterial color={color} metalness={0.85} roughness={0.15} />
    </mesh>
  );
}

function BarChart({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const bars: Array<{ h: number; color: string; x: number }> = [
    { h: 0.65, color: '#D97706', x: -0.38 },
    { h: 1.15, color: '#0D9488', x: 0 },
    { h: 0.88, color: '#6366F1', x: 0.38 },
  ];
  return (
    <group position={position} scale={scale}>
      {bars.map((bar, i) => (
        <mesh key={i} position={[bar.x, bar.h / 2 - 0.55, 0]}>
          <boxGeometry args={[0.28, bar.h, 0.28]} />
          <meshStandardMaterial color={bar.color} metalness={0.15} roughness={0.45} />
        </mesh>
      ))}
    </group>
  );
}

function PackageBox({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.9, 0.85, 0.9]} />
        <meshStandardMaterial color="#0D9488" metalness={0.05} roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[0.96, 0.14, 0.96]} />
        <meshStandardMaterial color="#14B8A6" metalness={0.05} roughness={0.5} />
      </mesh>
    </group>
  );
}

function Ring({
  position,
  scale = 1,
  color = '#6366F1',
  rotation,
}: {
  position: [number, number, number];
  scale?: number;
  color?: string;
  rotation?: [number, number, number];
}) {
  return (
    <mesh position={position} rotation={rotation ?? [Math.PI / 4, 0, Math.PI / 6]} scale={scale}>
      <torusGeometry args={[0.58, 0.14, 20, 60]} />
      <meshStandardMaterial color={color} metalness={0.35} roughness={0.35} />
    </mesh>
  );
}

// ─── Instanced background particles ──────────────────────────────────────────
// Deterministic positions (golden angle spiral) — no Math.random() at module scope

const PARTICLE_DATA: { pos: [number, number, number]; scale: number }[] = Array.from(
  { length: 26 },
  (_, i) => {
    const a = (i * 137.508 * Math.PI) / 180; // golden angle in radians
    const r = 2.2 + (i % 7) * 0.38;
    return {
      pos: [r * Math.cos(a) * 1.15, (((i * 31) % 40) - 20) * 0.14, -1.8 - (i % 5) * 0.52] as [
        number,
        number,
        number,
      ],
      scale: 0.042 + (i % 5) * 0.015,
    };
  }
);

function Particles() {
  return (
    <Instances limit={26} frustumCulled={false}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshStandardMaterial color="#F59E0B" metalness={0.65} roughness={0.25} />
      {PARTICLE_DATA.map((p, i) => (
        <Instance key={i} position={p.pos} scale={p.scale} />
      ))}
    </Instances>
  );
}

// ─── Scene with dual-layer parallax + auto-orbit ──────────────────────────────

function SceneObjects({
  mouseX,
  mouseY,
}: {
  mouseX: React.MutableRefObject<number>;
  mouseY: React.MutableRefObject<number>;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mainRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bgRef = useRef<any>(null);

  // Separate orbit accumulator and smoothed parallax for clean composition
  const orbitY = useRef(0);
  const smoothRy = useRef(0);
  const smoothRx = useRef(0);
  const bgSmoothRy = useRef(0);
  const bgSmoothRx = useRef(0);

  useFrame(() => {
    if (!mainRef.current || !bgRef.current) return;

    // Slow auto-orbit — one full rotation every ~3 minutes at 60fps
    orbitY.current += 0.00055;

    // Main group: strong parallax on top of orbit
    smoothRy.current += (mouseX.current * 0.55 - smoothRy.current) * 0.05;
    smoothRx.current += (-mouseY.current * 0.3 - smoothRx.current) * 0.05;
    mainRef.current.rotation.y = orbitY.current + smoothRy.current;
    mainRef.current.rotation.x = smoothRx.current;

    // Background group: weaker parallax (creates depth illusion)
    bgSmoothRy.current += (mouseX.current * 0.18 - bgSmoothRy.current) * 0.03;
    bgSmoothRx.current += (-mouseY.current * 0.1 - bgSmoothRx.current) * 0.03;
    bgRef.current.rotation.y = orbitY.current * 0.4 + bgSmoothRy.current;
    bgRef.current.rotation.x = bgSmoothRx.current;
  });

  return (
    <>
      {/* ── Foreground / mid group ───────────────────────────────────────── */}
      <group ref={mainRef}>
        {/* Large gold coin — top-left, prominent */}
        <Float speed={1.4} floatIntensity={0.6} rotationIntensity={0.25}>
          <Coin position={[-1.7, 1.5, 0.6]} scale={1.35} />
        </Float>

        {/* Coin — bottom-right, tilted, warm gold */}
        <Float speed={1.85} floatIntensity={0.45} rotationIntensity={0.55}>
          <Coin
            position={[2.2, -1.2, 0]}
            rotation={[Math.PI / 3, 0.4, 0.6]}
            scale={0.9}
            color="#FCD34D"
          />
        </Float>

        {/* Bar chart — right-center */}
        <Float speed={1.25} floatIntensity={0.38} rotationIntensity={0.18}>
          <BarChart position={[1.85, 0.5, 0.2]} scale={1.15} />
        </Float>

        {/* Package — bottom-left */}
        <Float speed={1.6} floatIntensity={0.5} rotationIntensity={0.4}>
          <PackageBox position={[-1.95, -1.3, 0.1]} />
        </Float>

        {/* Central ring — near foreground */}
        <Float speed={2.1} floatIntensity={0.3} rotationIntensity={0.65}>
          <Ring position={[0.1, 0.3, 0.7]} scale={1.2} />
        </Float>

        {/* Coin 3 — top-center, mid-depth */}
        <Float speed={1.55} floatIntensity={0.5} rotationIntensity={0.35}>
          <Coin
            position={[0.4, 2.45, -0.3]}
            rotation={[Math.PI / 5, 0.2, 0.8]}
            scale={0.72}
            color="#FCD34D"
          />
        </Float>
      </group>

      {/* ── Background / depth group — weaker parallax ──────────────────── */}
      <group ref={bgRef}>
        {/* Distant coin — upper-left far */}
        <Float speed={0.9} floatIntensity={0.28} rotationIntensity={0.2}>
          <Coin
            position={[-2.7, 0.7, -1.9]}
            rotation={[Math.PI / 4, 0, 1.1]}
            scale={0.5}
            color="#F59E0B"
          />
        </Float>

        {/* Distant bars — left-center background */}
        <Float speed={0.85} floatIntensity={0.25} rotationIntensity={0.14}>
          <BarChart position={[-1.1, 0.3, -1.6]} scale={0.72} />
        </Float>

        {/* Distant ring — upper-right, lighter indigo */}
        <Float speed={1.0} floatIntensity={0.3} rotationIntensity={0.18}>
          <Ring
            position={[2.9, 1.9, -1.7]}
            scale={0.62}
            color="#A5B4FC"
            rotation={[Math.PI / 3, 0.3, Math.PI / 4]}
          />
        </Float>

        {/* Golden particles atmosphere */}
        <Particles />
      </group>
    </>
  );
}

// ─── Canvas (lazy-loaded) ─────────────────────────────────────────────────────

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
      camera={{ position: [0, 0, 6.5], fov: 50 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      dpr={[1, 2]}
      style={{ background: 'transparent' }}
      aria-hidden="true"
    >
      {/* Lighting: warm key · teal fill · indigo rim · gold top */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 8, 5]} intensity={1.0} color="#FFF8E7" />
      <pointLight position={[-5, 4, 5]} intensity={3.5} color="#F59E0B" distance={16} decay={2} />
      <pointLight position={[5, -2, 4]} intensity={2.5} color="#0D9488" distance={15} decay={2} />
      <pointLight position={[0, -4, -2]} intensity={2.0} color="#6366F1" distance={12} decay={2} />
      <pointLight position={[0, 6, 2]} intensity={1.0} color="#FCD34D" distance={12} decay={2} />

      <SceneObjects mouseX={mouseX} mouseY={mouseY} />
    </Canvas>
  );
}
