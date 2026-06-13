import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useDashboardSummary } from './hooks';
import type { Comparison } from './types';

// ─── Formatters ───────────────────────────────────────────────────────────────

const rupiahFmt = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function formatRupiah(v: number) {
  return rupiahFmt.format(v);
}

// ─── Count-up hook ─────────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 700): number {
  const [display, setDisplay] = useState(0);
  const prevRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (target === prevRef.current) return;
    const start = prevRef.current;
    const end = target;
    prevRef.current = target;
    const startTime = Date.now();

    const tick = () => {
      const t = Math.min((Date.now() - startTime) / duration, 1);
      const eased = 1 - (1 - t) ** 3;
      setDisplay(Math.round(start + (end - start) * eased));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return display;
}

// ─── Change badge ─────────────────────────────────────────────────────────────

function ChangeBadge({ cmp, prefix = '' }: { cmp: Comparison; prefix?: string }) {
  if (!cmp.direction) {
    return <span className="text-xs text-gray-400">vs kemarin: —</span>;
  }
  const isUp = cmp.direction === 'up';
  const pct = cmp.pct !== null ? `${Math.abs(cmp.pct).toFixed(1)}%` : '';
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium ${
        isUp ? 'text-emerald-600' : 'text-red-500'
      }`}
    >
      {isUp ? '▲' : '▼'} {prefix}
      {pct} vs kemarin
    </span>
  );
}

// ─── Single stat card ─────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number;
  format: (v: number) => string;
  comparison: Comparison;
}

function StatCard({ label, value, format, comparison }: StatCardProps) {
  const animated = useCountUp(value);
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wider text-gray-400">{label}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900 tabular-nums">{format(animated)}</p>
      <div className="mt-2">
        <ChangeBadge cmp={comparison} />
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SummarySkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <div className="h-3 w-24 rounded bg-gray-200" />
          <div className="mt-3 h-8 w-36 rounded bg-gray-200" />
          <div className="mt-3 h-3 w-28 rounded bg-gray-200" />
        </div>
      ))}
    </div>
  );
}

// ─── Stagger variants ─────────────────────────────────────────────────────────

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] } },
};

// ─── Section ──────────────────────────────────────────────────────────────────

export default function SummarySection() {
  const { data, isLoading, isError, refetch } = useDashboardSummary();

  if (isLoading) return <SummarySkeleton />;

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-red-100 bg-red-50 py-10 text-center">
        <p className="text-sm text-red-600">Gagal memuat ringkasan hari ini.</p>
        <button
          onClick={() => void refetch()}
          className="text-sm font-medium text-indigo-600 hover:underline"
        >
          Coba lagi
        </button>
      </div>
    );
  }

  if (!data) return null;

  const cards: StatCardProps[] = [
    {
      label: 'Total Penjualan Hari Ini',
      value: data.total_penjualan,
      format: formatRupiah,
      comparison: data.vs_kemarin.total_penjualan,
    },
    {
      label: 'Jumlah Transaksi',
      value: data.jumlah_transaksi,
      format: (v) => v.toLocaleString('id-ID'),
      comparison: data.vs_kemarin.jumlah_transaksi,
    },
    {
      label: 'Rata-rata per Transaksi',
      value: data.rata_rata_per_transaksi,
      format: formatRupiah,
      comparison: data.vs_kemarin.rata_rata_per_transaksi,
    },
  ];

  if (data.jumlah_transaksi === 0) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <StatCard key={c.label} {...c} />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {cards.map((c) => (
        <motion.div key={c.label} variants={item}>
          <StatCard {...c} />
        </motion.div>
      ))}
    </motion.div>
  );
}
