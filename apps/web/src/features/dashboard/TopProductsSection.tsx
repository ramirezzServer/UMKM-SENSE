import { motion } from 'framer-motion';
import { useTopProducts } from './hooks';
import type { Comparison } from './types';

// ─── Comparison badge ─────────────────────────────────────────────────────────

function ChangeBadge({ cmp }: { cmp: Comparison }) {
  if (!cmp.direction) return <span className="text-xs text-gray-400">—</span>;
  const isUp = cmp.direction === 'up';
  const pct = cmp.pct !== null ? `${Math.abs(cmp.pct).toFixed(1)}%` : '';
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium ${
        isUp ? 'text-emerald-600' : 'text-red-500'
      }`}
    >
      {isUp ? '▲' : '▼'} {pct}
    </span>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function TopProductsSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 h-5 w-36 rounded bg-gray-200" />
      <div className="space-y-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-7 w-7 flex-shrink-0 rounded-full bg-gray-200" />
            <div className="flex-1">
              <div className="h-4 w-40 rounded bg-gray-200" />
              <div className="mt-1.5 h-3 w-24 rounded bg-gray-200" />
            </div>
            <div className="h-4 w-12 rounded bg-gray-200" />
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
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0, transition: { duration: 0.28, ease: 'easeOut' } },
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
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-red-100 bg-red-50 py-10 text-center">
        <p className="text-sm text-red-600">Gagal memuat produk terlaris.</p>
        <button
          onClick={() => void refetch()}
          className="text-sm font-medium text-indigo-600 hover:underline"
        >
          Coba lagi
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-700">Produk Terlaris (7 Hari)</h2>

      {!data?.length ? (
        <div className="flex h-40 items-center justify-center">
          <p className="text-sm text-gray-400">Belum ada data produk terjual minggu ini.</p>
        </div>
      ) : (
        <motion.ul className="mt-4 space-y-3" variants={container} initial="hidden" animate="show">
          {data.map((product, idx) => (
            <motion.li key={product.product_id} variants={item} className="flex items-center gap-3">
              {/* Rank badge */}
              <span
                className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  idx === 0
                    ? 'bg-amber-100 text-amber-700'
                    : idx === 1
                      ? 'bg-gray-100 text-gray-600'
                      : idx === 2
                        ? 'bg-orange-100 text-orange-600'
                        : 'bg-gray-50 text-gray-400'
                }`}
              >
                {idx + 1}
              </span>

              {/* Name + revenue */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">{product.product_name}</p>
                <p className="text-xs text-gray-400">
                  {new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(product.total_revenue)}
                </p>
              </div>

              {/* Qty + change */}
              <div className="flex-shrink-0 text-right">
                <p className="text-sm font-semibold text-gray-900">
                  {product.total_qty.toLocaleString('id-ID')} pcs
                </p>
                <ChangeBadge cmp={product.vs_sebelumnya} />
              </div>
            </motion.li>
          ))}
        </motion.ul>
      )}
    </div>
  );
}
