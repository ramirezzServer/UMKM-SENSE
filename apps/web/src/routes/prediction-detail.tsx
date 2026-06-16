import { useNavigate, useParams } from 'react-router';
import { motion } from 'framer-motion';
import { usePredictionDetail } from '@/features/predictions/hooks';
import PredictionResult from '@/features/analytics/PredictionResult';

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-3 w-20 rounded bg-gray-200" />
          <div className="h-4 w-48 rounded bg-gray-200" />
        </div>
        <div className="h-7 w-28 rounded-lg bg-gray-200" />
      </div>
      <div className="flex gap-5 border-b border-gray-200 pb-3">
        {[80, 60, 100].map((w) => (
          <div key={w} className={`h-4 w-${w} rounded bg-gray-200`} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-200 p-4 space-y-2">
            <div className="h-3 w-24 rounded bg-gray-200" />
            <div className="h-6 w-32 rounded bg-gray-200" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PredictionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const predictionId = id ? parseInt(id, 10) : null;

  const { data, isLoading, isError, error } = usePredictionDetail(predictionId);

  const goBack = () => void navigate('/predictions');

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
          aria-busy="true"
          aria-label="Memuat detail prediksi"
        >
          <DetailSkeleton />
        </motion.div>
      </div>
    );
  }

  if (isError || !data) {
    const msg =
      (error as { response?: { data?: { error?: string } } })?.response?.data?.error ??
      'Prediksi tidak ditemukan atau belum selesai diproses.';

    return (
      <div className="mx-auto max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center gap-4 py-16 text-center"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <svg
              className="h-7 w-7 text-red-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="space-y-1">
            <p className="text-base font-semibold text-gray-800">Tidak dapat memuat prediksi</p>
            <p className="max-w-xs text-sm text-gray-500">{msg}</p>
          </div>
          <button
            type="button"
            onClick={goBack}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            ← Kembali ke Riwayat
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Back breadcrumb */}
      <motion.button
        type="button"
        onClick={goBack}
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25 }}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded"
        aria-label="Kembali ke Riwayat Prediksi"
      >
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Riwayat Prediksi
      </motion.button>

      {/* Product context */}
      {data.product_name && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          className="text-xs font-medium text-gray-500"
        >
          Produk: <span className="font-semibold text-gray-800">{data.product_name}</span>
        </motion.p>
      )}

      {/* Result card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <PredictionResult prediction={data} onReset={goBack} resetLabel="← Riwayat" />
      </div>
    </div>
  );
}
