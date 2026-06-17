import { Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/features/auth/hooks';
import SummarySection from '@/features/dashboard/SummarySection';
import TopProductsSection from '@/features/dashboard/TopProductsSection';
import ConditionsPanel from '@/features/dashboard/ConditionsPanel';
import TomorrowPredictionCard from '@/features/dashboard/TomorrowPredictionCard';
import TrendChartSkeleton from '@/features/dashboard/TrendChartSkeleton';

const SalesTrendChart = lazy(() => import('@/features/dashboard/SalesTrendChart'));

// ─── Stagger variants ─────────────────────────────────────────────────────────

const pageVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.25, 0.46, 0.45, 0.94] } },
};

function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div variants={sectionVariants} className={className}>
      {children}
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: user } = useAuth();

  return (
    // Outer wrapper: relative + isolate creates a stacking context.
    // The ambient layer sits at -z-10 inside, clipped by overflow-hidden.
    <div className="relative isolate min-h-full">
      {/* ── Ambient background layer ────────────────────────────────────────── */}
      {/* aria-hidden so screen readers skip decorative blobs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="ambient-orb ambient-orb-1" />
        <div className="ambient-orb ambient-orb-2" />
        <div className="ambient-orb ambient-orb-3" />
      </div>

      {/* ── Page content ────────────────────────────────────────────────────── */}
      <motion.div className="space-y-6" variants={pageVariants} initial="hidden" animate="show">
        {/* Header */}
        <Section>
          <h1 className="font-display text-2xl font-bold text-warm-900">
            Halo, <span className="text-gradient-warm">{user?.name ?? '—'}</span>!
          </h1>
          <p className="mt-1 text-sm text-warm-500">
            {user?.business?.name ? `${user.business.name} · ` : ''}
            Ringkasan penjualan hari ini
          </p>
        </Section>

        {/* Stat cards */}
        <Section>
          <SummarySection />
        </Section>

        {/* Chart 2/3 + right column 1/3 */}
        <Section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Suspense fallback={<TrendChartSkeleton />}>
              <SalesTrendChart days={7} />
            </Suspense>
          </div>

          <div className="flex flex-col gap-6">
            <ConditionsPanel />
            <TomorrowPredictionCard />
          </div>
        </Section>

        {/* Top products */}
        <Section>
          <TopProductsSection days={7} limit={5} />
        </Section>
      </motion.div>
    </div>
  );
}
