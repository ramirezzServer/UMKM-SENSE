import { motion } from 'framer-motion';
import { Medal } from 'lucide-react';
import { useTopProducts } from './hooks';
import type { Comparison } from './types';

// ─── Comparison badge ─────────────────────────────────────────────────────────

function ChangeBadge({ cmp }: { cmp: Comparison }) {
  if (!cmp.direction) return <span className="text-xs text-warm-400">—</span>;
  const isUp = cmp.direction === 'up';
  const pct = cmp.pct !== null ? `${Math.abs(cmp.pct).toFixed(1)}%` : '';
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
        isUp ? 'text-success-600' : 'text-danger-600'
      }`}
    >
      {isUp ? '↑' : '↓'} {pct}
    </span>
  );
}

// ─── Rank badge ───────────────────────────────────────────────────────────────

const RANK_STYLE = [
  'bg-primary-100 text-primary-700 ring-1 ring-primary-200',
  'bg-warm-100 text-warm-600 ring-1 ring-warm-200',
  'bg-orange-100 text-orange-600 ring-1 ring-orange-200',
  'bg-warm-50 text-warm-400',
  'bg-warm-50 text-warm-400',
];

// Skeleton bar widths per rank (Tailwind classes, no inline styles)
const SKELETON_BAR = ['w-full', 'w-4/5', 'w-3/5', 'w-2/5', 'w-1/3'];

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function TopProductsSkeleton() {
  return (
    <div className="animate-pulse rounded-card glass-card p-6 shadow-card">
      <div className="mb-4 h-5 w-40 rounded-full bg-warm-200" />
      <div className="space-y-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-7 w-7 flex-shrink-0 rounded-full bg-warm-200" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-40 rounded-full bg-warm-200" />
              <div className={`h-2 rounded-full bg-warm-100 ${SKELETON_BAR[i]}`} />
            </div>
            <div className="h-4 w-12 rounded-full bg-warm-200" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Stagger variants ─────────────────────────────────────────────────────────

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0, transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] } },
};

// ─── Section ──────────────────────────────────────────────────────────────────

export default function TopProductsSection({
  days = 7,
  limit = 5,
}: {
  days?: number;
  limit?: number;
}) {
  const { data, isLoading, isError, refetch } = useTopProducts(days, limit);

  if (isLoading) return <TopProductsSkeleton />;

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-card border border-danger-100 bg-danger-50 py-10 text-center">
        <p className="text-sm text-danger-600">Gagal memuat produk terlaris.</p>
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

  // Derive max revenue for relative bar widths
  const maxRevenue = data?.length ? Math.max(...data.map((p) => p.total_revenue)) : 1;

  return (
    <div className="rounded-card glass-card p-6 shadow-card">
      <div className="mb-5 flex items-center gap-2">
        <Medal className="h-4 w-4 text-primary-500" />
        <h2 className="font-display text-base font-bold text-warm-900">Produk Terlaris</h2>
        <span className="ml-auto text-xs font-medium text-warm-400">7 hari terakhir</span>
      </div>

      {!data?.length ? (
        <div className="flex h-40 items-center justify-center">
          <p className="text-sm text-warm-400">Belum ada data produk terjual minggu ini.</p>
        </div>
      ) : (
        <motion.ul className="space-y-3" variants={container} initial="hidden" animate="show">
          {data.map((product, idx) => {
            const barWidth = `${Math.round((product.total_revenue / maxRevenue) * 100)}%`;
            return (
              <motion.li key={product.product_id} variants={item}>
                <div className="flex items-center gap-3">
                  {/* Rank badge */}
                  <span
                    className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${RANK_STYLE[idx] ?? RANK_STYLE[4]}`}
                  >
                    {idx + 1}
                  </span>

                  {/* Name + bar + revenue */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-warm-900">
                        {product.product_name}
                      </p>
                      <div className="flex flex-shrink-0 flex-col items-end">
                        <p className="text-sm font-bold text-warm-800 tabular-nums">
                          {product.total_qty.toLocaleString('id-ID')} pcs
                        </p>
                        <ChangeBadge cmp={product.vs_sebelumnya} />
                      </div>
                    </div>
                    {/* Revenue bar */}
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-warm-100">
                      <motion.div
                        className={`h-full rounded-full ${idx === 0 ? 'bg-primary-400' : idx === 1 ? 'bg-secondary-400' : 'bg-warm-300'}`}
                        initial={{ width: 0 }}
                        animate={{ width: barWidth }}
                        transition={{ duration: 0.6, delay: idx * 0.07, ease: 'easeOut' }}
                      />
                    </div>
                    <p className="mt-0.5 text-xs text-warm-400">
                      {new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(product.total_revenue)}
                    </p>
                  </div>
                </div>
              </motion.li>
            );
          })}
        </motion.ul>
      )}
    </div>
  );
}
