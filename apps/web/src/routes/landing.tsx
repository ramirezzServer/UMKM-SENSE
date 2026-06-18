import { lazy, Suspense, useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Sparkles,
  BarChart3,
  CloudSun,
  Package,
  Upload,
  Lightbulb,
  DatabaseZap,
  BrainCircuit,
  TrendingUp,
  ShieldCheck,
  Wifi,
  Zap,
  FlaskConical,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import ThreeErrorBoundary from '@/features/landing/scene/ThreeErrorBoundary';
import SceneFallback from '@/features/landing/scene/SceneFallback';
import { useAuth } from '@/features/auth/hooks';

// Lazy-load heavy 3D bundle
const UmkmScene = lazy(() => import('@/features/landing/scene/UmkmScene'));

// ─── WebGL detection ──────────────────────────────────────────────────────────

function canUseWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') ?? c.getContext('webgl'));
  } catch {
    return false;
  }
}

// ─── Animation helpers ────────────────────────────────────────────────────────

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
};

// ─── UMKM story background ───────────────────────────────────────────────────

// Deterministic coin positions — golden-angle spiral, no Math.random at module scope
const COIN_DATA = Array.from({ length: 20 }, (_, i) => ({
  left: `${4 + ((i * 53 + i * i * 3) % 88)}%`,
  bottom: `${5 + ((i * 47) % 60)}%`,
  size: 5 + (i % 4) * 2, // 5 | 7 | 9 | 11 px cycling
  duration: `${9 + (i % 6) * 1.5}s`, // 9 → 18.5 s
  delay: `-${(i * 0.83) % 7}s`, // negative = already mid-flight on load
}));

// City silhouette path — Indonesian UMKM skyline (warung / toko / ruko / tenda)
// ViewBox 0 0 1440 160, ground at y=160
const SILHOUETTE_PATH =
  'M0,160 L0,118 L50,118 L50,100 L90,100 L90,78 L115,78 L120,65 L125,52 L130,65 ' +
  'L130,78 L160,78 L160,95 L195,95 L195,58 L240,58 L240,70 L255,58 L268,44 L282,58 ' +
  'L282,82 L312,82 L312,52 L358,52 L358,70 L375,58 L388,45 L402,58 L402,80 L430,80 ' +
  'L430,62 L472,62 L472,88 L502,88 L502,70 L516,55 L530,70 L530,65 L575,65 L575,88 ' +
  'L612,88 L612,42 L670,42 L670,65 L695,52 L710,38 L725,52 L725,72 L758,72 L758,50 ' +
  'L805,50 L805,75 L822,62 L836,48 L850,62 L850,70 L882,70 L882,55 L928,55 L928,88 ' +
  'L958,88 L958,72 L972,58 L986,72 L986,80 L1018,80 L1018,58 L1062,58 L1062,90 ' +
  'L1090,90 L1090,68 L1104,54 L1118,68 L1118,78 L1152,78 L1152,55 L1195,55 L1195,88 ' +
  'L1222,88 L1222,65 L1237,50 L1252,65 L1252,80 L1285,80 L1285,55 L1328,55 L1328,98 ' +
  'L1362,98 L1362,118 L1440,118 L1440,160 Z';

