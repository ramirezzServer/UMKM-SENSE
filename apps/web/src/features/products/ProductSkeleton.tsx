export default function ProductSkeleton() {
  return (
    <div className="animate-pulse glass-card rounded-card p-4 shadow-card">
      <div className="mb-3 h-36 rounded-xl bg-warm-200" />
      <div className="mb-2 h-4 w-3/4 rounded bg-warm-200" />
      <div className="mb-2 h-3 w-1/2 rounded bg-warm-200" />
      <div className="mb-1 h-5 w-1/3 rounded bg-warm-200" />
      <div className="mb-3 h-3 w-1/4 rounded bg-warm-200" />
      <div className="flex gap-2">
        <div className="h-8 flex-1 rounded-lg bg-warm-200" />
        <div className="h-8 flex-1 rounded-lg bg-warm-200" />
      </div>
    </div>
  );
}
