import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Banknote, ShoppingCart, TrendingUp } from 'lucide-react';
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
    return <span className="text-xs text-warm-400">vs kemarin: —</span>;
  }
  const isUp = cmp.direction === 'up';
  const pct = cmp.pct !== null ? `${Math.abs(cmp.pct).toFixed(1)}%` : '';
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${
        isUp ? 'bg-success-50 text-success-600' : 'bg-danger-50 text-danger-600'
      }`}
    >
      {isUp ? '↑' : '↓'} {prefix}
      {pct} vs kemarin
    </span>
  );
}

// ─── Card config ──────────────────────────────────────────────────────────────

type CardAccent = 'amber' | 'teal' | 'indigo';

const ACCENT_CLASSES: Record<CardAccent, { iconBg: string; iconText: string; bar: string }> = {
  amber: {
    iconBg: 'bg-primary-100',
    iconText: 'text-primary-600',
    bar: 'bg-primary-400',
  },
  teal: {
    iconBg: 'bg-secondary-100',
    iconText: 'text-secondary-600',
    bar: 'bg-secondary-400',
  },
  indigo: {
    iconBg: 'bg-accent-100',
    iconText: 'text-accent-600',
    bar: 'bg-accent-400',
  },
};

// ─── Single stat card ─────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number;
  format: (v: number) => string;
  comparison: Comparison;
  icon: React.ReactNode;
  accent: CardAccent;
}

function StatCard({ label, value, format, comparison, icon, accent }: StatCardProps) {
  const animated = useCountUp(value);
  const cls = ACCENT_CLASSES[accent];

  return (
    <motion.div
      className="group relative overflow-hidden rounded-card bg-white p-6 shadow-card transition-shadow duration-200 hover:shadow-card-hover"
      initial="rest"
      whileHover="hover"
    >
      {/* Left accent bar */}
      <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-full ${cls.bar} opacity-60`} />

      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-warm-400">{label}</p>
        <div
          className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${cls.iconBg} ${cls.iconText}`}
        >
          {icon}
        </div>
      </div>

      <p className="mt-3 font-display text-2xl font-bold tracking-tight text-warm-900 tabular-nums">
        {format(animated)}
      </p>

      <div className="mt-2.5">
        <ChangeBadge cmp={comparison} />
      </div>
    </motion.div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SummarySkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="animate-pulse rounded-card bg-white p-6 shadow-card">
          <div className="flex items-start justify-between">
            <div className="h-3 w-28 rounded-full bg-warm-200" />
            <div className="h-9 w-9 rounded-xl bg-warm-200" />
          </div>
          <div className="mt-4 h-7 w-36 rounded-lg bg-warm-200" />
          <div className="mt-3 h-5 w-28 rounded-full bg-warm-100" />
        </div>
      ))}
    </div>
  );
}

// ─── Stagger variants ─────────────────────────────────────────────────────────

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] } },
};

// ─── Section ──────────────────────────────────────────────────────────────────

export default function SummarySection() {
  const { data, isLoading, isError, refetch } = useDashboardSummary();

  if (isLoading) return <SummarySkeleton />;

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-card border border-danger-100 bg-danger-50 py-10 text-center">
        <p className="text-sm text-danger-600">Gagal memuat ringkasan hari ini.</p>
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

  if (!data) return null;

  const cards: StatCardProps[] = [
    {
      label: 'Total Penjualan Hari Ini',
      value: data.total_penjualan,
      format: formatRupiah,
      comparison: data.vs_kemarin.total_penjualan,
      icon: <Banknote className="h-5 w-5" />,
      accent: 'amber',
    },
    {
      label: 'Jumlah Transaksi',
      value: data.jumlah_transaksi,
      format: (v) => v.toLocaleString('id-ID'),
      comparison: data.vs_kemarin.jumlah_transaksi,
      icon: <ShoppingCart className="h-5 w-5" />,
      accent: 'teal',
    },
    {
      label: 'Rata-rata per Transaksi',
      value: data.rata_rata_per_transaksi,
      format: formatRupiah,
      comparison: data.vs_kemarin.rata_rata_per_transaksi,
      icon: <TrendingUp className="h-5 w-5" />,
      accent: 'indigo',
    },
  ];

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
