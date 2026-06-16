import { useEffect, useRef, useState } from 'react';
import type { CalendarEvent, EventPayload, EventType } from './types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DialogMode =
  | { kind: 'create'; prefillDate?: string }
  | { kind: 'edit'; event: CalendarEvent };

interface Props {
  mode: DialogMode;
  onClose: () => void;
  onSubmit: (payload: EventPayload) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
  isSubmitting: boolean;
  isDeleting: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_OPTIONS: { value: EventType; label: string }[] = [
  { value: 'promo', label: 'Promo' },
  { value: 'libur', label: 'Hari Libur / Tutup' },
  { value: 'lainnya', label: 'Lainnya' },
];

// ─── EventDialog ──────────────────────────────────────────────────────────────

export default function EventDialog({
  mode,
  onClose,
  onSubmit,
  onDelete,
  isSubmitting,
  isDeleting,
}: Props) {
  const isEdit = mode.kind === 'edit';
  const existing = isEdit ? mode.event : null;

  const [name, setName] = useState(existing?.name ?? '');
  const [startDate, setStartDate] = useState(
    existing?.start_date ?? (mode.kind === 'create' ? (mode.prefillDate ?? '') : '')
  );
  const [endDate, setEndDate] = useState(existing?.end_date ?? '');
  const [type, setType] = useState<EventType>(existing?.type ?? 'lainnya');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFocusRef = useRef<HTMLInputElement>(null);

  // Focus first field on open, trap focus, close on Escape
  useEffect(() => {
    firstFocusRef.current?.focus();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key !== 'Tab' || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey ? document.activeElement === first : document.activeElement === last) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  function validate(): boolean {
    const next: typeof errors = {};
    if (!name.trim()) next.name = 'Nama acara wajib diisi.';
    else if (name.trim().length > 100) next.name = 'Maksimal 100 karakter.';
    if (!startDate) next.start_date = 'Tanggal mulai wajib diisi.';
    if (endDate && startDate && endDate < startDate)
      next.end_date = 'Tanggal selesai harus sesudah tanggal mulai.';
    if (description.length > 500) next.description = 'Maksimal 500 karakter.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit({
      name: name.trim(),
      description: description.trim() || null,
      start_date: startDate,
      end_date: endDate || null,
      type,
    });
  }

  async function handleDelete() {
    if (!existing || !onDelete) return;
    await onDelete(existing.id);
  }

  const title = isEdit ? 'Edit Acara' : 'Tambah Acara';

  return (
    // Overlay
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-dialog-title"
        className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 id="event-dialog-title" className="text-base font-semibold text-gray-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-label="Tutup dialog"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Confirm delete */}
        {confirmDelete ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              Hapus acara <span className="font-semibold">"{existing?.name}"</span>? Tindakan ini
              tidak bisa dibatalkan.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={isDeleting}
                className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                {isDeleting ? 'Menghapus…' : 'Hapus'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)} noValidate className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="ev-name" className="block text-xs font-medium text-gray-700 mb-1">
                Nama Acara{' '}
                <span className="text-red-500" aria-hidden="true">
                  *
                </span>
              </label>
              <input
                ref={firstFocusRef}
                id="ev-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="cth. Promo Lebaran, Tutup Toko"
                maxLength={100}
                aria-required="true"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'ev-name-err' : undefined}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              {errors.name && (
                <p id="ev-name-err" role="alert" className="mt-1 text-xs text-red-600">
                  {errors.name}
                </p>
              )}
            </div>

            {/* Type */}
            <div>
              <label htmlFor="ev-type" className="block text-xs font-medium text-gray-700 mb-1">
                Kategori{' '}
                <span className="text-red-500" aria-hidden="true">
                  *
                </span>
              </label>
              <select
                id="ev-type"
                value={type}
                onChange={(e) => setType(e.target.value as EventType)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
              >
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="ev-start" className="block text-xs font-medium text-gray-700 mb-1">
                  Tanggal Mulai{' '}
                  <span className="text-red-500" aria-hidden="true">
                    *
                  </span>
                </label>
                <input
                  id="ev-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  aria-required="true"
                  aria-invalid={!!errors.start_date}
                  aria-describedby={errors.start_date ? 'ev-start-err' : undefined}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                {errors.start_date && (
                  <p id="ev-start-err" role="alert" className="mt-1 text-xs text-red-600">
                    {errors.start_date}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="ev-end" className="block text-xs font-medium text-gray-700 mb-1">
                  Tanggal Selesai
                </label>
                <input
                  id="ev-end"
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(e) => setEndDate(e.target.value)}
                  aria-invalid={!!errors.end_date}
                  aria-describedby={errors.end_date ? 'ev-end-err' : undefined}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                {errors.end_date && (
                  <p id="ev-end-err" role="alert" className="mt-1 text-xs text-red-600">
                    {errors.end_date}
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="ev-desc" className="block text-xs font-medium text-gray-700 mb-1">
                Deskripsi <span className="font-normal text-gray-400">(opsional)</span>
              </label>
              <textarea
                id="ev-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                maxLength={500}
                placeholder="Tambahkan catatan…"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
              />
              {errors.description && (
                <p role="alert" className="mt-1 text-xs text-red-600">
                  {errors.description}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-1">
              {isEdit && (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="mr-auto rounded-lg px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                >
                  Hapus
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                {isSubmitting ? 'Menyimpan…' : isEdit ? 'Simpan' : 'Tambah'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