function LandingBackground() {
  const silhouetteRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();

  // Parallax: silhouette scrolls slower than content → appears "further away"
  useEffect(() => {
    if (prefersReduced) return;
    const el = silhouetteRef.current;
    if (!el) return;
    const onScroll = () => {
      el.style.transform = `translateY(${window.scrollY * -0.12}px)`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (el) el.style.transform = '';
    };
  }, [prefersReduced]);

  // Halve coin count on mobile for performance
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const coins = isMobile ? COIN_DATA.slice(0, 10) : COIN_DATA;

  // Per-coin position CSS is injected as a <style> block to avoid inline-style
  // attributes (which the project linter forbids). Positions are truly data-driven
  // and cannot be expressed as static Tailwind classes.
  const coinStyles = coins
    .map(
      (c, i) =>
        `.lc-${i}{left:${c.left};bottom:${c.bottom};width:${c.size}px;` +
        `height:${c.size}px;animation-duration:${c.duration};animation-delay:${c.delay}}`
    )
    .join('');

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Layer 1 — full-page story gradient (dawn → night) */}
      <div className="absolute inset-0 landing-story-gradient" />

      {/* Layer 2 — growing trend lines: simbol prediksi naik */}
      <svg
        className="absolute inset-0 w-full h-full landing-trend-svg"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {/* Primary teal trend line */}
        <path
          d="M -5,86 C 18,78 40,60 62,51 S 90,33 106,24"
          pathLength="200"
          stroke="#0D9488"
          strokeWidth="0.38"
          fill="none"
          strokeDasharray="200"
          className="landing-trend-line landing-trend-teal"
        />
        {/* Secondary amber trend line */}
        <path
          d="M -5,78 C 14,71 38,56 63,47 S 91,28 106,17"
          pathLength="200"
          stroke="#F59E0B"
          strokeWidth="0.26"
          fill="none"
          strokeDasharray="200"
          className="landing-trend-line landing-trend-amber"
        />
      </svg>

      {/* Layer 3 — floating coin / Rupiah particles (simbol omzet naik) */}
      {!prefersReduced && (
        <>
          <style>{coinStyles}</style>
          {coins.map((_, i) => (
            <span key={i} className={`landing-coin lc-${i}`} />
          ))}
        </>
      )}

      {/* Layer 4 — city silhouette at bottom (parallax scroll) */}
      <div
        ref={silhouetteRef}
        className={`absolute bottom-0 left-0 right-0${prefersReduced ? '' : ' will-change-transform'}`}
      >
        <svg
          viewBox="0 0 1440 160"
          preserveAspectRatio="xMidYMax slice"
          className="w-full landing-silhouette-svg"
        >
          <defs>
            {/* Fade from very subtle at skyline top → more present at ground */}
            <linearGradient id="silGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3D1C0A" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#3D1C0A" stopOpacity="0.38" />
            </linearGradient>
          </defs>
          <path d={SILHOUETTE_PATH} fill="url(#silGrad)" />
        </svg>
      </div>
    </div>
  );
}

// ─── Nav ─────────────────────────────────────────────────────────────────────

