import { motion } from 'framer-motion';
import { useConditions } from './hooks';
import type { WeatherCondition, HolidayEvent } from './types';

// ─── Date helper ──────────────────────────────────────────────────────────────
// Construct via (y, m-1, d) to avoid UTC-midnight timezone shift

function formatEventDate(dateStr: string): string {
  const parts = dateStr.split('-').map(Number);
  return new Date(parts[0], parts[1] - 1, parts[2]).toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

// ─── Animated weather icons ───────────────────────────────────────────────────

const FLOAT = {
  animate: { y: [-2, 2] as [number, number] },
  transition: {
    duration: 3.5,
    repeat: Infinity,
    repeatType: 'reverse' as const,
    ease: 'easeInOut',
  },
};

function SunIcon() {
  return (
    <div className="relative h-12 w-12 flex-shrink-0">
      {/* Rotating rays */}
      <motion.svg
        className="absolute inset-0 text-amber-300"
        viewBox="0 0 24 24"
        fill="none"
        animate={{ rotate: 360 }}
        transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: '50% 50%' }}
      >
        <g stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
          <line x1="12" y1="2" x2="12" y2="4.5" />
          <line x1="12" y1="19.5" x2="12" y2="22" />
          <line x1="4.22" y1="4.22" x2="5.93" y2="5.93" />
          <line x1="18.07" y1="18.07" x2="19.78" y2="19.78" />
          <line x1="2" y1="12" x2="4.5" y2="12" />
          <line x1="19.5" y1="12" x2="22" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.93" y2="18.07" />
          <line x1="18.07" y1="5.93" x2="19.78" y2="4.22" />
        </g>
      </motion.svg>
      {/* Static center */}
      <svg className="absolute inset-0 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="4.5" />
      </svg>
    </div>
  );
}

function CloudIcon() {
  return (
    <motion.svg
      className="h-12 w-12 flex-shrink-0 text-gray-400"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      animate={FLOAT.animate}
      transition={FLOAT.transition}
    >
      <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" strokeLinecap="round" />
    </motion.svg>
  );
}

function RainDrop({ delay }: { delay: number }) {
  return (
    <motion.span
      className="block h-2.5 w-px rounded-full bg-blue-400"
      animate={{ y: [0, 14], opacity: [0.85, 0] }}
      transition={{ duration: 0.8, repeat: Infinity, delay, ease: 'easeIn' }}
    />
  );
}

function RainIcon() {
  return (
    <div className="flex h-14 w-12 flex-shrink-0 flex-col">
      <motion.svg
        className="h-9 w-12 text-blue-400"
        viewBox="0 0 24 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        animate={FLOAT.animate}
        transition={FLOAT.transition}
      >
        <path d="M20 14A5 5 0 0018 4h-1.26A8 8 0 104 11" strokeLinecap="round" />
      </motion.svg>
      <div className="flex justify-around px-2 pt-0.5">
        <RainDrop delay={0} />
        <RainDrop delay={0.25} />
        <RainDrop delay={0.5} />
      </div>
    </div>
  );
}

function StormIcon() {
  return (
    <div className="flex h-14 w-12 flex-shrink-0 flex-col items-center">
      <motion.svg
        className="h-9 w-12 text-slate-500"
        viewBox="0 0 24 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        animate={FLOAT.animate}
        transition={FLOAT.transition}
      >
        <path d="M19 14.9A5 5 0 0018 5h-1.26a8 8 0 10-11.62 9" strokeLinecap="round" />
      </motion.svg>
      <motion.svg
        className="text-yellow-400"
        viewBox="0 0 12 18"
        width={12}
        height={18}
        animate={{ opacity: [1, 0.1, 1, 0.1, 1] }}
        transition={{ duration: 2.8, repeat: Infinity, times: [0, 0.08, 0.16, 0.24, 1] }}
      >
        <polyline
          points="9 1 3 9 8 9 2 17"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </motion.svg>
    </div>
  );
}

function WeatherIcon({ condition }: { condition: WeatherCondition['condition'] }) {
  switch (condition) {
    case 'clear':
      return <SunIcon />;
    case 'cloudy':
      return <CloudIcon />;
    case 'rainy':
      return <RainIcon />;
    case 'stormy':
      return <StormIcon />;
  }
}

const CONDITION_LABEL: Record<WeatherCondition['condition'], string> = {
  clear: 'Cerah',
  cloudy: 'Berawan',
  rainy: 'Hujan',
  stormy: 'Badai',
};

const CONDITION_BG: Record<WeatherCondition['condition'], string> = {
  clear: 'bg-amber-50 border-amber-100',
  cloudy: 'bg-gray-50 border-gray-100',
  rainy: 'bg-blue-50 border-blue-100',
  stormy: 'bg-purple-50 border-purple-100',
};

