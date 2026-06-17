import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { useCreatePrediction, usePredictionStatus } from '@/features/analytics/hooks';
import PredictionForm from '@/features/analytics/PredictionForm';
import type { PredictionFormValues } from '@/features/analytics/PredictionForm';
import PredictionPolling from '@/features/analytics/PredictionPolling';
import PredictionResult from '@/features/analytics/PredictionResult';
import type { PredictionDetail } from '@/features/analytics/types';
import Button from '@/components/ui/Button';
import { fadeInUp, stagger, staggerItem } from '@/lib/motion';

// ─── Page-level state machine ─────────────────────────────────────────────────

type Phase =
  | { kind: 'idle' }
  | { kind: 'polling'; predictionId: number }
  | { kind: 'done'; result: PredictionDetail }
  | { kind: 'failed'; error: string | null };

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
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-danger-50">
        <svg
          className="h-7 w-7 text-danger-500"
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
        <p className="text-base font-semibold text-warm-800">Analisis Gagal</p>
        <p className="max-w-xs text-sm text-warm-500">
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
  const [searchParams, setSearchParams] = useSearchParams();

  const [phase, setPhase] = useState<Phase>(() => {
    const raw = searchParams.get('prediction');
    if (raw) {
      const id = parseInt(raw, 10);
      if (!isNaN(id) && id > 0) return { kind: 'polling', predictionId: id };
    }
    return { kind: 'idle' };
  });

  const createMutation = useCreatePrediction();

  const pollingId = phase.kind === 'polling' ? phase.predictionId : null;
  const { data: statusData, isError: statusIsError } = usePredictionStatus(pollingId);

  useEffect(() => {
    if (phase.kind !== 'polling' || !statusData) return;
    if (statusData.status === 'done') {
      setPhase({ kind: 'done', result: statusData.prediction });
    } else if (statusData.status === 'failed') {
      setPhase({ kind: 'failed', error: statusData.error ?? null });
    }
  }, [statusData, phase.kind]);

  useEffect(() => {
    if (phase.kind !== 'polling' || !statusIsError) return;
    setSearchParams({}, { replace: true });
    setPhase({ kind: 'idle' });
  }, [statusIsError, phase.kind, setSearchParams]);

  const handleSubmit = async (values: PredictionFormValues) => {
    try {
      const res = await createMutation.mutateAsync({
        product_id: values.product_id,
        prediction_start: values.prediction_start,
        prediction_end: values.prediction_end,
      });
      setSearchParams({ prediction: String(res.prediction_id) }, { replace: true });
      setPhase({ kind: 'polling', predictionId: res.prediction_id });
    } catch {
      setPhase({ kind: 'failed', error: null });
    }
  };

  const handleReset = () => {
    createMutation.reset();
    setSearchParams({}, { replace: true });
    setPhase({ kind: 'idle' });
  };

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="visible"
      className="mx-auto max-w-2xl space-y-6"
    >
      {/* Page header */}
      <motion.div variants={staggerItem} className="flex items-center gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-accent-50">
          <svg
            className="h-6 w-6 text-accent-600"
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
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-warm-900">Analisis Cerdas</h1>
          <p className="text-sm text-warm-500">
            Prediksi penjualan berbasis data historis &amp; faktor eksternal
          </p>
        </div>
      </motion.div>

      {/* Card shell */}
      <motion.div variants={staggerItem} className="glass-card rounded-card shadow-card p-6">
        <AnimatePresence mode="wait" initial={false}>
          {phase.kind === 'idle' && (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <p className="mb-5 text-sm font-medium text-warm-700">Konfigurasi Prediksi</p>
              <PredictionForm onSubmit={handleSubmit} isSubmitting={createMutation.isPending} />
            </motion.div>
          )}

          {phase.kind === 'polling' && (
            <PredictionPolling
              status={statusData?.status === 'processing' ? 'processing' : 'pending'}
            />
          )}

          {phase.kind === 'done' && (
            <PredictionResult prediction={phase.result} onReset={handleReset} />
          )}

          {phase.kind === 'failed' && <FailedState error={phase.error} onRetry={handleReset} />}
        </AnimatePresence>
      </motion.div>

      {/* Non-blocking note during polling */}
      <AnimatePresence>
        {phase.kind === 'polling' && (
          <motion.p
            key="nav-hint"
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0 }}
            className="text-center text-xs text-warm-400"
          >
            Proses berjalan di latar belakang — Anda bebas berpindah halaman dan kembali ke sini.
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