function LandingNav() {
  const { data: user } = useAuth();

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-warm-200/60 bg-warm-50/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 md:px-10">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 rounded-lg"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-accent-600 shadow-warm-sm">
            <span className="text-xs font-bold text-white">U</span>
          </div>
          <span className="font-display font-semibold text-warm-900">UMKM-Sense</span>
        </Link>

        {/* Right side */}
        <nav className="flex items-center gap-3" aria-label="Navigasi utama">
          {user ? (
            <Link
              to="/dashboard"
              className="flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-warm-sm hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 transition-colors"
            >
              Buka Dashboard
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-xl px-4 py-2 text-sm font-semibold text-warm-700 hover:bg-warm-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 transition-colors"
              >
                Masuk
              </Link>
              <Link
                to="/register"
                className="flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-warm-sm hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 transition-colors"
              >
                Daftar Gratis
                <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function HeroSection() {
  const prefersReduced = useReducedMotion();
  const webglAvailable = useRef(canUseWebGL());

  const show3D = webglAvailable.current && !prefersReduced;

  return (
    <section className="relative isolate min-h-screen overflow-hidden pt-16">
      {/* Warm ambient background */}
      <div className="absolute inset-0 -z-10 landing-hero-bg" aria-hidden="true" />

      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-6 py-20 md:px-10 lg:grid-cols-[5fr_6fr] lg:py-28">
        {/* Text side */}
        <div>
          {/* Label pill */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: EASE }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-4 py-1.5"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary-500" />
            <span className="text-xs font-semibold text-primary-700">PKM-KC · UMKM Indonesia</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            className="font-display text-4xl font-bold leading-tight tracking-tight text-warm-900 sm:text-5xl lg:text-6xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: EASE, delay: 0.08 }}
          >
            Prediksi Penjualan <span className="text-gradient-warm">UMKM</span>
            <br />
            Berbasis AI &amp; Data Lokal
          </motion.h1>

          {/* Sub */}
          <motion.p
            className="mt-5 max-w-lg text-base leading-relaxed text-warm-600 sm:text-lg"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE, delay: 0.16 }}
          >
            Optimalkan stok dan strategi bisnis dengan prediksi akurat yang mempertimbangkan cuaca
            BMKG, hari libur nasional, dan tren penjualan historis Anda.
          </motion.p>

          {/* CTAs */}
          <motion.div
            className="mt-8"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: EASE, delay: 0.26 }}
          >
            {/* In-page navigation only — conversion happens via the sticky nav */}
            <a
              href="#fitur"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('fitur')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-warm-300 bg-white/70 px-6 py-3 text-sm font-semibold text-warm-700 shadow-warm-sm hover:bg-warm-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 transition-colors"
            >
              Lihat Fitur
              <ChevronRight className="h-4 w-4" />
            </a>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.38 }}
          >
            {[
              { icon: ShieldCheck, label: '228 test otomatis' },
              { icon: Wifi, label: 'Tanpa API eksternal' },
              { icon: Zap, label: 'Ringan & cepat' },
            ].map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-1.5 text-xs text-warm-500">
                <Icon className="h-3.5 w-3.5 text-primary-400" aria-hidden="true" />
                {label}
              </span>
            ))}
          </motion.div>
        </div>

        {/* 3D / fallback side */}
        <motion.div
          className="relative hidden md:block h-[400px] lg:h-[640px]"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.2 }}
          aria-hidden="true"
        >
          {show3D ? (
            <ThreeErrorBoundary fallback={<SceneFallback />}>
              <Suspense fallback={<SceneFallback />}>
                <UmkmScene />
              </Suspense>
            </ThreeErrorBoundary>
          ) : (
            <SceneFallback />
          )}
        </motion.div>
      </div>

      {/* Scroll hint */}
      <motion.div
        className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.4 }}
        aria-hidden="true"
      >
        <span className="text-[10px] font-medium uppercase tracking-widest text-warm-400">
          Scroll
        </span>
        <motion.div
          className="h-5 w-[1px] bg-warm-300"
          animate={{ scaleY: [1, 0.3, 1] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: BrainCircuit,
    color: 'text-primary-500',
    bg: 'bg-primary-50',
    title: 'Prediksi AI Prophet & ARIMA',
    desc: 'Model statistik Prophet dan ARIMA memberikan prediksi penjualan multi-hari dengan interval kepercayaan yang transparan.',
  },
  {
    icon: BarChart3,
    color: 'text-secondary-600',
    bg: 'bg-secondary-50',
    title: 'Dashboard Analitik Real-Time',
    desc: 'Pantau tren penjualan, produk terlaris, dan performa bisnis dalam satu tampilan visual yang ringkas.',
  },
  {
    icon: CloudSun,
    color: 'text-accent-500',
    bg: 'bg-accent-50',
    title: 'Faktor Cuaca & Hari Libur',
    desc: 'Data cuaca BMKG dan kalender libur nasional terintegrasi langsung untuk prediksi yang lebih akurat.',
  },
  {
    icon: Package,
    color: 'text-primary-600',
    bg: 'bg-primary-50',
    title: 'Manajemen Produk & Transaksi',
    desc: 'Catat dan kelola data penjualan harian per produk. Basis data historis yang kuat untuk model AI.',
  },
  {
    icon: Upload,
    color: 'text-secondary-600',
    bg: 'bg-secondary-50',
    title: 'Import Data CSV / Excel',
    desc: 'Migrasikan data historis penjualan dari spreadsheet Excel atau CSV dalam hitungan detik.',
  },
  {
    icon: Lightbulb,
    color: 'text-accent-600',
    bg: 'bg-accent-50',
    title: 'Rekomendasi Otomatis',
    desc: 'Dapatkan saran stok dan strategi promosi otomatis berdasarkan pola penjualan dan prediksi ke depan.',
  },
] as const;

