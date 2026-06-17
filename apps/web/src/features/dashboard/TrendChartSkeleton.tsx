export default function TrendChartSkeleton() {
  return (
    <div className="animate-pulse rounded-card bg-white p-6 shadow-card">
      <div className="mb-1 h-5 w-40 rounded-full bg-warm-200" />
      <div className="mb-4 h-3 w-24 rounded-full bg-warm-100" />
      <div className="h-52 rounded-xl bg-gradient-to-br from-warm-100 to-warm-50" />
    </div>
  );
}