// ─── Event badge ──────────────────────────────────────────────────────────────

type EventType = 'Libur' | 'Event' | 'Promosi';

const BADGE_STYLE: Record<EventType, string> = {
  Libur: 'bg-red-50 text-red-600 ring-1 ring-inset ring-red-100',
  Event: 'bg-indigo-50 text-indigo-600 ring-1 ring-inset ring-indigo-100',
  Promosi: 'bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-100',
};

function EventBadge({ type }: { type: EventType }) {
  return (
    <span
      className={`inline-block flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold leading-5 ${BADGE_STYLE[type]}`}
    >
      {type}
    </span>
  );
}

// ─── No-weather state ─────────────────────────────────────────────────────────

function NoWeatherState() {
  return (
    <div className="mt-3 flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
      <svg
        className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-300"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" strokeLinecap="round" />
      </svg>
      <div>
        <p className="text-sm font-medium text-gray-600">Data cuaca tidak tersedia</p>
        <p className="text-xs text-gray-400">Akan tampil setelah data disinkronkan</p>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ConditionsSkeleton() {
  return (
    <div className="animate-pulse space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      {/* Weather block */}
      <div>
        <div className="h-4 w-32 rounded bg-gray-200" />
        <div className="mt-3 flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
          <div className="h-12 w-12 flex-shrink-0 rounded-full bg-gray-200" />
          <div className="space-y-2">
            <div className="h-5 w-20 rounded bg-gray-200" />
            <div className="h-3 w-28 rounded bg-gray-200" />
            <div className="h-3 w-16 rounded bg-gray-200" />
          </div>
        </div>
      </div>
      {/* Events block */}
      <div>
        <div className="h-3 w-40 rounded bg-gray-200" />
        <div className="mt-3 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-5 w-12 rounded-full bg-gray-200" />
              <div className="flex-1 space-y-1">
                <div className="h-3.5 rounded bg-gray-200" />
                <div className="h-2.5 w-16 rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Stagger list variants ────────────────────────────────────────────────────

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0, transition: { duration: 0.26, ease: 'easeOut' } },
};

// ─── Event list ───────────────────────────────────────────────────────────────

function EventList({ events }: { events: HolidayEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="mt-3 flex flex-col items-center gap-1.5 rounded-xl border border-dashed border-gray-200 py-5 text-center">
        <svg
          className="h-6 w-6 text-gray-200"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" strokeLinecap="round" />
          <line x1="8" y1="2" x2="8" y2="6" strokeLinecap="round" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <p className="text-xs text-gray-400">Tidak ada event dalam 7 hari ke depan</p>
      </div>
    );
  }

  return (
    <motion.ul className="mt-3 space-y-2.5" variants={listVariants} initial="hidden" animate="show">
      {events.map((ev) => (
        <motion.li key={ev.date} variants={itemVariants} className="flex items-start gap-2">
          <EventBadge type="Libur" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium leading-tight text-gray-800">{ev.name}</p>
            <p className="text-xs text-gray-400">{formatEventDate(ev.date)}</p>
          </div>
        </motion.li>
      ))}
    </motion.ul>
  );
}

// ─── Panel ────────────────────────────────────────────────────────────────────

export default function ConditionsPanel() {
  const { data, isLoading, isError, refetch } = useConditions();

  if (isLoading) return <ConditionsSkeleton />;

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-red-100 bg-red-50 py-10 text-center">
        <p className="text-sm text-red-600">Gagal memuat kondisi hari ini.</p>
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

  const { cuaca, events } = data ?? { cuaca: null, events: [] };

  return (
    <div className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      {/* ── Cuaca ── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700">Kondisi Hari Ini</h2>

        {cuaca ? (
          <div
            className={`mt-3 flex items-center gap-4 rounded-xl border p-3 ${CONDITION_BG[cuaca.condition]}`}
          >
            <WeatherIcon condition={cuaca.condition} />
            <div className="min-w-0">
              <p className="text-lg font-bold text-gray-900">{CONDITION_LABEL[cuaca.condition]}</p>
              {cuaca.temp_min !== null && cuaca.temp_max !== null && (
                <p className="text-xs text-gray-500">
                  {cuaca.temp_min}° – {cuaca.temp_max}°C
                  {cuaca.precipitation !== null && cuaca.precipitation > 0 && (
                    <span className="text-blue-500"> · {cuaca.precipitation}mm</span>
                  )}
                </p>
              )}
              <p className="mt-0.5 truncate text-[11px] text-gray-400">{cuaca.district}</p>
            </div>
          </div>
        ) : (
          <NoWeatherState />
        )}
      </div>

      {/* ── Event Terdekat ── */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Event Terdekat
        </h3>
        <EventList events={events} />
      </div>
    </div>
  );
}