function FeaturesSection() {
  return (
    <section className="py-24" id="fitur">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        {/* Header */}
        <motion.div
          className="mb-14 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={staggerContainer}
        >
          <motion.p
            variants={staggerItem}
            className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary-500"
          >
            Fitur Unggulan
          </motion.p>
          <motion.h2
            variants={staggerItem}
            className="font-display text-3xl font-bold text-warm-900 sm:text-4xl"
          >
            Semua yang Dibutuhkan UMKM
          </motion.h2>
          <motion.p
            variants={staggerItem}
            className="mx-auto mt-4 max-w-xl text-base text-warm-700"
          >
            Dari pencatatan sederhana hingga prediksi berbasis AI — dirancang khusus untuk ritme
            bisnis UMKM Indonesia.
          </motion.p>
        </motion.div>

        {/* Cards */}
        <motion.div
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={staggerContainer}
        >
          {FEATURES.map((f) => (
            <motion.div
              key={f.title}
              variants={staggerItem}
              whileHover={{ y: -4, boxShadow: '0 8px 24px rgb(20 10 0 / 0.08)' }}
              transition={{ duration: 0.2 }}
              className="group rounded-2xl border border-warm-100 bg-warm-50 p-6 shadow-card"
            >
              <div
                className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${f.bg}`}
              >
                <f.icon className={`h-5 w-5 ${f.color}`} aria-hidden="true" />
              </div>
              <h3 className="mb-2 font-display text-base font-bold text-warm-900">{f.title}</h3>
              <p className="text-sm leading-relaxed text-warm-600">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─── How it Works ─────────────────────────────────────────────────────────────

const STEPS = [
  {
    n: '01',
    icon: DatabaseZap,
    title: 'Catat atau Import Data',
    desc: 'Mulai dengan mencatat penjualan harian secara manual, atau impor langsung dari file Excel/CSV yang sudah Anda miliki.',
    color: 'text-primary-500',
    bg: 'bg-primary-100',
    border: 'border-primary-200',
  },
  {
    n: '02',
    icon: BrainCircuit,
    title: 'AI Menganalisis Pola',
    desc: 'Model Prophet dan ARIMA memproses data historis bersama faktor cuaca dan kalender libur nasional secara otomatis.',
    color: 'text-secondary-600',
    bg: 'bg-secondary-100',
    border: 'border-secondary-200',
  },
  {
    n: '03',
    icon: TrendingUp,
    title: 'Terima Prediksi & Rekomendasi',
    desc: 'Dapatkan prediksi penjualan 7 hari ke depan beserta rekomendasi stok dan strategi promosi yang actionable.',
    color: 'text-accent-600',
    bg: 'bg-accent-100',
    border: 'border-accent-200',
  },
] as const;

function HowItWorksSection() {
  return (
    <section className="py-24" id="cara-kerja">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        {/* Header */}
        <motion.div
          className="mb-16 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={staggerContainer}
        >
          <motion.p
            variants={staggerItem}
            className="mb-3 text-xs font-semibold uppercase tracking-widest text-secondary-600"
          >
            Cara Kerja
          </motion.p>
          <motion.h2
            variants={staggerItem}
            className="font-display text-3xl font-bold text-warm-900 sm:text-4xl"
          >
            Tiga Langkah Menuju Prediksi Akurat
          </motion.h2>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connector line (desktop) */}
          <div
            className="absolute left-0 right-0 top-14 hidden h-0.5 bg-gradient-to-r from-primary-200 via-secondary-200 to-accent-200 lg:block"
            aria-hidden="true"
          />

          <motion.div
            className="grid grid-cols-1 gap-10 lg:grid-cols-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={staggerContainer}
          >
            {STEPS.map((step) => (
              <motion.div
                key={step.n}
                variants={staggerItem}
                className="relative flex flex-col items-center text-center"
              >
                {/* Number circle */}
                <div
                  className={`relative mb-6 flex h-28 w-28 flex-shrink-0 flex-col items-center justify-center rounded-full border-2 ${step.border} ${step.bg} shadow-warm-md`}
                >
                  <step.icon className={`h-9 w-9 ${step.color}`} aria-hidden="true" />
                  <span
                    className={`absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-bold shadow-warm-sm ${step.color}`}
                  >
                    {step.n}
                  </span>
                </div>

                <h3 className="mb-3 font-display text-lg font-bold text-warm-900">{step.title}</h3>
                <p className="max-w-xs text-sm leading-relaxed text-warm-600">{step.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── Why UMKM-Sense ───────────────────────────────────────────────────────────

const WHY_ITEMS = [
  {
    icon: ShieldCheck,
    color: 'text-primary-500',
    bg: 'bg-primary-50',
    title: 'Transparan soal Akurasi',
    desc: 'Setiap prediksi disertai interval kepercayaan (confidence interval) agar Anda tahu seberapa yakin modelnya — tidak ada blackbox.',
  },
  {
    icon: Wifi,
    color: 'text-secondary-600',
    bg: 'bg-secondary-50',
    title: 'Andal Tanpa API Berbayar',
    desc: 'Tidak bergantung pada API cuaca eksternal yang bisa mati atau berbayar. Data cuaca di-seed lokal sebagai fallback yang selalu tersedia.',
  },
  {
    icon: Zap,
    color: 'text-accent-500',
    bg: 'bg-accent-50',
    title: 'Ringan & Responsif',
    desc: 'Dibangun dengan React 19 + Vite + PostgreSQL. Antarmuka cepat, prediksi diproses di background tanpa membekukan UI.',
  },
  {
    icon: FlaskConical,
    color: 'text-primary-600',
    bg: 'bg-primary-50',
    title: '228 Test Otomatis',
    desc: 'Codebase diverifikasi dengan ratusan test unit dan integrasi — termasuk edge case data kosong, koneksi mati, dan migrasi database.',
  },
] as const;

function WhySection() {
  return (
    <section className="py-24" id="mengapa">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <motion.div
          className="grid grid-cols-1 gap-14 lg:grid-cols-2 lg:items-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={staggerContainer}
        >
          {/* Left: text */}
          <div>
            <motion.p
              variants={staggerItem}
              className="mb-3 text-xs font-semibold uppercase tracking-widest text-accent-600"
            >
              Mengapa UMKM-Sense
            </motion.p>
            <motion.h2
              variants={staggerItem}
              className="font-display text-3xl font-bold text-warm-900 sm:text-4xl"
            >
              Dibangun untuk <span className="text-gradient-warm">Kepercayaan</span>
              ,<br />
              Bukan Sekadar Fitur
            </motion.h2>
            <motion.p
              variants={staggerItem}
              className="mt-5 max-w-md text-base leading-relaxed text-warm-700"
            >
              Banyak tools prediksi terasa seperti blackbox. UMKM-Sense dirancang agar pemilik UMKM
              bisa memahami dan mempercayai hasilnya — dengan konteks lokal Indonesia.
            </motion.p>

            <motion.div variants={staggerItem} className="mt-8">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-warm-md hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 transition-colors"
              >
                Mulai Sekarang <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </div>

          {/* Right: cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {WHY_ITEMS.map((item) => (
              <motion.div
                key={item.title}
                variants={staggerItem}
                className="rounded-2xl border border-warm-100 bg-warm-50 p-5 shadow-card"
              >
                <div
                  className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${item.bg}`}
                >
                  <item.icon className={`h-5 w-5 ${item.color}`} aria-hidden="true" />
                </div>
                <h3 className="mb-1.5 font-display text-sm font-bold text-warm-900">
                  {item.title}
                </h3>
                <p className="text-xs leading-relaxed text-warm-600">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── CTA ─────────────────────────────────────────────────────────────────────

function CtaSection() {
  const { data: user } = useAuth();

  return (
    <section className="relative isolate overflow-hidden py-28">
      {/* Dark warm gradient bg */}
      <div className="absolute inset-0 -z-10 landing-cta-bg" aria-hidden="true" />

      <motion.div
        className="mx-auto max-w-3xl px-6 text-center md:px-10"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        variants={staggerContainer}
      >
        <motion.p
          variants={staggerItem}
          className="mb-4 text-xs font-semibold uppercase tracking-widest text-primary-300"
        >
          {user ? 'Dashboard Anda Menunggu' : 'Mulai Hari Ini · Gratis'}
        </motion.p>
        <motion.h2
          variants={staggerItem}
          className="font-display text-3xl font-bold text-white sm:text-5xl"
        >
          Siap Tingkatkan <br className="hidden sm:block" />
          <span className="text-amber-300">Omzet UMKM</span> Anda?
        </motion.h2>
        <motion.p
          variants={staggerItem}
          className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-warm-400"
        >
          {user
            ? 'Data historis Anda sudah tersimpan dan siap dianalisis. Buka dashboard lewat tombol di kanan atas untuk melihat prediksi terbaru.'
            : 'Daftar gratis lewat tombol di pojok kanan atas — kurang dari satu menit, tanpa kartu kredit.'}
        </motion.p>
      </motion.div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function LandingFooter() {
  return (
    <footer className="border-t border-warm-200 bg-white py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-6 text-center md:px-10">
        <div className="flex items-center gap-2.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-primary-500 to-accent-600">
            <span className="text-[10px] font-bold text-white">U</span>
          </div>
          <span className="font-display text-sm font-semibold text-warm-900">UMKM-Sense</span>
        </div>
        <p className="text-xs text-warm-400">
          Platform Analitik &amp; Prediksi Penjualan untuk UMKM Indonesia
        </p>
        <p className="text-xs text-warm-400">PKM-KC · {new Date().getFullYear()}</p>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <LandingBackground />
      <LandingNav />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <WhySection />
        <CtaSection />
      </main>
      <LandingFooter />
    </div>
  );
}
