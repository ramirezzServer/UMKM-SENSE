import { Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/features/auth/hooks';
import SummarySection from '@/features/dashboard/SummarySection';
import TopProductsSection from '@/features/dashboard/TopProductsSection';
import ConditionsPanel from '@/features/dashboard/ConditionsPanel';
import TomorrowPredictionCard from '@/features/dashboard/TomorrowPredictionCard';
import TrendChartSkeleton from '@/features/dashboard/TrendChartSkeleton';

// Chart is code-split — heavy Recharts bundle loads separately
const SalesTrendChart = lazy(() => import('@/features/dashboard/SalesTrendChart'));

// ─── Animated section wrapper ─────────────────────────────────────────────────

const sectionVariants = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

function Section({
  children,
  order,
  className = '',
}: {
  children: React.ReactNode;
  order: number;
  className?: string;
}) {
  return (
    <motion.div
      custom={order}
      variants={sectionVariants}
      initial="hidden"
      animate="show"
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Halo, {user?.name ?? '—'}!</h1>
        <p className="mt-1 text-sm text-gray-500">
          {user?.business?.name ? `${user.business.name} · ` : ''}
          Ringkasan penjualan hari ini
        </p>
      </div>

      {/* Stat cards */}
      <Section order={0}>
        <SummarySection />
      </Section>

      {/* Chart (2/3) + right column (1/3): conditions + tomorrow prediction */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Section order={1} className="lg:col-span-2">
          <Suspense fallback={<TrendChartSkeleton />}>
            <SalesTrendChart days={7} />
          </Suspense>
        </Section>

        <div className="flex flex-col gap-6">
          <Section order={2}>
            <ConditionsPanel />
          </Section>
          <Section order={3}>
            <TomorrowPredictionCard />
          </Section>
        </div>
      </div>

      {/* Top products */}
      <Section order={4}>
        <TopProductsSection days={7} limit={5} />
      </Section>
    </div>
  );
}
