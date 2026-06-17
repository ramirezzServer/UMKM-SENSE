import { useState } from 'react';
import { motion } from 'framer-motion';
import type { DialogMode } from '@/features/calendar/EventDialog';
import EventDialog from '@/features/calendar/EventDialog';
import type { CalendarEvent } from '@/features/calendar/types';
import {
  useCalendar,
  useCreateEvent,
  useDeleteEvent,
  useUpdateEvent,
} from '@/features/calendar/hooks';
import { stagger, staggerItem } from '@/lib/motion';

// ─── Date helpers ─────────────────────────────────────────────────────────────

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

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function dayOfWeekMon0(year: number, month: number, day: number): number {
  const dow = new Date(year, month - 1, day).getDay();
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
  promo: 'bg-primary-100 text-primary-800',
  libur: 'bg-danger-100 text-danger-700',
  lainnya: 'bg-accent-100 text-accent-800',
};

function typeLabel(type: string): string {
  if (type === 'promo') return 'Promo';
  if (type === 'libur') return 'Tutup';
  return 'Lainnya';
}

function typeDot(type: string): string {
  if (type === 'promo') return 'bg-primary-400';
  if (type === 'libur') return 'bg-danger-400';
  return 'bg-accent-400';
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CalendarSkeleton() {
  return (
    <div className="animate-pulse space-y-1" aria-hidden="true">
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="h-20 rounded-lg bg-warm-100" />
        ))}
      </div>
    </div>
  );
}

// ─── CalendarPage ─────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
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
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="visible"
      className="mx-auto max-w-5xl space-y-5"
    >
      {/* Page header */}
      <motion.div
        variants={staggerItem}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="font-display text-2xl font-bold text-warm-900">Kalender Event</h1>
          <p className="mt-0.5 text-sm text-warm-500">
            Catat promo, hari tutup, dan acara penting bisnis Anda.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDialog({ kind: 'create' })}
          className="inline-flex items-center gap-1.5 self-start rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-warm-sm transition-colors hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 sm:self-auto"
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
      </motion.div>

      {/* Month navigator */}
      <motion.div variants={staggerItem} className="flex items-center justify-between">
        <button
          type="button"
          onClick={prevMonth}
          aria-label="Bulan sebelumnya"
          className="rounded-lg p-2 text-warm-500 transition-colors hover:bg-warm-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
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
        <h2 className="font-display text-base font-semibold capitalize text-warm-900">
          {monthLabel}
        </h2>
        <button
          type="button"
          onClick={nextMonth}
          aria-label="Bulan berikutnya"
          className="rounded-lg p-2 text-warm-500 transition-colors hover:bg-warm-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
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
      </motion.div>

      {/* Legend */}
      <motion.div variants={staggerItem} className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
        {[
          { color: 'bg-danger-200', label: 'Hari Libur Nasional' },
          { color: 'bg-primary-100 border border-primary-200', label: 'Promo' },
          { color: 'bg-danger-100 border border-danger-200', label: 'Libur / Tutup' },
          { color: 'bg-accent-100 border border-accent-200', label: 'Lainnya' },
        ].map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 flex-shrink-0 rounded-sm ${color}`} />
            <span className="text-warm-600">{label}</span>
          </span>
        ))}
      </motion.div>

      {/* Error */}
      {isError && (
        <div
          role="alert"
          className="rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700"
        >
          Gagal memuat kalender. Periksa koneksi dan coba lagi.
        </div>
      )}

      {/* ── GRID CALENDAR (md+) ─────────────────────────────────────────── */}
      <motion.div variants={staggerItem} className="hidden md:block">
        <div className="mb-1 grid grid-cols-7 gap-1">
          {DAY_LABELS.map((d) => (
            <div
              key={d}
              className="py-1 text-center text-xs font-medium uppercase tracking-wide text-warm-400"
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
                className="min-h-[5rem] rounded-lg bg-warm-50/60"
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
                      ? 'border-primary-300 bg-primary-50/60'
                      : 'border-warm-100 bg-white/70 hover:bg-warm-50/80',
                  ].join(' ')}
                  onClick={() => setDialog({ kind: 'create', prefillDate: dayStr })}
                >
                  <div className="mb-1">
                    <span
                      className={[
                        'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold',
                        isToday ? 'bg-primary-600 text-white' : 'text-warm-700',
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
                      className="mb-0.5 truncate rounded px-1 py-0.5 text-[10px] font-medium bg-danger-200 text-danger-800 cursor-default"
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
                    <div className="text-[10px] text-warm-400">+{dayEvents.length - 2} lainnya</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* ── MOBILE LIST (< md) ──────────────────────────────────────────── */}
      <motion.div variants={staggerItem} className="md:hidden">
        {isLoading ? (
          <div className="animate-pulse space-y-2" aria-hidden="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-warm-100" />
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
                <div key={dayStr} className="rounded-xl border border-warm-100 bg-white/80 p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className={[
                        'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold',
                        isToday ? 'bg-primary-600 text-white' : 'bg-warm-100 text-warm-700',
                      ].join(' ')}
                    >
                      {day}
                    </span>
                    <span className="text-xs font-medium capitalize text-warm-500">
                      {formatDayLabel(year, month, day)}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {dayHolidays.map((h) => (
                      <div key={h.name} className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 flex-shrink-0 rounded-full bg-danger-400"
                          aria-hidden="true"
                        />
                        <span className="text-xs text-danger-700">{h.name}</span>
                        <span className="ml-auto text-[10px] text-warm-400">Libur Nasional</span>
                      </div>
                    ))}
                    {dayEvents.map((ev) => (
                      <button
                        key={ev.id}
                        type="button"
                        onClick={() => setDialog({ kind: 'edit', event: ev })}
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-1 text-left transition-colors hover:bg-warm-50"
                      >
                        <span
                          className={`h-2 w-2 flex-shrink-0 rounded-full ${typeDot(ev.type)}`}
                          aria-hidden="true"
                        />
                        <span className="flex-1 truncate text-xs text-warm-800">{ev.name}</span>
                        <span className="text-[10px] text-warm-400">{typeLabel(ev.type)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}

            {events.length === 0 && holidays.length === 0 && (
              <div className="py-12 text-center">
                <p className="mb-2 text-sm text-warm-400">Belum ada acara di bulan ini.</p>
                <button
                  type="button"
                  onClick={() => setDialog({ kind: 'create' })}
                  className="text-sm font-medium text-primary-600 hover:underline"
                >
                  + Tambah Event
                </button>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* ── EVENT LIST BELOW GRID ─────────────────────────────────────────── */}
      {!isLoading && events.length > 0 && (
        <motion.div variants={staggerItem} className="hidden md:block">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-warm-400">
            Acara Bulan Ini
          </h3>
          <ul className="space-y-0.5" aria-label="Daftar acara">
            {events.map((ev) => (
              <li key={ev.id}>
                <button
                  type="button"
                  onClick={() => setDialog({ kind: 'edit', event: ev })}
                  className="group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-warm-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                >
                  <span
                    className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${typeDot(ev.type)}`}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-warm-800 group-hover:text-primary-700">
                      {ev.name}
                    </span>
                    <span className="text-xs text-warm-400">
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
        </motion.div>
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
    </motion.div>
  );
}
