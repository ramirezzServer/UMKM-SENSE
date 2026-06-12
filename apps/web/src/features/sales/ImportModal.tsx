import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import Button from '@/components/ui/Button';
import { SALES_KEYS } from './hooks';
import { confirmImport, downloadTemplate, extractImportError, previewImport } from './api';
import type { ImportConfirmResponse, ImportPreviewResponse } from './types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (d: string) => {
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
};

const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

const validateFile = (f: File): string | null => {
  const ext = f.name.split('.').pop()?.toLowerCase() ?? '';
  if (!['csv', 'xlsx'].includes(ext)) {
    return 'File harus berformat CSV (.csv) atau Excel (.xlsx).';
  }
  if (f.size > 5 * 1024 * 1024) {
    return 'Ukuran file terlalu besar (maks 5 MB).';
  }
  return null;
};

// ─── Step indicator ───────────────────────────────────────────────────────────

const STEP_LABELS = ['Upload', 'Preview', 'Selesai'];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="mb-6 flex items-center justify-center">
      {STEP_LABELS.map((label, i) => (
        <div key={i} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all ${
                i < current
                  ? 'bg-indigo-600 text-white'
                  : i === current
                    ? 'bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500'
                    : 'bg-gray-100 text-gray-400'
              }`}
            >
              {i < current ? (
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : (
                i + 1
              )}
            </div>
            <span
              className={`text-xs ${i === current ? 'font-medium text-indigo-700' : 'text-gray-400'}`}
            >
              {label}
            </span>
          </div>
          {i < STEP_LABELS.length - 1 && (
            <div
              className={`mx-2 mb-5 h-0.5 w-14 transition-colors ${i < current ? 'bg-indigo-600' : 'bg-gray-200'}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Animation variants ───────────────────────────────────────────────────────

const slideVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 28 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir * -28 }),
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

type Step = 'upload' | 'preview' | 'done';
const STEP_INDEX: Record<Step, number> = { upload: 0, preview: 1, done: 2 };

export default function ImportModal({ isOpen, onClose }: Props) {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('upload');
  const [direction, setDirection] = useState(1);

  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const [previewData, setPreviewData] = useState<ImportPreviewResponse | null>(null);
  const [importResult, setImportResult] = useState<ImportConfirmResponse | null>(null);

  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const isAnyLoading = isPreviewLoading || isConfirmLoading;

  // Reset when opened
  useEffect(() => {
    if (!isOpen) return;
    setStep('upload');
    setDirection(1);
    setFile(null);
    setIsDragging(false);
    setFileError(null);
    setApiError(null);
    setPreviewData(null);
    setImportResult(null);
    setIsPreviewLoading(false);
    setIsConfirmLoading(false);
  }, [isOpen]);

  // Esc to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isAnyLoading) onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, isAnyLoading, onClose]);

  const goTo = (next: Step, dir: 1 | -1) => {
    setDirection(dir);
    setApiError(null);
    setStep(next);
  };

  const handleFileSelect = (f: File) => {
    const err = validateFile(f);
    if (err) {
      setFileError(err);
      return;
    }
    setFile(f);
    setFileError(null);
  };

  const handleDownloadTemplate = async () => {
    setIsDownloading(true);
    try {
      await downloadTemplate();
    } catch {
      setApiError('Gagal mengunduh template. Silakan coba lagi.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePreview = async () => {
    if (!file) return;
    setIsPreviewLoading(true);
    setApiError(null);
    try {
      const result = await previewImport(file);
      setPreviewData(result);
      goTo('preview', 1);
    } catch (err) {
      setApiError(extractImportError(err));
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!previewData) return;
    setIsConfirmLoading(true);
    setApiError(null);
    try {
      const result = await confirmImport(previewData.preview_token);
      setImportResult(result);
      qc.invalidateQueries({ queryKey: SALES_KEYS.all });
      goTo('done', 1);
    } catch (err) {
      setApiError(extractImportError(err));
    } finally {
      setIsConfirmLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="import-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={!isAnyLoading ? onClose : undefined}
            aria-hidden="true"
          />

          <motion.div
            key="import-panel"
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.15 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="import-title"
            className="relative z-10 max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 id="import-title" className="text-lg font-semibold text-gray-900">
                Import CSV / Excel
              </h2>
              <button
                type="button"
                onClick={onClose}
                disabled={isAnyLoading}
                aria-label="Tutup"
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-40"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              <StepIndicator current={STEP_INDEX[step]} />

              {/* API error banner */}
              {apiError && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {apiError}
                </div>
              )}

              <AnimatePresence mode="wait" custom={direction}>
                {/* ── Step: upload ── */}
                {step === 'upload' && (
                  <motion.div
                    key="upload"
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.2 }}
                  >
                    {/* Download template card */}
                    <div className="mb-5 rounded-xl bg-indigo-50 px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          <svg
                            className="h-5 w-5 text-indigo-500"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={1.8}
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                            />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-indigo-900">Butuh template?</p>
                          <p className="text-xs text-indigo-700">
                            Download contoh format CSV yang benar.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleDownloadTemplate}
                          disabled={isDownloading}
                          className="flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-medium text-indigo-700 transition-colors hover:bg-indigo-100 disabled:opacity-50"
                        >
                          {isDownloading ? (
                            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                          ) : (
                            <svg
                              className="h-3.5 w-3.5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2}
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                              />
                            </svg>
                          )}
                          Download
                        </button>
                      </div>
                    </div>

                    {/* Drag-and-drop zone */}
                    <div
                      role="button"
                      tabIndex={0}
                      aria-label="Pilih atau drop file CSV/Excel"
                      onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        const f = e.dataTransfer.files[0];
                        if (f) handleFileSelect(f);
                      }}
                      onClick={() => fileInputRef.current?.click()}
                      className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
                        isDragging
                          ? 'border-indigo-400 bg-indigo-50'
                          : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-white'
                      }`}
                    >
                      {file ? (
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                            <svg
                              className="h-5 w-5 text-emerald-600"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2}
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </div>
                          <p className="max-w-full truncate font-medium text-gray-900">
                            {file.name}
                          </p>
                          <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                          <p className="text-xs text-indigo-500">Klik untuk ganti file</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
                            <svg
                              className="h-5 w-5 text-gray-500"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={1.8}
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                              />
                            </svg>
                          </div>
                          <p className="font-medium text-gray-700">Drag &amp; drop file di sini</p>
                          <p className="text-sm text-gray-500">atau klik untuk pilih file</p>
                          <p className="mt-1 text-xs text-gray-400">
                            CSV atau Excel (.xlsx) · Maks 5 MB · Maks 1.000 baris
                          </p>
                        </div>
                      )}
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.xlsx"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFileSelect(f);
                        e.target.value = '';
                      }}
                    />

                    {fileError && <p className="mt-2 text-sm text-red-600">{fileError}</p>}

                    {/* Footer buttons */}
                    <div className="mt-5 flex justify-end gap-3">
                      <Button type="button" variant="ghost" onClick={onClose}>
                        Batal
                      </Button>
                      <Button
                        type="button"
                        onClick={handlePreview}
                        disabled={!file || !!fileError}
                        loading={isPreviewLoading}
                      >
                        {isPreviewLoading ? 'Memproses...' : 'Lanjut: Preview'}
                        {!isPreviewLoading && (
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M8.25 4.5l7.5 7.5-7.5 7.5"
                            />
                          </svg>
                        )}
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* ── Step: preview ── */}
                {step === 'preview' && previewData && (
                  <motion.div
                    key="preview"
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.2 }}
                  >
                    {/* Summary cards */}
                    <div className="mb-4 grid grid-cols-3 gap-3">
                      <div className="rounded-xl bg-gray-50 p-3 text-center">
                        <p className="text-2xl font-bold text-gray-800">
                          {previewData.summary.total}
                        </p>
                        <p className="text-xs text-gray-500">Total Baris</p>
                      </div>
                      <div className="rounded-xl bg-emerald-50 p-3 text-center">
                        <p className="text-2xl font-bold text-emerald-700">
                          {previewData.summary.valid}
                        </p>
                        <p className="text-xs text-emerald-600">Baris Valid</p>
                      </div>
                      <div className="rounded-xl bg-red-50 p-3 text-center">
                        <p className="text-2xl font-bold text-red-700">
                          {previewData.summary.invalid}
                        </p>
                        <p className="text-xs text-red-500">Baris Gagal</p>
                      </div>
                    </div>

                    {/* Warnings */}
                    {previewData.warnings.length > 0 && (
                      <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
                        <p className="mb-1.5 text-sm font-medium text-amber-800">
                          {previewData.warnings.length} kemungkinan duplikat
                        </p>
                        <div className="max-h-24 space-y-0.5 overflow-y-auto">
                          {previewData.warnings.map((w) => (
                            <p key={w.row} className="text-xs text-amber-700">
                              <span className="font-semibold">Baris {w.row}:</span> {w.message}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Errors */}
                    {previewData.errors.length > 0 && (
                      <div className="mb-4">
                        <p className="mb-1.5 text-sm font-semibold text-red-700">
                          {previewData.errors.length} baris gagal:
                        </p>
                        <div className="max-h-40 space-y-1 overflow-y-auto rounded-xl border border-red-100 bg-red-50 p-3">
                          {previewData.errors.map((err) => (
                            <p key={err.row} className="text-xs text-red-700">
                              <span className="font-semibold">Baris {err.row}:</span>{' '}
                              {err.errors.join(' · ')}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Preview table */}
                    {previewData.preview.length > 0 && (
                      <div className="mb-4">
                        <p className="mb-1.5 text-sm font-semibold text-gray-700">
                          Preview {previewData.preview.length} baris valid pertama:
                        </p>
                        <div className="overflow-x-auto rounded-xl border border-gray-200">
                          <table className="w-full text-xs">
                            <thead className="bg-gray-50 text-gray-500">
                              <tr>
                                <th className="px-2 py-2 text-left font-medium">#</th>
                                <th className="px-2 py-2 text-left font-medium">Tanggal</th>
                                <th className="px-2 py-2 text-left font-medium">Produk</th>
                                <th className="px-2 py-2 text-center font-medium">Qty</th>
                                <th className="px-2 py-2 text-left font-medium">Metode</th>
                                <th className="px-2 py-2 text-left font-medium">Pelanggan</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {previewData.preview.map((row) => (
                                <tr key={row.row_number} className="hover:bg-gray-50">
                                  <td className="px-2 py-2 text-gray-400">{row.row_number}</td>
                                  <td className="px-2 py-2 text-gray-700">
                                    {formatDate(row.transaction_date)}
                                  </td>
                                  <td className="max-w-[110px] truncate px-2 py-2 font-medium text-gray-900">
                                    {capitalize(row.product_name_lower)}
                                  </td>
                                  <td className="px-2 py-2 text-center text-gray-700">{row.qty}</td>
                                  <td className="px-2 py-2 text-gray-700">{row.payment_method}</td>
                                  <td className="px-2 py-2 text-gray-700">
                                    {row.customer_name || '—'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Footer buttons */}
                    <div className="mt-5 flex justify-between gap-3">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => goTo('upload', -1)}
                        disabled={isConfirmLoading}
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.75 19.5L8.25 12l7.5-7.5"
                          />
                        </svg>
                        Kembali
                      </Button>
                      <Button
                        type="button"
                        onClick={handleConfirm}
                        disabled={previewData.summary.valid === 0}
                        loading={isConfirmLoading}
                      >
                        {isConfirmLoading
                          ? 'Mengimpor...'
                          : `Import ${previewData.summary.valid} baris valid`}
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* ── Step: done ── */}
                {step === 'done' && importResult && (
                  <motion.div
                    key="done"
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex flex-col items-center py-4 text-center">
                      {importResult.imported > 0 ? (
                        <>
                          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                            <svg
                              className="h-8 w-8 text-emerald-600"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2}
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">Import Berhasil!</h3>
                          <p className="mt-1 text-gray-600">
                            <span className="font-semibold text-emerald-700">
                              {importResult.imported}
                            </span>{' '}
                            transaksi berhasil diimpor.
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
                            <svg
                              className="h-8 w-8 text-amber-600"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2}
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                              />
                            </svg>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">Import Selesai</h3>
                          <p className="mt-1 text-gray-600">
                            Tidak ada transaksi yang berhasil diimpor.
                          </p>
                        </>
                      )}

                      {importResult.skipped.length > 0 && (
                        <div className="mt-4 w-full rounded-xl border border-amber-200 bg-amber-50 p-3 text-left">
                          <p className="mb-1.5 text-sm font-medium text-amber-800">
                            {importResult.skipped.length} baris dilewati:
                          </p>
                          <div className="max-h-28 space-y-0.5 overflow-y-auto">
                            {importResult.skipped.map((s) => (
                              <p key={s.row} className="text-xs text-amber-700">
                                <span className="font-semibold">Baris {s.row}:</span> {s.reason}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-5 flex justify-end">
                      <Button type="button" onClick={onClose}>
                        Selesai
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
