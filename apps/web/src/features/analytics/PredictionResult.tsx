import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { PredictionDetail, PredictionRecommendation, PredictionWarning } from './types';
import Button from '@/components/ui/Button';

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId = 'ringkasan' | 'prediksi' | 'rekomendasi';

// ─── Formatters ───────────────────────────────────────────────────────────────

const rupiah = (v: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(v);

const pct = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`;

function fmtDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function fmtDateShort(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
  });
}

function fmtDay(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long' });
}

// ─── Count-up hook ────────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 1000) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (target === 0) {
      setValue(0);
      return;
    }
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return value;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const methodLabel: Record<string, string> = {
  arima: 'ARIMA',
  prophet: 'Prophet',
  wma: 'Rata-rata Bergerak',
};

const priorityOrder: Record<PredictionRecommendation['priority'], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

const priorityBadge: Record<PredictionRecommendation['priority'], string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-gray-100 text-gray-600',
};

const priorityLabel: Record<PredictionRecommendation['priority'], string> = {
  high: 'Prioritas Tinggi',
  medium: 'Prioritas Sedang',
  low: 'Saran',
};

const levelBadge: Record<string, string> = {
  high: 'bg-emerald-100 text-emerald-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-red-100 text-red-700',
};

const levelLabel: Record<string, string> = {
  high: 'Tinggi',
  medium: 'Sedang',
  low: 'Rendah',
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

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  formatter,
  sub,
  highlight,
}: {
  label: string;
  value: number;
  formatter: (v: number) => string;
  sub?: string;
  highlight?: 'up' | 'down' | 'neutral';
}) {
  const animated = useCountUp(Math.abs(value));
  const displayVal = value < 0 ? -animated : animated;
  const colorMap = { up: 'text-emerald-600', down: 'text-red-500', neutral: 'text-gray-800' };
  const color = highlight ? colorMap[highlight] : 'text-gray-900';

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className={`mt-1 text-xl font-bold leading-tight ${color}`}>{formatter(displayVal)}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

// ─── TabButton ────────────────────────────────────────────────────────────────

function TabButton({
  id,
  active,
  onClick,
  children,
}: {
  id: TabId;
  active: boolean;
  onClick: (id: TabId) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      className={
        'relative pb-3 text-sm font-medium transition-colors focus-visible:outline-none ' +
        'focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ' +
        (active ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700')
      }
    >
      {children}
      {active && (
        <motion.span
          layoutId="tab-indicator"
          className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-indigo-600"
          transition={{ type: 'spring', stiffness: 500, damping: 40 }}
        />
      )}
    </button>
  );
}

// ─── Chart tooltip ────────────────────────────────────────────────────────────

const tooltipColorClass: Record<string, string> = {
  'Prediksi (Rp)': 'text-orange-500',
  'Baseline estimasi (Rp)': 'text-indigo-500',
};

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg text-xs space-y-1">
      <p className="font-semibold text-gray-700">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className={tooltipColorClass[p.name] ?? 'text-gray-700'}>
          {p.name}: <span className="font-medium">{rupiah(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

// ─── Tab: Ringkasan ───────────────────────────────────────────────────────────

function TabRingkasan({
  prediction,
  onTabChange,
}: {
  prediction: PredictionDetail;
  onTabChange: (id: TabId) => void;
}) {
  const totalRevenue = prediction.items.reduce((s, i) => s + parseFloat(i.predicted_revenue), 0);
  const totalQty = prediction.items.reduce((s, i) => s + i.predicted_qty, 0);
  const avgPerDay = prediction.items.length > 0 ? totalRevenue / prediction.items.length : 0;

  const firstRev =
    prediction.items.length > 0 ? parseFloat(prediction.items[0].predicted_revenue) : 0;
  const lastRev =
    prediction.items.length > 0
      ? parseFloat(prediction.items[prediction.items.length - 1].predicted_revenue)
      : 0;
  const growthPct = firstRev > 0 ? ((lastRev - firstRev) / firstRev) * 100 : 0;

  const previewRecs = [...prediction.recommendations]
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
    .slice(0, 2);

  const trendText =
    growthPct > 5
      ? `Tren positif — pendapatan harian diperkirakan naik ${pct(growthPct)} selama periode ini.`
      : growthPct < -5
        ? `Tren melambat — pendapatan harian diperkirakan turun ${pct(Math.abs(growthPct))} selama periode ini.`
        : 'Tren stabil — tidak ada pergerakan signifikan selama periode prediksi.';

  const sectionV = {
    hidden: { opacity: 0, y: 12 },
    show: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, delay: i * 0.06, ease: [0.25, 0.46, 0.45, 0.94] as number[] },
    }),
  };

  return (
    <div className="space-y-6">
      {/* AI Summary */}
      <motion.div
        custom={0}
        variants={sectionV}
        initial="hidden"
        animate="show"
        className="rounded-xl border border-indigo-100 bg-indigo-50 p-4"
      >
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
            AI Generated
          </span>
          <span className="text-xs text-indigo-400">Ringkasan Analisis</span>
        </div>
        <p className="text-sm leading-relaxed text-indigo-900">{prediction.ai_summary}</p>
      </motion.div>

      {/* 4 Stat cards */}
      <motion.div
        custom={1}
        variants={sectionV}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        <StatCard label="Total Pendapatan" value={totalRevenue} formatter={rupiah} />
        <StatCard
          label="Total Terjual"
          value={totalQty}
          formatter={(v) => `${v.toLocaleString('id-ID')} unit`}
        />
        <StatCard label="Rata-rata / Hari" value={avgPerDay} formatter={rupiah} />
        <StatCard
          label="Prediksi Pertumbuhan"
          value={Math.abs(growthPct)}
          formatter={(v) => `${growthPct < 0 ? '-' : '+'}${v.toFixed(1)}%`}
          highlight={growthPct > 2 ? 'up' : growthPct < -2 ? 'down' : 'neutral'}
          sub={
            prediction.items.length > 1
              ? `${fmtDateShort(prediction.prediction_start)} → ${fmtDateShort(prediction.prediction_end)}`
              : undefined
          }
        />
      </motion.div>

      {/* Two-column insights */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Ringkasan Tren */}
        <motion.div
          custom={2}
          variants={sectionV}
          initial="hidden"
          animate="show"
          className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
        >
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Ringkasan Tren
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">{trendText}</p>
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
            <span className="rounded-full bg-gray-100 px-2 py-0.5">
              Metode: {methodLabel[prediction.forecast_method] ?? prediction.forecast_method}
            </span>
            <span className="rounded-full bg-gray-100 px-2 py-0.5">
              MAPE: {prediction.mape.toFixed(1)}%
            </span>
          </div>
        </motion.div>

        {/* Akurasi Model (Aktual vs Prediksi) */}
        <motion.div
          custom={3}
          variants={sectionV}
          initial="hidden"
          animate="show"
          className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
        >
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Akurasi Model
          </p>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-50">
              <tr>
                <td className="py-1.5 text-gray-500">Metode</td>
                <td className="py-1.5 text-right font-medium text-gray-800">
                  {methodLabel[prediction.forecast_method] ?? prediction.forecast_method}
                </td>
              </tr>
              <tr>
                <td className="py-1.5 text-gray-500">MAE (error rata-rata)</td>
                <td className="py-1.5 text-right font-medium text-gray-800">
                  {prediction.mae.toFixed(2)}
                </td>
              </tr>
              <tr>
                <td className="py-1.5 text-gray-500">MAPE (% error)</td>
                <td
                  className={`py-1.5 text-right font-medium ${prediction.mape < 15 ? 'text-emerald-600' : prediction.mape < 30 ? 'text-amber-600' : 'text-red-600'}`}
                >
                  {prediction.mape.toFixed(1)}%{' '}
                  <span className="text-xs font-normal text-gray-400">
                    (
                    {prediction.mape < 15
                      ? 'Baik'
                      : prediction.mape < 30
                        ? 'Cukup'
                        : 'Perlu perhatian'}
                    )
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-1.5 text-gray-500">Periode</td>
                <td className="py-1.5 text-right font-medium text-gray-800">
                  {prediction.items.length} hari
                </td>
              </tr>
            </tbody>
          </table>
        </motion.div>

        {/* Rekomendasi Preview */}
        <motion.div
          custom={4}
          variants={sectionV}
          initial="hidden"
          animate="show"
          className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:col-span-1"
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Rekomendasi AI
            </p>
            <button
              type="button"
              onClick={() => onTabChange('rekomendasi')}
              className="text-xs text-indigo-600 hover:underline focus-visible:outline-none"
            >
              Lihat semua →
            </button>
          </div>
          <div className="space-y-2.5">
            {previewRecs.map((rec, i) => (
              <div key={i} className="flex gap-2.5">
                <span
                  className={`mt-0.5 flex-shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${priorityBadge[rec.priority]}`}
                >
                  {priorityLabel[rec.priority]}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-800">{rec.title}</p>
                  <p className="text-xs text-gray-500 line-clamp-2">{rec.description}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Warnings */}
        {prediction.warnings.length > 0 && (
          <motion.div
            custom={5}
            variants={sectionV}
            initial="hidden"
            animate="show"
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Peringatan & Risiko
            </p>
            <div className="space-y-2">
              {prediction.warnings.map((w, i) => (
                <div
                  key={i}
                  className={`flex gap-2 rounded-lg border px-3 py-2 text-xs ${warnStyle[w.level]}`}
                >
                  <span className="flex-shrink-0 leading-none">{warnIcon[w.level]}</span>
                  <p>{w.message}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ─── Tab: Prediksi ────────────────────────────────────────────────────────────

function TabPrediksi({ prediction }: { prediction: PredictionDetail }) {
  const mape = prediction.mape;

  const chartData = prediction.items.map((item) => {
    const rev = Math.round(parseFloat(item.predicted_revenue));
    return {
      date: fmtDateShort(item.date),
      prediksi: rev,
      // Baseline estimated from MAPE — represents approximate lower bound
      baseline: Math.round(rev * (1 - mape / 100)),
      qty: item.predicted_qty,
    };
  });

  const totalRevenue = prediction.items.reduce((s, i) => s + parseFloat(i.predicted_revenue), 0);
  const totalQty = prediction.items.reduce((s, i) => s + i.predicted_qty, 0);

  const hasChart = chartData.length > 1;

  return (
    <div className="space-y-6">
      {/* Chart */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-1 flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-gray-700">Proyeksi Pendapatan Harian</p>
          <span className="text-[10px] text-gray-400">
            Garis bawah = estimasi baseline (±MAPE {mape.toFixed(0)}%)
          </span>
        </div>
        {hasChart ? (
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
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
                tickFormatter={(v: number) =>
                  v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}jt` : `${(v / 1_000).toFixed(0)}k`
                }
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
                width={42}
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
              />
              {/* Filled area for prediction */}
              <Area
                type="monotone"
                dataKey="prediksi"
                name="Prediksi (Rp)"
                stroke="#f97316"
                strokeWidth={2.5}
                fill="url(#predGrad)"
                dot={{ r: 3, fill: '#f97316', strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
              {/* Dashed baseline line */}
              <Line
                type="monotone"
                dataKey="baseline"
                name="Baseline estimasi (Rp)"
                stroke="#6366f1"
                strokeWidth={1.5}
                strokeDasharray="4 3"
                dot={false}
                activeDot={{ r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <p className="py-8 text-center text-sm text-gray-400">
            Grafik membutuhkan minimal 2 hari data.
          </p>
        )}
      </div>

      {/* Daily table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <p className="border-b border-gray-100 px-5 py-3.5 text-sm font-semibold text-gray-700">
          Tabel Prediksi Harian
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold text-gray-500">
                  Tanggal
                </th>
                <th className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold text-gray-500">
                  Hari
                </th>
                <th className="whitespace-nowrap px-4 py-2.5 text-right text-xs font-semibold text-gray-500">
                  Est. Pendapatan
                </th>
                <th className="whitespace-nowrap px-4 py-2.5 text-right text-xs font-semibold text-gray-500">
                  Est. Terjual
                </th>
                <th className="whitespace-nowrap px-4 py-2.5 text-center text-xs font-semibold text-gray-500">
                  Keyakinan
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {prediction.items.map((item) => (
                <tr key={item.date} className="hover:bg-gray-50/50 transition-colors">
                  <td className="whitespace-nowrap px-4 py-3 text-xs font-medium text-gray-700">
                    {fmtDate(item.date)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">
                    {fmtDay(item.date)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-gray-800">
                    {rupiah(parseFloat(item.predicted_revenue))}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-xs text-gray-600">
                    {item.predicted_qty.toLocaleString('id-ID')} unit
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-center">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${levelBadge[item.level]}`}
                    >
                      {levelLabel[item.level]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals footer */}
        <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-5 py-3">
          <span className="text-xs font-semibold text-gray-500">
            Total {prediction.items.length} hari
          </span>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-gray-500">{totalQty.toLocaleString('id-ID')} unit</span>
            <span className="font-bold text-gray-900">{rupiah(totalRevenue)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Rekomendasi ─────────────────────────────────────────────────────────

function TabRekomendasi({ prediction }: { prediction: PredictionDetail }) {
  const sorted = [...prediction.recommendations].sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
          <svg
            className="h-6 w-6 text-gray-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <p className="text-sm text-gray-500">Tidak ada rekomendasi untuk periode ini.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sorted.map((rec, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: i * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
        >
          <div className="flex gap-3">
            {/* Number */}
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
              {i + 1}
            </div>
            <div className="min-w-0 flex-1">
              {/* Priority badge + title */}
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${priorityBadge[rec.priority]}`}
                >
                  {priorityLabel[rec.priority]}
                </span>
              </div>
              <p className="text-sm font-semibold text-gray-800">{rec.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-gray-600">{rec.description}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─── PredictionResult ─────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string }[] = [
  { id: 'ringkasan', label: 'Ringkasan' },
  { id: 'prediksi', label: 'Prediksi' },
  { id: 'rekomendasi', label: 'Rekomendasi' },
];

interface Props {
  prediction: PredictionDetail;
  onReset: () => void;
}

export default function PredictionResult({ prediction, onReset }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('ringkasan');

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="space-y-5"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Hasil Analisis
          </p>
          <p className="text-sm font-semibold text-gray-800 mt-0.5">
            {fmtDate(prediction.prediction_start)} — {fmtDate(prediction.prediction_end)}
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={onReset}
          className="border border-gray-200 px-3 py-1.5 text-xs hover:bg-gray-50"
        >
          ← Analisis Baru
        </Button>
      </div>

      {/* Tab navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6" aria-label="Tab hasil analisis">
          {TABS.map((tab) => (
            <TabButton
              key={tab.id}
              id={tab.id}
              active={activeTab === tab.id}
              onClick={setActiveTab}
            >
              {tab.label}
              {tab.id === 'rekomendasi' && prediction.recommendations.length > 0 && (
                <span className="ml-1.5 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500">
                  {prediction.recommendations.length}
                </span>
              )}
            </TabButton>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {activeTab === 'ringkasan' && (
            <TabRingkasan prediction={prediction} onTabChange={setActiveTab} />
          )}
          {activeTab === 'prediksi' && <TabPrediksi prediction={prediction} />}
          {activeTab === 'rekomendasi' && <TabRekomendasi prediction={prediction} />}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
