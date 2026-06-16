import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { usePredictionHistory } from '@/features/predictions/hooks';
import type { PredictionHistorySummary } from '@/features/predictions/types';

// ─── Formatters ───────────────────────────────────────────────────────────────

const methodLabel: Record<string, string> = {
  arima: 'ARIMA',
  prophet: 'Prophet',
  wma: 'Rata-rata Bergerak',
};

function fmtDateRange(start: string, end: string) {
  const s = new Date(start + 'T00:00:00').toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
  });
  const e = new Date(end + 'T00:00:00').toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return `${s} – ${e}`;
}

function fmtCreatedAt(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ─── MAPE badge ───────────────────────────────────────────────────────────────

function MapeBadge({ mape }: { mape: number | null }) {
  if (mape === null) return null;
  const { cls, label } =
    mape < 15
      ? { cls: 'bg-emerald-100 text-emerald-700', label: `${mape.toFixed(1)}% Baik` }
      : mape < 30
        ? { cls: 'bg-amber-100 text-amber-700', label: `${mape.toFixed(1)}% Cukup` }
        : { cls: 'bg-red-100 text-red-700', label: `${mape.toFixed(1)}% Perhatian` };
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${cls}`}>
      MAPE {label}
    </span>
  );
}

// ─── Status badge (non-done only) ────────────────────────────────────────────

function StatusBadge({ status }: { status: PredictionHistorySummary['status'] }) {
  if (status === 'done') return null;
  const map = {
    pending: 'bg-gray-100 text-gray-600',
    processing: 'bg-blue-100 text-blue-700',
    failed: 'bg-red-100 text-red-700',
  };
  const labels = { pending: 'Menunggu', processing: 'Memproses', failed: 'Gagal' };
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${map[status]}`}
    >
      {labels[status]}
    </span>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2 flex-1">
          <div className="h-4 w-40 rounded bg-gray-200" />
          <div className="h-3 w-56 rounded bg-gray-200" />
        </div>
        <div className="h-5 w-16 rounded-full bg-gray-200" />
      </div>
      <div className="mt-4 flex items-center gap-2">
        <div className="h-4 w-20 rounded-full bg-gray-200" />
        <div className="h-4 w-24 rounded-full bg-gray-200" />
      </div>
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
      className="flex flex-col items-center gap-4 py-16 text-center"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50">
        <svg
          className="h-7 w-7 text-indigo-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <div className="space-y-1">
        <p className="text-base font-semibold text-gray-800">Belum ada prediksi</p>
        <p className="max-w-xs text-sm text-gray-500">
          Buat analisis prediksi pertama Anda untuk memulai.
        </p>
      </div>
      <button
        type="button"
        onClick={onNavigate}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
      >
        Buat Analisis Pertama →
      </button>
    </motion.div>
  );
}

// ─── Prediction card ──────────────────────────────────────────────────────────

function PredictionCard({
  item,
  index,
  onClick,
}: {
  item: PredictionHistorySummary;
  index: number;
  onClick: () => void;
}) {
  const isDone = item.status === 'done';

  return (
    <motion.button
      type="button"
      onClick={isDone ? onClick : undefined}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={[
        'w-full rounded-xl border border-gray-200 bg-white p-5 shadow-sm text-left',
        'transition-all',
        isDone
          ? 'hover:border-indigo-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 group cursor-pointer'
          : 'cursor-default opacity-75',
      ].join(' ')}
      aria-label={
        isDone
          ? `Lihat hasil prediksi ${item.product_name} ${fmtDateRange(item.prediction_start, item.prediction_end)}`
          : undefined
      }
      disabled={!isDone}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: product + dates */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-gray-900 truncate">{item.product_name}</p>
            <StatusBadge status={item.status} />
          </div>
          <p className="mt-0.5 text-xs text-gray-500">
            {fmtDateRange(item.prediction_start, item.prediction_end)}
          </p>
        </div>

        {/* Right: chevron (done only) */}
        {isDone && (
          <svg
            className="h-4 w-4 flex-shrink-0 text-gray-300 transition-colors group-hover:text-indigo-400 mt-0.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        )}
      </div>

      {/* Badges row */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {item.forecast_method && (
          <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
            {methodLabel[item.forecast_method] ?? item.forecast_method}
          </span>
        )}
        <MapeBadge mape={item.mape} />
        {item.growth_pct !== null && (
          <span
            className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              item.growth_pct >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
            }`}
          >
            {item.growth_pct >= 0 ? '+' : ''}
            {item.growth_pct.toFixed(1)}% tren
          </span>
        )}
        <span className="ml-auto text-[10px] text-gray-400">{fmtCreatedAt(item.created_at)}</span>
      </div>
    </motion.button>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({
  currentPage,
  lastPage,
  onPage,
}: {
  currentPage: number;
  lastPage: number;
  onPage: (page: number) => void;
}) {
  if (lastPage <= 1) return null;

  return (
    <div
      className="flex items-center justify-center gap-3"
      role="navigation"
      aria-label="Pagination"
    >
      <button
        type="button"
        onClick={() => onPage(currentPage - 1)}
        disabled={currentPage === 1}
        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        aria-label="Halaman sebelumnya"
      >
        ← Sebelumnya
      </button>
      <span className="text-xs text-gray-500">
        Halaman {currentPage} dari {lastPage}
      </span>
      <button
        type="button"
        onClick={() => onPage(currentPage + 1)}
        disabled={currentPage === lastPage}
        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        aria-label="Halaman berikutnya"
      >
        Berikutnya →
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PredictionsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = usePredictionHistory(page);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="flex items-center gap-3"
      >
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-50">
          <svg
            className="h-5 w-5 text-indigo-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Riwayat Prediksi</h1>
          <p className="text-sm text-gray-500">Analisis yang pernah dibuat untuk produk Anda</p>
        </div>
      </motion.div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3" aria-busy="true" aria-label="Memuat riwayat prediksi">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-sm text-red-600">
          Gagal memuat riwayat prediksi. Coba muat ulang halaman.
        </div>
      ) : !data || data.data.length === 0 ? (
        <EmptyState onNavigate={() => void navigate('/analytics')} />
      ) : (
        <>
          <ol className="space-y-3" aria-label="Daftar riwayat prediksi">
            {data.data.map((item, i) => (
              <li key={item.id}>
                <PredictionCard
                  item={item}
                  index={i}
                  onClick={() => void navigate(`/predictions/${item.id}`)}
                />
              </li>
            ))}
          </ol>

          <Pagination
            currentPage={data.meta.current_page}
            lastPage={data.meta.last_page}
            onPage={setPage}
          />

          <p className="text-center text-xs text-gray-400">{data.meta.total} prediksi tersimpan</p>
        </>
      )}
    </div>
  );
}
