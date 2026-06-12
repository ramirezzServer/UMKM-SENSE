import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTransactions, useDeleteTransaction } from '@/features/sales/hooks';
import TransactionModal from '@/features/sales/TransactionModal';
import TransactionDetailModal from '@/features/sales/TransactionDetailModal';
import DeleteTransactionDialog from '@/features/sales/DeleteTransactionDialog';
import ImportModal from '@/features/sales/ImportModal';
import Button from '@/components/ui/Button';
import type { Transaction } from '@/features/sales/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatRupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(n);

const formatDate = (d: string) => {
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
};

const STATUS_LABEL: Record<string, string> = {
  success: 'Berhasil',
  pending: 'Pending',
  failed: 'Gagal',
};
const STATUS_CLASS: Record<string, string> = {
  success: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  failed: 'bg-red-100 text-red-700',
};
const PAYMENT_CLASS: Record<string, string> = {
  Cash: 'bg-blue-100 text-blue-700',
  Transfer: 'bg-purple-100 text-purple-700',
  QRIS: 'bg-orange-100 text-orange-700',
};

// ─── Skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {[48, 72, 120, 72, 72, 96].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded bg-gray-200" style={{ width: w }} />
        </td>
      ))}
      <td className="px-4 py-3">
        <div className="h-7 w-16 rounded-lg bg-gray-200" />
      </td>
    </tr>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

interface Toast {
  type: 'success' | 'error';
  message: string;
}

// ─── Main page ────────────────────────────────────────────────────────────────

type StatusFilter = 'success' | 'pending' | 'failed' | '';

export default function SalesPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);
  const [viewTransaction, setViewTransaction] = useState<Transaction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, dateFrom, dateTo]);

  const { data, isPending, isFetching } = useTransactions({
    status: statusFilter,
    date_from: dateFrom,
    date_to: dateTo,
    page,
  });

  const deleteMutation = useDeleteTransaction();

  const showToast = (type: Toast['type'], message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleOpenAdd = () => {
    setEditTransaction(null);
    setShowModal(true);
  };

  const handleOpenEdit = (t: Transaction) => {
    setEditTransaction(t);
    setShowModal(true);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: (res) => {
        setDeleteTarget(null);
        showToast('success', res.message);
      },
      onError: () => {
        setDeleteTarget(null);
        showToast('error', 'Gagal menghapus transaksi. Silakan coba lagi.');
      },
    });
  };

  const transactions = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Penjualan</h1>
          {meta && <p className="mt-0.5 text-sm text-gray-500">{meta.total} transaksi ditemukan</p>}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => setShowImport(true)}>
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
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
            Import CSV
          </Button>
          <Button onClick={handleOpenAdd}>
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Tambah Transaksi
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-wrap gap-3">
        {/* Date from */}
        <div className="flex flex-col gap-1">
          <label htmlFor="date-from" className="text-xs font-medium text-gray-500">
            Dari tanggal
          </label>
          <input
            id="date-from"
            type="date"
            value={dateFrom}
            max={dateTo || undefined}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Date to */}
        <div className="flex flex-col gap-1">
          <label htmlFor="date-to" className="text-xs font-medium text-gray-500">
            Sampai tanggal
          </label>
          <input
            id="date-to"
            type="date"
            value={dateTo}
            min={dateFrom || undefined}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Status */}
        <div className="flex flex-col gap-1">
          <label htmlFor="status-filter" className="text-xs font-medium text-gray-500">
            Status
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-8 text-sm text-gray-700 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Semua Status</option>
            <option value="success">Berhasil</option>
            <option value="pending">Pending</option>
            <option value="failed">Gagal</option>
          </select>
        </div>

        {/* Clear filters */}
        {(dateFrom || dateTo || statusFilter) && (
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => {
                setDateFrom('');
                setDateTo('');
                setStatusFilter('');
              }}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
            >
              Reset filter
            </button>
          </div>
        )}

        {/* Fetching indicator */}
        {isFetching && !isPending && (
          <div className="flex items-end pb-2">
            <span
              aria-hidden="true"
              className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent"
            />
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  #ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Tanggal
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Pelanggan
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Metode
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Total
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isPending ? (
                Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-20 text-center">
                    <div className="flex flex-col items-center">
                      <div className="mb-4 rounded-full bg-gray-100 p-5">
                        <svg
                          className="h-9 w-9 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={1.5}
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185zM9.75 9h.008v.008H9.75V9zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 4.5h.008v.008h-.008V13.5zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                          />
                        </svg>
                      </div>
                      <p className="text-base font-semibold text-gray-900">
                        {dateFrom || dateTo || statusFilter
                          ? 'Transaksi tidak ditemukan'
                          : 'Belum ada transaksi'}
                      </p>
                      <p className="mt-1 max-w-xs text-sm text-gray-500">
                        {dateFrom || dateTo || statusFilter
                          ? 'Coba ubah filter pencarian.'
                          : 'Mulai dengan menambahkan transaksi pertama.'}
                      </p>
                      {!dateFrom && !dateTo && !statusFilter && (
                        <Button onClick={handleOpenAdd} className="mt-4">
                          Tambah Transaksi Pertama
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    onClick={() => setViewTransaction(tx)}
                    className="cursor-pointer transition-colors hover:bg-indigo-50/60"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">#{tx.id}</td>
                    <td className="px-4 py-3 text-gray-700">{formatDate(tx.transaction_date)}</td>
                    <td className="max-w-[140px] truncate px-4 py-3 text-gray-900">
                      {tx.customer_name || <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${PAYMENT_CLASS[tx.payment_method] ?? 'bg-gray-100 text-gray-600'}`}
                      >
                        {tx.payment_method}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASS[tx.status] ?? 'bg-gray-100 text-gray-600'}`}
                      >
                        {STATUS_LABEL[tx.status] ?? tx.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      {formatRupiah(tx.total_amount)}
                    </td>
                    <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setViewTransaction(tx)}
                        className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100"
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {meta && meta.last_page > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || isFetching}
            className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Sebelumnya
          </button>
          <span className="px-2 text-sm text-gray-500">
            {page} / {meta.last_page}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
            disabled={page === meta.last_page || isFetching}
            className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Berikutnya
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      )}

      {/* Modals */}
      <TransactionModal
        isOpen={showModal}
        transaction={editTransaction}
        onClose={() => setShowModal(false)}
        onSuccess={(msg) => showToast('success', msg)}
      />

      <TransactionDetailModal
        isOpen={!!viewTransaction}
        transaction={viewTransaction}
        onClose={() => setViewTransaction(null)}
        onEdit={handleOpenEdit}
        onDelete={setDeleteTarget}
      />

      <DeleteTransactionDialog
        isOpen={!!deleteTarget}
        transaction={deleteTarget}
        isPending={deleteMutation.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />

      <ImportModal isOpen={showImport} onClose={() => setShowImport(false)} />

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            role="status"
            aria-live="polite"
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg ${
              toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
            }`}
          >
            {toast.type === 'success' ? (
              <svg
                className="h-4 w-4 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            ) : (
              <svg
                className="h-4 w-4 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                />
              </svg>
            )}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
