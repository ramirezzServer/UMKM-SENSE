import { useRef } from 'react';
import { useNavigate } from 'react-router';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useTomorrowPrediction } from './hooks';

// ─── Formatters ───────────────────────────────────────────────────────────────

const rupiahFmt = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

// ─── Confidence config ────────────────────────────────────────────────────────

const LEVEL_BADGE: Record<'high' | 'medium' | 'low', { cls: string; label: string }> = {
  high: {
    cls: 'bg-success-100 text-success-700 ring-1 ring-inset ring-success-200',
    label: 'Keyakinan Tinggi',
  },
  medium: {
    cls: 'bg-primary-100 text-primary-700 ring-1 ring-inset ring-primary-200',
    label: 'Keyakinan Sedang',
  },
  low: {
    cls: 'bg-warm-100 text-warm-600 ring-1 ring-inset ring-warm-200',
    label: 'Keyakinan Rendah',
  },
};

const PRIORITY_ICON_COLOR: Record<'high' | 'medium' | 'low', string> = {
  high: 'text-danger-500',
  medium: 'text-primary-500',
  low: 'text-warm-400',
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="animate-pulse rounded-card glass-card p-6 shadow-card">
      <div className="flex items-center justify-between">
        <div className="h-3.5 w-36 rounded-full bg-warm-200" />
        <div className="h-5 w-5 rounded bg-warm-200" />
      </div>
      <div className="mt-4 h-8 w-48 rounded-lg bg-warm-200" />
      <div className="mt-2 h-3 w-28 rounded-full bg-warm-100" />
      <div className="mt-4 h-5 w-32 rounded-full bg-warm-200" />
      <div className="mt-3 h-12 rounded-xl bg-warm-100" />
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onNavigate }: { onNavigate: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-3 rounded-card border border-dashed border-accent-200 bg-accent-50/40 p-6"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-accent-100">
          <Sparkles className="h-5 w-5 text-accent-500" />
        </div>
        <p className="text-sm font-semibold text-warm-700">Prediksi Besok</p>
      </div>
      <p className="text-sm text-warm-500">
        Belum ada prediksi untuk besok. Jalankan analisis produk Anda untuk mendapatkan estimasi
        penjualan.
      </p>
      <button
        type="button"
        onClick={onNavigate}
        className="self-start rounded-full bg-accent-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-accent-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2"
      >
        Buat Analisis →
      </button>
    </motion.div>
  );
}

// ─── 3D Signature Card ────────────────────────────────────────────────────────
// This is the "signature" element: a gradient amber→indigo card with subtle
// mouse-tracked tilt + layered depth. Restraint: only this one card gets the 3D.

function PredictionCard({
  data,
  onNavigate,
}: {
  data: NonNullable<ReturnType<typeof useTomorrowPrediction>['data']>;
  onNavigate: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Gentle tilt: ±6 degrees max
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [5, -5]), {
    stiffness: 200,
    damping: 20,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-5, 5]), {
    stiffness: 200,
    damping: 20,
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const pct = Math.round(data.confidence * 100);
  const badge = LEVEL_BADGE[data.level];

  return (
    // Perspective wrapper — does not clip, just provides the 3D context
    <div className="[perspective:800px]">
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={onNavigate}
        role="button"
        tabIndex={0}
        aria-label="Lihat prediksi besok di halaman Analisis Cerdas"
        onKeyDown={(e) => e.key === 'Enter' && onNavigate()}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        className="relative cursor-pointer overflow-hidden rounded-card p-6 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {/* ── Background gradient — the "signature" depth layer ── */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700" />
        {/* Subtle light reflection — moves slightly with tilt */}
        <motion.div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            background:
              'radial-gradient(ellipse at 30% 30%, rgba(255,255,255,0.4), transparent 70%)',
          }}
        />
        {/* Soft inner glow at bottom */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-accent-900/30 to-transparent" />

        {/* ── Content — lifted with translateZ ── */}
        <div className="relative [transform:translateZ(12px)]">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary-200">
              Prediksi Besok
            </p>
            <ArrowRight className="h-4 w-4 text-primary-300 transition-transform group-hover:translate-x-0.5" />
          </div>

          {/* Revenue */}
          <p className="mt-3 font-display text-2xl font-bold tracking-tight text-white tabular-nums">
            {rupiahFmt.format(data.predicted_revenue)}
          </p>
          <p className="mt-0.5 text-xs text-primary-200">
            est. {data.predicted_qty.toLocaleString('id-ID')} unit terjual
          </p>

          {/* Confidence badge */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold leading-5 ${badge.cls}`}
            >
              {badge.label}
            </span>
            <span className="text-xs text-primary-300">
              {pct}% · MAPE {data.mape.toFixed(1)}%
            </span>
          </div>

          {/* Top recommendation */}
          {data.top_recommendation && (
            <div className="mt-4 flex items-start gap-1.5 rounded-xl border border-white/10 bg-white/10 px-3 py-2.5 backdrop-blur-sm">
              <Sparkles
                className={`mt-0.5 h-3.5 w-3.5 flex-shrink-0 ${PRIORITY_ICON_COLOR[data.top_recommendation.priority]}`}
              />
              <p className="text-xs leading-relaxed text-white/90">
                <span className="font-semibold text-white">{data.top_recommendation.title}</span>
              </p>
            </div>
          )}

          {/* CTA hint */}
          <p className="mt-3 text-[11px] text-primary-200/80">Lihat detail analisis lengkap →</p>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default function TomorrowPredictionCard() {
  const { data, isLoading, isError } = useTomorrowPrediction();
  const navigate = useNavigate();

  const goToAnalytics = () => void navigate('/analytics');

  if (isLoading) return <Skeleton />;

  if (isError || !data) {
    return (
      <div className="rounded-card border border-danger-100 bg-danger-50 p-6">
        <p className="text-sm text-danger-600">Gagal memuat prediksi besok.</p>
      </div>
    );
  }

  if (!data.has_prediction) {
    return <EmptyState onNavigate={goToAnalytics} />;
  }

  return <PredictionCard data={data} onNavigate={goToAnalytics} />;
}
