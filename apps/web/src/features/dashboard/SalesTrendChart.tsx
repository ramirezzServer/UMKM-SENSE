import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useSalesTrend } from './hooks';
import TrendChartSkeleton from './TrendChartSkeleton';

// ─── Formatters ───────────────────────────────────────────────────────────────

const rupiahFmt = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function formatYAxis(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}jt`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}rb`;
  return String(value);
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: { date: string; total: number } }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-xl border border-warm-200 bg-white px-4 py-3 shadow-warm-md">
      <p className="text-xs font-medium text-warm-400">{point.date}</p>
      <p className="mt-0.5 font-display text-sm font-bold text-warm-900">
        {rupiahFmt.format(point.total)}
      </p>
    </div>
  );
}

// ─── Chart ────────────────────────────────────────────────────────────────────

export default function SalesTrendChart({ days = 7 }: { days?: number }) {
  const { data, isLoading, isError, refetch } = useSalesTrend(days);

  if (isLoading) return <TrendChartSkeleton />;

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-card border border-danger-100 bg-danger-50 py-10 text-center">
        <p className="text-sm text-danger-600">Gagal memuat grafik tren.</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="text-sm font-medium text-accent-600 hover:underline"
        >
          Coba lagi
        </button>
      </div>
    );
  }

  const allZero = data?.every((d) => d.total === 0);

  return (
    <div className="rounded-card glass-card p-6 shadow-card">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="font-display text-base font-bold text-warm-900">Tren Penjualan</h2>
        <span className="text-xs font-medium text-warm-400">7 hari terakhir</span>
      </div>

      {allZero || !data?.length ? (
        <div className="flex h-52 items-center justify-center">
          <p className="text-sm text-warm-400">Belum ada data penjualan dalam 7 hari terakhir.</p>
        </div>
      ) : (
        <div className="mt-4 h-52">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              {/* Gradient fill definition */}
              <defs>
                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0d9488" stopOpacity={0.25} />
                  <stop offset="60%" stopColor="#f59e0b" stopOpacity={0.08} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
              <XAxis
                dataKey="day_label"
                tick={{ fontSize: 11, fill: '#a8a29e' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={formatYAxis}
                tick={{ fontSize: 11, fill: '#a8a29e' }}
                axisLine={false}
                tickLine={false}
                width={46}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#d6d3d1', strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#0d9488"
                strokeWidth={2.5}
                fill="url(#trendGradient)"
                dot={{ r: 3.5, fill: '#0d9488', stroke: '#ffffff', strokeWidth: 2 }}
                activeDot={{ r: 5.5, fill: '#0d9488', stroke: '#ffffff', strokeWidth: 2 }}
                isAnimationActive={true}
                animationDuration={900}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
