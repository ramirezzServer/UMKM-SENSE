import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { PredictionDetail, PredictionRecommendation, PredictionWarning } from './types';
import Button from '@/components/ui/Button';

// ─── Formatters ───────────────────────────────────────────────────────────────

const rupiah = (v: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(v);

function fmtDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function fmtDateShort(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

// ─── Method label ─────────────────────────────────────────────────────────────

const methodLabel: Record<string, string> = {
  arima: 'ARIMA',
  prophet: 'Prophet',
  wma: 'Rata-rata Bergerak',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function AccuracyBadge({ method, mae, mape }: { method: string; mae: number; mape: number }) {
  const mapeColor =
    mape < 15
      ? 'text-emerald-700 bg-emerald-50'
      : mape < 30
        ? 'text-amber-700 bg-amber-50'
        : 'text-red-700 bg-red-50';
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
        Metode: {methodLabel[method] ?? method}
      </span>
      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
        MAE: {mae.toFixed(1)}
      </span>
      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${mapeColor}`}>
        MAPE: {mape.toFixed(1)}%
      </span>
    </div>
  );
}

const confidenceColor: Record<string, string> = {
  high: 'bg-emerald-500',
  medium: 'bg-amber-400',
  low: 'bg-red-400',
};

const confidenceLabel: Record<string, string> = {
  high: 'Tinggi',
  medium: 'Sedang',
  low: 'Rendah',
};

const priorityStyle: Record<PredictionRecommendation['priority'], string> = {
  high: 'border-red-200 bg-red-50',
  medium: 'border-amber-200 bg-amber-50',
  low: 'border-gray-200 bg-gray-50',
};

const priorityDot: Record<PredictionRecommendation['priority'], string> = {
  high: 'bg-red-500',
  medium: 'bg-amber-400',
  low: 'bg-gray-400',
};

const priorityLabel: Record<PredictionRecommendation['priority'], string> = {
  high: 'Prioritas Tinggi',
  medium: 'Prioritas Sedang',
  low: 'Saran',
};

const warnStyle: Record<PredictionWarning['level'], string> = {
  high: 'border-red-200 bg-red-50 text-red-800',
  medium: 'border-amber-200 bg-amber-50 text-amber-800',
  low: 'border-blue-200 bg-blue-50 text-blue-800',
};

const warnIcon: Record<PredictionWarning['level'], string> = {
  high: '⚠️',
  medium: '⚡',
  low: 'ℹ️',
};

// ─── Custom tooltip ───────────────────────────────────────────────────────────

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg text-xs">
      <p className="font-medium text-gray-700">{label}</p>
      <p className="text-indigo-600 mt-0.5">{rupiah(payload[0].value)}</p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const sectionVariants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.32, delay: i * 0.07, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

interface Props {
  prediction: PredictionDetail;
  onReset: () => void;
}

export default function PredictionResult({ prediction, onReset }: Props) {
  const chartData = prediction.items.map((item) => ({
    date: fmtDateShort(item.date),
    revenue: Math.round(parseFloat(item.predicted_revenue)),
    qty: item.predicted_qty,
  }));

  const totalRevenue = prediction.items.reduce(
    (sum, item) => sum + parseFloat(item.predicted_revenue),
    0
  );
  const totalQty = prediction.items.reduce((sum, item) => sum + item.predicted_qty, 0);

  const highWarnings = prediction.warnings.filter((w) => w.level === 'high');
  const otherWarnings = prediction.warnings.filter((w) => w.level !== 'high');

  return (
    <motion.div
      key="result"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="space-y-6"
    >
      {/* High-priority warnings (data shortage, low confidence) */}
      {highWarnings.map((w, i) => (
        <motion.div
          key={i}
          custom={0}
          variants={sectionVariants}
          initial="hidden"
          animate="show"
          className={`flex gap-3 rounded-xl border p-4 text-sm ${warnStyle[w.level]}`}
        >
          <span className="flex-shrink-0 text-base leading-none">{warnIcon[w.level]}</span>
          <p>{w.message}</p>
        </motion.div>
      ))}

      {/* Header row: period + accuracy */}
      <motion.div custom={1} variants={sectionVariants} initial="hidden" animate="show">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Periode Prediksi
            </p>
            <p className="mt-0.5 text-sm font-semibold text-gray-800">
              {fmtDate(prediction.prediction_start)} — {fmtDate(prediction.prediction_end)}
            </p>
          </div>
          <AccuracyBadge
            method={prediction.forecast_method}
            mae={prediction.mae}
            mape={prediction.mape}
          />
        </div>
      </motion.div>

      {/* AI Summary */}
      <motion.div
        custom={2}
        variants={sectionVariants}
        initial="hidden"
        animate="show"
        className="rounded-xl border border-indigo-100 bg-indigo-50 p-4"
      >
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-indigo-500">
          Ringkasan AI
        </p>
        <p className="text-sm leading-relaxed text-indigo-900">{prediction.ai_summary}</p>
      </motion.div>

      {/* Summary stats */}
      <motion.div
        custom={3}
        variants={sectionVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-4"
      >
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500">Total Perkiraan Pendapatan</p>
          <p className="mt-1 text-xl font-bold text-gray-900">{rupiah(totalRevenue)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500">Total Perkiraan Terjual</p>
          <p className="mt-1 text-xl font-bold text-gray-900">
            {totalQty.toLocaleString('id-ID')} unit
          </p>
        </div>
      </motion.div>

      {/* Revenue chart */}
      <motion.div
        custom={4}
        variants={sectionVariants}
        initial="hidden"
        animate="show"
        className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
      >
        <p className="mb-4 text-sm font-semibold text-gray-700">Perkiraan Pendapatan Harian</p>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
              width={36}
            />
            <Tooltip content={<ChartTooltip />} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#6366f1"
              strokeWidth={2}
              fill="url(#revenueGrad)"
              dot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#6366f1' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Daily breakdown table */}
      <motion.div
        custom={5}
        variants={sectionVariants}
        initial="hidden"
        animate="show"
        className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"
      >
        <p className="px-5 py-4 text-sm font-semibold text-gray-700 border-b border-gray-100">
          Rincian Per Hari
        </p>
        <div className="divide-y divide-gray-50">
          {prediction.items.map((item) => (
            <div key={item.date} className="flex items-center gap-3 px-5 py-3">
              <div className="w-24 flex-shrink-0">
                <p className="text-xs font-medium text-gray-700">{fmtDate(item.date)}</p>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs text-gray-500">{item.predicted_qty} unit</span>
                  <span className="text-xs font-semibold text-gray-800">
                    {rupiah(parseFloat(item.predicted_revenue))}
                  </span>
                </div>
                {/* Confidence bar */}
                <div className="flex items-center gap-1.5">
                  <div className="flex-1 h-1 rounded-full bg-gray-100">
                    <div
                      className={`h-1 rounded-full ${confidenceColor[item.level]}`}
                      style={{ width: `${Math.round(item.confidence * 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-400 flex-shrink-0 w-10">
                    {confidenceLabel[item.level]}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Recommendations */}
      {prediction.recommendations.length > 0 && (
        <motion.div
          custom={6}
          variants={sectionVariants}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          <p className="text-sm font-semibold text-gray-700">Rekomendasi</p>
          {prediction.recommendations.map((rec, i) => (
            <div key={i} className={`rounded-xl border p-4 ${priorityStyle[rec.priority]}`}>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`h-2 w-2 rounded-full flex-shrink-0 ${priorityDot[rec.priority]}`}
                />
                <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  {priorityLabel[rec.priority]}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-800">{rec.title}</p>
              <p className="mt-0.5 text-sm text-gray-600">{rec.description}</p>
            </div>
          ))}
        </motion.div>
      )}

      {/* Non-critical warnings */}
      {otherWarnings.length > 0 && (
        <motion.div
          custom={7}
          variants={sectionVariants}
          initial="hidden"
          animate="show"
          className="space-y-2"
        >
          {otherWarnings.map((w, i) => (
            <div
              key={i}
              className={`flex gap-2.5 rounded-xl border p-3.5 text-sm ${warnStyle[w.level]}`}
            >
              <span className="flex-shrink-0 text-sm leading-none">{warnIcon[w.level]}</span>
              <p>{w.message}</p>
            </div>
          ))}
        </motion.div>
      )}

      {/* Reset button */}
      <motion.div custom={8} variants={sectionVariants} initial="hidden" animate="show">
        <Button
          variant="ghost"
          onClick={onReset}
          className="w-full border border-gray-200 hover:bg-gray-50"
        >
          Analisis Produk / Periode Lain
        </Button>
      </motion.div>
    </motion.div>
  );
}
