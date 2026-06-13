import { useConditions } from './hooks';
import type { WeatherCondition } from './types';

// ─── Weather icons (minimal SVG) ──────────────────────────────────────────────

function WeatherIcon({ condition }: { condition: WeatherCondition['condition'] }) {
  switch (condition) {
    case 'clear':
      return (
        <svg className="h-8 w-8 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="5" />
          <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </g>
        </svg>
      );
    case 'rainy':
      return (
        <svg
          className="h-8 w-8 text-blue-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
        >
          <path d="M20 17.58A5 5 0 0018 8h-1.26A8 8 0 104 15.25" strokeLinecap="round" />
          <line x1="8" y1="19" x2="8" y2="21" strokeLinecap="round" />
          <line x1="8" y1="13" x2="8" y2="15" strokeLinecap="round" />
          <line x1="16" y1="19" x2="16" y2="21" strokeLinecap="round" />
          <line x1="16" y1="13" x2="16" y2="15" strokeLinecap="round" />
          <line x1="12" y1="21" x2="12" y2="23" strokeLinecap="round" />
          <line x1="12" y1="15" x2="12" y2="17" strokeLinecap="round" />
        </svg>
      );
    case 'stormy':
      return (
        <svg
          className="h-8 w-8 text-purple-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
        >
          <path d="M19 16.9A5 5 0 0018 7h-1.26a8 8 0 10-11.62 9" strokeLinecap="round" />
          <polyline points="13 11 9 17 15 17 11 23" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default: // cloudy
      return (
        <svg
          className="h-8 w-8 text-gray-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
        >
          <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" strokeLinecap="round" />
        </svg>
      );
  }
}

const CONDITION_LABEL: Record<WeatherCondition['condition'], string> = {
  clear: 'Cerah',
  cloudy: 'Berawan',
  rainy: 'Hujan',
  stormy: 'Badai',
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ConditionsSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 h-5 w-32 rounded bg-gray-200" />
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-full bg-gray-200" />
        <div>
          <div className="h-5 w-20 rounded bg-gray-200" />
          <div className="mt-1.5 h-3 w-28 rounded bg-gray-200" />
        </div>
      </div>
      <div className="mt-5 space-y-2">
        {[0, 1].map((i) => (
          <div key={i} className="h-4 w-full rounded bg-gray-200" />
        ))}
      </div>
    </div>
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
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-700">Kondisi Hari Ini</h2>

      {/* Weather */}
      {cuaca ? (
        <div className="mt-4 flex items-center gap-4">
          <WeatherIcon condition={cuaca.condition} />
          <div>
            <p className="text-lg font-semibold text-gray-900">
              {CONDITION_LABEL[cuaca.condition]}
            </p>
            {cuaca.temp_min !== null && cuaca.temp_max !== null && (
              <p className="text-xs text-gray-400">
                {cuaca.temp_min}° — {cuaca.temp_max}°C
                {cuaca.precipitation !== null && cuaca.precipitation > 0
                  ? ` · Hujan ${cuaca.precipitation}mm`
                  : ''}
              </p>
            )}
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-gray-400">Data cuaca tidak tersedia.</p>
      )}

      {/* Upcoming events */}
      <div className="mt-5">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
          Event 7 Hari Ke Depan
        </p>
        {events.length === 0 ? (
          <p className="mt-2 text-sm text-gray-400">Tidak ada hari libur nasional.</p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {events.map((ev) => (
              <li key={ev.date} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 flex-shrink-0 text-indigo-400">•</span>
                <span>
                  <span className="font-medium text-gray-800">{ev.name}</span>
                  <span className="ml-1.5 text-xs text-gray-400">
                    {new Date(ev.date).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
