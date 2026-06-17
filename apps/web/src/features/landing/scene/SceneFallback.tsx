/* Static CSS illustration shown when WebGL is unavailable or reduced-motion is on */
export default function SceneFallback() {
  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-3xl select-none"
      aria-hidden="true"
    >
      {/* Warm ambient base */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-white to-teal-50" />

      {/* Coin 1 — large, top-left */}
      <div className="absolute left-8 top-10 h-24 w-24 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 shadow-warm-lg opacity-90 ring-4 ring-amber-200" />
      {/* Rupiah mark on coin */}
      <div className="absolute left-14 top-[52px] text-amber-700 text-lg font-bold font-display pointer-events-none select-none">
        Rp
      </div>

      {/* Coin 2 — smaller, right side */}
      <div className="absolute right-14 top-14 h-16 w-16 rounded-full bg-gradient-to-br from-amber-200 to-amber-400 shadow-warm-md opacity-75 ring-2 ring-amber-100" />
      <div className="absolute right-[68px] top-[64px] text-amber-600 text-sm font-bold font-display pointer-events-none select-none">
        Rp
      </div>

      {/* Bar chart — bottom-right */}
      <div className="absolute bottom-14 right-8 flex items-end gap-2.5">
        <div
          className="w-9 rounded-t-md bg-gradient-to-t from-amber-500 to-amber-400 shadow-warm-sm"
          style={{ height: 48 }}
        />
        <div
          className="w-9 rounded-t-md bg-gradient-to-t from-teal-600 to-teal-400 shadow-warm-sm"
          style={{ height: 80 }}
        />
        <div
          className="w-9 rounded-t-md bg-gradient-to-t from-indigo-600 to-indigo-400 shadow-warm-sm"
          style={{ height: 64 }}
        />
      </div>
      {/* Chart base line */}
      <div className="absolute bottom-12 right-6 w-40 h-0.5 bg-warm-200 rounded" />

      {/* Package box — bottom-left */}
      <div className="absolute bottom-10 left-8 h-20 w-20 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 shadow-warm-lg opacity-85 rotate-6" />
      {/* Box lid hint */}
      <div className="absolute bottom-[88px] left-[30px] h-4 w-[88px] rounded-lg bg-teal-300 opacity-70 rotate-6" />

      {/* Indigo ring / torus */}
      <div className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 h-28 w-28 rounded-full border-[10px] border-indigo-400 opacity-30 rotate-12" />
      <div className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 h-20 w-20 rounded-full border-[10px] border-indigo-300 opacity-20" />

      {/* Soft glow overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-white/60 via-transparent to-transparent pointer-events-none" />
    </div>
  );
}
