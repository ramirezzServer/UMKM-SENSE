import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useCreatePrediction, usePredictionStatus } from '@/features/analytics/hooks';
import PredictionForm from '@/features/analytics/PredictionForm';
import type { PredictionFormValues } from '@/features/analytics/PredictionForm';
import PredictionPolling from '@/features/analytics/PredictionPolling';
import PredictionResult from '@/features/analytics/PredictionResult';
import type { PredictionDetail } from '@/features/analytics/types';
import Button from '@/components/ui/Button';

// ─── Page-level state machine ─────────────────────────────────────────────────

type Phase =
  | { kind: 'idle' }
  | { kind: 'polling'; predictionId: number }
  | { kind: 'done'; result: PredictionDetail }
  | { kind: 'failed'; error: string | null };

// ─── Icon ─────────────────────────────────────────────────────────────────────

function IconSparkles() {
  return (
    <svg
      className="h-6 w-6 text-indigo-600"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
      />
    </svg>
  );
}

// ─── Failed state ─────────────────────────────────────────────────────────────

function FailedState({ error, onRetry }: { error: string | null; onRetry: () => void }) {
  return (
    <motion.div
      key="failed"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex flex-col items-center gap-5 py-10 text-center"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
        <svg
          className="h-7 w-7 text-red-500"
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
      <div className="space-y-1.5">
        <p className="text-base font-semibold text-gray-800">Analisis Gagal</p>
        <p className="max-w-xs text-sm text-gray-500">
          {error ?? 'Layanan prediksi tidak tersedia saat ini. Silakan coba lagi nanti.'}
        </p>
      </div>
      <Button onClick={onRetry} className="px-6">
        Coba Lagi
      </Button>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });

  const createMutation = useCreatePrediction();

  const pollingId = phase.kind === 'polling' ? phase.predictionId : null;
  const { data: statusData } = usePredictionStatus(pollingId);

  // Transition from polling → done / failed when status updates
  useEffect(() => {
    if (phase.kind !== 'polling' || !statusData) return;
    if (statusData.status === 'done') {
      setPhase({ kind: 'done', result: statusData.prediction });
    } else if (statusData.status === 'failed') {
      setPhase({ kind: 'failed', error: statusData.error ?? null });
    }
  }, [statusData, phase.kind]);

  const handleSubmit = async (values: PredictionFormValues) => {
    try {
      const res = await createMutation.mutateAsync({
        product_id: values.product_id,
        prediction_start: values.prediction_start,
        prediction_end: values.prediction_end,
      });
      setPhase({ kind: 'polling', predictionId: res.prediction_id });
    } catch {
      setPhase({ kind: 'failed', error: null });
    }
  };

  const handleReset = () => {
    createMutation.reset();
    setPhase({ kind: 'idle' });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-50">
            <IconSparkles />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analisis Cerdas</h1>
            <p className="text-sm text-gray-500">
              Prediksi penjualan berbasis data historis & faktor eksternal
            </p>
          </div>
        </div>
      </motion.div>

      {/* Card shell */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <AnimatePresence mode="wait" initial={false}>
          {/* ── Idle: show form ── */}
          {phase.kind === 'idle' && (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <p className="mb-5 text-sm font-medium text-gray-700">Konfigurasi Prediksi</p>
              <PredictionForm onSubmit={handleSubmit} isSubmitting={createMutation.isPending} />
            </motion.div>
          )}

          {/* ── Polling: show loading ── */}
          {phase.kind === 'polling' && (
            <PredictionPolling
              status={statusData?.status === 'processing' ? 'processing' : 'pending'}
            />
          )}

          {/* ── Done: show results ── */}
          {phase.kind === 'done' && (
            <PredictionResult prediction={phase.result} onReset={handleReset} />
          )}

          {/* ── Failed: show error ── */}
          {phase.kind === 'failed' && <FailedState error={phase.error} onRetry={handleReset} />}
        </AnimatePresence>
      </div>

      {/* Non-blocking note during polling */}
      <AnimatePresence>
        {phase.kind === 'polling' && (
          <motion.p
            key="nav-hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center text-xs text-gray-400"
          >
            Proses berjalan di latar belakang — Anda bebas berpindah halaman dan kembali ke sini.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
