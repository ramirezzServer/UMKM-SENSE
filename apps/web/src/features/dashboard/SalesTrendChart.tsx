import {
  LineChart,
  Line,
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

// ─── Custom tooltip ──────────────────────────────────────────────────────────

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: { date: string; total: number } }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-lg">
      <p className="text-xs text-gray-400">{point.date}</p>
      <p className="mt-0.5 text-sm font-semibold text-gray-900">{rupiahFmt.format(point.total)}</p>
    </div>
  );
}

// ─── Chart section ────────────────────────────────────────────────────────────

export default function SalesTrendChart({ days = 7 }: { days?: number }) {
  const { data, isLoading, isError, refetch } = useSalesTrend(days);

  if (isLoading) return <TrendChartSkeleton />;

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-red-100 bg-red-50 py-10 text-center">
        <p className="text-sm text-red-600">Gagal memuat grafik tren.</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="text-sm font-medium text-indigo-600 hover:underline"
        >
          Coba lagi
        </button>
      </div>
    );
  }

  const allZero = data?.every((d) => d.total === 0);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-700">Tren Penjualan 7 Hari</h2>

      {allZero || !data?.length ? (
        <div className="flex h-52 items-center justify-center">
          <p className="text-sm text-gray-400">Belum ada data penjualan dalam 7 hari terakhir.</p>
        </div>
      ) : (
        <div className="mt-4 h-52">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="day_label"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={formatYAxis}
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                width={48}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e5e7eb' }} />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#4f46e5"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#4f46e5', strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#4f46e5', strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
