import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { useTomorrowPrediction } from './hooks';

// ─── Formatters ───────────────────────────────────────────────────────────────

const rupiahFmt = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

// ─── Confidence level display ─────────────────────────────────────────────────

const levelStyle = {
  high: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100',
  medium: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-100',
  low: 'bg-red-50 text-red-600 ring-1 ring-inset ring-red-100',
};

const levelLabel = {
  high: 'Keyakinan Tinggi',
  medium: 'Keyakinan Sedang',
  low: 'Keyakinan Rendah',
};

const priorityColor = {
  high: 'text-red-600',
  medium: 'text-amber-600',
  low: 'text-gray-500',
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="h-3.5 w-36 rounded bg-gray-200" />
        <div className="h-5 w-5 rounded bg-gray-200" />
      </div>
      <div className="mt-4 h-8 w-48 rounded bg-gray-200" />
      <div className="mt-2 h-3 w-28 rounded bg-gray-200" />
      <div className="mt-4 h-4 w-full rounded bg-gray-200" />
      <div className="mt-2 h-4 w-3/4 rounded bg-gray-200" />
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
      className="flex flex-col gap-3 rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/40 p-6"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-100">
          <svg
            className="h-5 w-5 text-indigo-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-gray-700">Prediksi Besok</p>
      </div>
      <p className="text-sm text-gray-500">
        Belum ada prediksi untuk besok. Jalankan analisis produk Anda untuk mendapatkan estimasi
        penjualan.
      </p>
      <button
        type="button"
        onClick={onNavigate}
        className="self-start rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
      >
        Buat Analisis →
      </button>
    </motion.div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

export default function TomorrowPredictionCard() {
  const { data, isLoading, isError } = useTomorrowPrediction();
  const navigate = useNavigate();

  const goToAnalytics = () => void navigate('/analytics');

  if (isLoading) return <Skeleton />;

  if (isError || !data) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-6">
        <p className="text-sm text-red-600">Gagal memuat prediksi besok.</p>
      </div>
    );
  }

  if (!data.has_prediction) {
    return <EmptyState onNavigate={goToAnalytics} />;
  }

  const pct = Math.round(data.confidence * 100);

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      onClick={goToAnalytics}
      className="w-full rounded-2xl border border-gray-200 bg-white p-6 shadow-sm text-left hover:border-indigo-200 hover:shadow-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 group"
      aria-label="Lihat prediksi besok di halaman Analisis Cerdas"
    >
      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Prediksi Besok</p>
        <svg
          className="h-4 w-4 text-gray-300 transition-colors group-hover:text-indigo-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>

      {/* Revenue */}
      <p className="mt-3 text-2xl font-bold text-gray-900 tabular-nums">
        {rupiahFmt.format(data.predicted_revenue)}
      </p>
      <p className="mt-0.5 text-xs text-gray-500">
        est. {data.predicted_qty.toLocaleString('id-ID')} unit terjual
      </p>

      {/* Confidence badge */}
      <div className="mt-3 flex items-center gap-2">
        <span
          className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold leading-5 ${levelStyle[data.level]}`}
        >
          {levelLabel[data.level]}
        </span>
        <span className="text-xs text-gray-400">
          {pct}% keyakinan · MAPE {data.mape.toFixed(1)}%
        </span>
      </div>

      {/* Top recommendation */}
      {data.top_recommendation && (
        <div className="mt-4 flex items-start gap-1.5 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5">
          <svg
            className={`mt-0.5 h-3.5 w-3.5 flex-shrink-0 ${priorityColor[data.top_recommendation.priority]}`}
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813A3.75 3.75 0 007.466 7.89l.813-2.846A.75.75 0 019 4.5z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-xs text-gray-600 leading-relaxed">
            <span className="font-medium text-gray-800">{data.top_recommendation.title}</span>
          </p>
        </div>
      )}

      {/* CTA hint */}
      <p className="mt-3 text-[11px] text-indigo-500 group-hover:text-indigo-600 transition-colors">
        Lihat detail analisis lengkap →
      </p>
    </motion.button>
  );
}
