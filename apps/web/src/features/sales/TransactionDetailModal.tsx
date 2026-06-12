import { AnimatePresence, motion } from 'framer-motion';
import Button from '@/components/ui/Button';
import type { Transaction } from './types';

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

interface Props {
  isOpen: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  onEdit: (t: Transaction) => void;
  onDelete: (t: Transaction) => void;
}

export default function TransactionDetailModal({
  isOpen,
  transaction,
  onClose,
  onEdit,
  onDelete,
}: Props) {
  return (
    <AnimatePresence>
      {isOpen && transaction && (
        <motion.div
          key="detail-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            key="detail-panel"
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.15 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="detail-title"
            className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 id="detail-title" className="text-lg font-semibold text-gray-900">
                Transaksi #{transaction.id}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup"
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
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
            <div className="space-y-5 px-6 py-5">
              {/* Info grid */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Pelanggan</p>
                  <p className="mt-0.5 font-medium text-gray-900">
                    {transaction.customer_name || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Tanggal</p>
                  <p className="mt-0.5 font-medium text-gray-900">
                    {formatDate(transaction.transaction_date)}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-gray-500">Metode Bayar</p>
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${PAYMENT_CLASS[transaction.payment_method] ?? 'bg-gray-100 text-gray-600'}`}
                  >
                    {transaction.payment_method}
                  </span>
                </div>
                <div>
                  <p className="mb-1 text-gray-500">Status</p>
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASS[transaction.status] ?? 'bg-gray-100 text-gray-600'}`}
                  >
                    {STATUS_LABEL[transaction.status] ?? transaction.status}
                  </span>
                </div>
              </div>

              {/* Items */}
              {transaction.items && transaction.items.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-gray-700">Item Transaksi</h3>
                  <div className="overflow-hidden rounded-xl border border-gray-200">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500">
                        <tr>
                          <th className="px-3 py-2.5 text-left">Produk</th>
                          <th className="px-3 py-2.5 text-center">Qty</th>
                          <th className="px-3 py-2.5 text-right">Harga</th>
                          <th className="px-3 py-2.5 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {transaction.items.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="max-w-[160px] truncate px-3 py-2.5 font-medium text-gray-900">
                              {item.product_name}
                            </td>
                            <td className="px-3 py-2.5 text-center text-gray-600">{item.qty}</td>
                            <td className="px-3 py-2.5 text-right text-gray-600">
                              {formatRupiah(item.unit_price)}
                            </td>
                            <td className="px-3 py-2.5 text-right font-medium text-gray-900">
                              {formatRupiah(item.subtotal)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Total */}
              <div className="flex items-center justify-between rounded-xl bg-indigo-50 px-4 py-3">
                <span className="text-sm font-semibold text-indigo-700">Total</span>
                <span className="text-xl font-bold text-indigo-700">
                  {formatRupiah(transaction.total_amount)}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 border-t border-gray-100 px-6 py-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  onClose();
                  onEdit(transaction);
                }}
                className="flex-1"
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
                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125"
                  />
                </svg>
                Edit
              </Button>
              <Button
                type="button"
                onClick={() => {
                  onClose();
                  onDelete(transaction);
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 active:bg-red-800 focus-visible:ring-red-500"
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
                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                  />
                </svg>
                Hapus
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
