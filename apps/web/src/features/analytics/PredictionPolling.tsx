import { motion } from 'framer-motion';

// ─── Animated dots ────────────────────────────────────────────────────────────

function Dots() {
  return (
    <span className="inline-flex gap-1" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="inline-block h-1.5 w-1.5 rounded-full bg-indigo-500"
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
        />
      ))}
    </span>
  );
}

// ─── Skeleton rows ────────────────────────────────────────────────────────────

function SkeletonRow({ wide = false }: { wide?: boolean }) {
  return (
    <div className={`h-3 animate-pulse rounded-full bg-gray-200 ${wide ? 'w-3/4' : 'w-1/2'}`} />
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  status: 'pending' | 'processing';
}

const statusLabel: Record<Props['status'], string> = {
  pending: 'Permintaan antrean diterima',
  processing: 'Sedang menganalisis data penjualan',
};

export default function PredictionPolling({ status }: Props) {
  return (
    <motion.div
      key="polling"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex flex-col items-center gap-6 py-8 text-center"
      role="status"
      aria-live="polite"
    >
      {/* Icon pulse */}
      <div className="relative flex h-16 w-16 items-center justify-center">
        <motion.div
          className="absolute inset-0 rounded-full bg-indigo-100"
          animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
          <svg
            className="h-8 w-8 text-indigo-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
      </div>

      {/* Status text */}
      <div className="space-y-1">
        <p className="text-base font-semibold text-gray-800">
          Menganalisis data… <Dots />
        </p>
        <p className="text-sm text-gray-500">
          {statusLabel[status]} — ini mungkin perlu beberapa detik.
        </p>
        <p className="text-xs text-gray-400">
          Anda tetap bisa navigasi; hasil akan muncul saat selesai.
        </p>
      </div>

      {/* Skeleton preview */}
      <div className="w-full max-w-sm space-y-3 rounded-xl border border-gray-100 bg-gray-50 p-5">
        <SkeletonRow wide />
        <SkeletonRow />
        <SkeletonRow wide />
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-200" />
          ))}
        </div>
        <SkeletonRow />
        <SkeletonRow wide />
      </div>
    </motion.div>
  );
}
