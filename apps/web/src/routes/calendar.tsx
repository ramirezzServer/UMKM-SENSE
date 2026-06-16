import { useState } from 'react';
import type { DialogMode } from '@/features/calendar/EventDialog';
import EventDialog from '@/features/calendar/EventDialog';
import type { CalendarEvent } from '@/features/calendar/types';
import {
  useCalendar,
  useCreateEvent,
  useDeleteEvent,
  useUpdateEvent,
} from '@/features/calendar/hooks';

// ─── Date helpers (no external date library) ──────────────────────────────────

function toYYYYMM(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

function toYYYYMMDD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function todayStr(): string {
  return toYYYYMMDD(new Date());
}

/** Days in a given month (1-indexed month). */
function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** Day-of-week index, Mon=0 … Sun=6 */
function dayOfWeekMon0(year: number, month: number, day: number): number {
  const dow = new Date(year, month - 1, day).getDay(); // 0=Sun
  return dow === 0 ? 6 : dow - 1;
}

function formatMonthLabel(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleString('id-ID', { month: 'long', year: 'numeric' });
}

function formatDayLabel(year: number, month: number, day: number): string {
  return new Date(year, month - 1, day).toLocaleString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function formatDateRange(start: string, end: string | null): string {
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
  const fmt = (s: string) => new Date(s + 'T00:00:00').toLocaleDateString('id-ID', opts);
  if (!end || end === start) return fmt(start);
  return `${fmt(start)} – ${fmt(end)}`;
}

function addMonth(year: number, month: number, delta: number): [number, number] {
  let m = month + delta;
  let y = year;
  while (m > 12) {
    m -= 12;
    y++;
  }
  while (m < 1) {
    m += 12;
    y--;
  }
  return [y, m];
}

function eventSpansDay(ev: CalendarEvent, dayStr: string): boolean {
  if (ev.start_date > dayStr) return false;
  if (ev.end_date == null) return ev.start_date === dayStr;
  return ev.end_date >= dayStr;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_LABELS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

const TYPE_COLORS: Record<string, string> = {
  promo: 'bg-amber-100 text-amber-800',
  libur: 'bg-red-100 text-red-700',
  lainnya: 'bg-indigo-100 text-indigo-800',
};

function typeLabel(type: string): string {
  if (type === 'promo') return 'Promo';
  if (type === 'libur') return 'Tutup';
  return 'Lainnya';
}

function typeDot(type: string): string {
  if (type === 'promo') return 'bg-amber-400';
  if (type === 'libur') return 'bg-red-400';
  return 'bg-indigo-400';
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CalendarSkeleton() {
  return (
    <div className="animate-pulse space-y-1" aria-hidden="true">
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="h-20 rounded-lg bg-gray-100" />
        ))}
      </div>
    </div>
  );
}

// ─── CalendarPage ─────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-indexed
  const monthKey = toYYYYMM(year, month);

  const { data, isLoading, isError } = useCalendar(monthKey);

  const createMut = useCreateEvent(monthKey);
  const updateMut = useUpdateEvent(monthKey);
  const deleteMut = useDeleteEvent(monthKey);

  const [dialog, setDialog] = useState<DialogMode | null>(null);

  function closeDialog() {
    setDialog(null);
    createMut.reset();
    updateMut.reset();
    deleteMut.reset();
  }

  async function handleSubmit(payload: Parameters<typeof createMut.mutateAsync>[0]) {
    if (dialog?.kind === 'edit') {
      await updateMut.mutateAsync({ id: dialog.event.id, payload });
    } else {
      await createMut.mutateAsync(payload);
    }
    closeDialog();
  }

  async function handleDelete(id: number) {
    await deleteMut.mutateAsync(id);
    closeDialog();
  }

  function prevMonth() {
    const [y, m] = addMonth(year, month, -1);
    setYear(y);
    setMonth(m);
  }
  function nextMonth() {
    const [y, m] = addMonth(year, month, 1);
    setYear(y);
    setMonth(m);
  }

  const totalDays = daysInMonth(year, month);
  const leadingBlanks = dayOfWeekMon0(year, month, 1);
  const today = todayStr();

  const holidays = data?.holidays ?? [];
  const events = data?.events ?? [];

  const monthLabel = formatMonthLabel(year, month);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      {/* Page header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Kalender Event</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Catat promo, hari tutup, dan acara penting bisnis Anda.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDialog({ kind: 'create' })}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 self-start sm:self-auto"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Tambah Event
        </button>
      </div>

      {/* Month navigator */}
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={prevMonth}
          aria-label="Bulan sebelumnya"
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h2 className="text-base font-semibold capitalize text-gray-900">{monthLabel}</h2>
        <button
          type="button"
          onClick={nextMonth}
          aria-label="Bulan berikutnya"
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      {/* Legend */}
      <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
        {[
          { color: 'bg-red-200', label: 'Hari Libur Nasional' },
          { color: 'bg-amber-100 border border-amber-200', label: 'Promo' },
          { color: 'bg-red-100 border border-red-200', label: 'Libur / Tutup' },
          { color: 'bg-indigo-100 border border-indigo-200', label: 'Lainnya' },
        ].map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 flex-shrink-0 rounded-sm ${color}`} />
            <span className="text-gray-600">{label}</span>
          </span>
        ))}
      </div>

      {/* Error */}
      {isError && (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          Gagal memuat kalender. Periksa koneksi dan coba lagi.
        </div>
      )}

      {/* ── GRID CALENDAR (md+) ─────────────────────────────────────────── */}
      <div className="hidden md:block">
        <div className="mb-1 grid grid-cols-7 gap-1">
          {DAY_LABELS.map((d) => (
            <div
              key={d}
              className="py-1 text-center text-xs font-medium uppercase tracking-wide text-gray-400"
            >
              {d}
            </div>
          ))}
        </div>

        {isLoading ? (
          <CalendarSkeleton />
        ) : (
          <div className="grid grid-cols-7 gap-1" aria-label={`Kalender ${monthLabel}`}>
            {Array.from({ length: leadingBlanks }).map((_, i) => (
              <div
                key={`b${i}`}
                aria-hidden="true"
                className="min-h-[5rem] rounded-lg bg-gray-50/50"
              />
            ))}

            {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => {
              const dayStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayHolidays = holidays.filter((h) => h.date === dayStr);
              const dayEvents = events.filter((ev) => eventSpansDay(ev, dayStr));
              const isToday = dayStr === today;

              return (
                <div
                  key={dayStr}
                  aria-label={`${day} — ${dayStr}`}
                  className={[
                    'group min-h-[5rem] cursor-pointer rounded-lg border p-1.5 transition-colors',
                    isToday
                      ? 'border-indigo-400 bg-indigo-50/60'
                      : 'border-gray-100 bg-white hover:bg-gray-50',
                  ].join(' ')}
                  onClick={() => setDialog({ kind: 'create', prefillDate: dayStr })}
                >
                  <div className="mb-1">
                    <span
                      className={[
                        'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold',
                        isToday ? 'bg-indigo-600 text-white' : 'text-gray-700',
                      ].join(' ')}
                    >
                      {day}
                    </span>
                  </div>

                  {dayHolidays.map((h) => (
                    <div
                      key={h.name}
                      title={h.name}
                      onClick={(e) => e.stopPropagation()}
                      className="mb-0.5 truncate rounded px-1 py-0.5 text-[10px] font-medium bg-red-200 text-red-800 cursor-default"
                    >
                      {h.name}
                    </div>
                  ))}

                  {dayEvents.slice(0, 2).map((ev) => (
                    <div
                      key={ev.id}
                      title={ev.name}
                      onClick={(e) => {
                        e.stopPropagation();
                        setDialog({ kind: 'edit', event: ev });
                      }}
                      className={[
                        'mb-0.5 truncate rounded px-1 py-0.5 text-[10px] font-medium cursor-pointer hover:opacity-80 transition-opacity',
                        TYPE_COLORS[ev.type] ?? TYPE_COLORS.lainnya,
                      ].join(' ')}
                    >
                      {ev.name}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-[10px] text-gray-400">+{dayEvents.length - 2} lainnya</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── MOBILE LIST (< md) ──────────────────────────────────────────── */}
      <div className="md:hidden">
        {isLoading ? (
          <div className="space-y-2 animate-pulse" aria-hidden="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-gray-100" />
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => {
              const dayStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayHolidays = holidays.filter((h) => h.date === dayStr);
              const dayEvents = events.filter((ev) => eventSpansDay(ev, dayStr));
              if (dayHolidays.length === 0 && dayEvents.length === 0) return null;
              const isToday = dayStr === today;
              return (
                <div key={dayStr} className="rounded-xl border border-gray-100 bg-white p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className={[
                        'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold',
                        isToday ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700',
                      ].join(' ')}
                    >
                      {day}
                    </span>
                    <span className="text-xs font-medium text-gray-500 capitalize">
                      {formatDayLabel(year, month, day)}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {dayHolidays.map((h) => (
                      <div key={h.name} className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 flex-shrink-0 rounded-full bg-red-400"
                          aria-hidden="true"
                        />
                        <span className="text-xs text-red-700">{h.name}</span>
                        <span className="ml-auto text-[10px] text-gray-400">Libur Nasional</span>
                      </div>
                    ))}
                    {dayEvents.map((ev) => (
                      <button
                        key={ev.id}
                        type="button"
                        onClick={() => setDialog({ kind: 'edit', event: ev })}
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-1 hover:bg-gray-50 transition-colors text-left"
                      >
                        <span
                          className={`h-2 w-2 flex-shrink-0 rounded-full ${typeDot(ev.type)}`}
                          aria-hidden="true"
                        />
                        <span className="flex-1 truncate text-xs text-gray-800">{ev.name}</span>
                        <span className="text-[10px] text-gray-400">{typeLabel(ev.type)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}

            {events.length === 0 && holidays.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-sm text-gray-400 mb-2">Belum ada acara di bulan ini.</p>
                <button
                  type="button"
                  onClick={() => setDialog({ kind: 'create' })}
                  className="text-sm font-medium text-indigo-600 hover:underline"
                >
                  + Tambah Event
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── EVENT LIST BELOW GRID ─────────────────────────────────────────── */}
      {!isLoading && events.length > 0 && (
        <div className="mt-6 hidden md:block">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Acara Bulan Ini
          </h3>
          <ul className="space-y-0.5" aria-label="Daftar acara">
            {events.map((ev) => (
              <li key={ev.id}>
                <button
                  type="button"
                  onClick={() => setDialog({ kind: 'edit', event: ev })}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-gray-50 transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  <span
                    className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${typeDot(ev.type)}`}
                    aria-hidden="true"
                  />
                  <span className="flex-1 min-w-0">
                    <span className="block truncate text-sm font-medium text-gray-800 group-hover:text-indigo-700">
                      {ev.name}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDateRange(ev.start_date, ev.end_date)}
                    </span>
                  </span>
                  <span
                    className={[
                      'rounded-full px-2 py-0.5 text-[10px] font-medium',
                      TYPE_COLORS[ev.type] ?? TYPE_COLORS.lainnya,
                    ].join(' ')}
                  >
                    {typeLabel(ev.type)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── DIALOG ──────────────────────────────────────────────────────── */}
      {dialog && (
        <EventDialog
          mode={dialog}
          onClose={closeDialog}
          onSubmit={(p) => handleSubmit(p)}
          onDelete={dialog.kind === 'edit' ? handleDelete : undefined}
          isSubmitting={createMut.isPending || updateMut.isPending}
          isDeleting={deleteMut.isPending}
        />
      )}
    </div>
  );
}
