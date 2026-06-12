import { AnimatePresence, motion } from 'framer-motion';
import Button from '@/components/ui/Button';
import type { Product } from './types';

interface Props {
  isOpen: boolean;
  product: Product | null;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function DeleteDialog({ isOpen, product, isPending, onCancel, onConfirm }: Props) {
  return (
    <AnimatePresence>
      {isOpen && product && (
        <motion.div
          key="delete-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onCancel}
            aria-hidden="true"
          />

          {/* Dialog */}
          <motion.div
            key="delete-panel"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            aria-describedby="delete-desc"
            className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
          >
            {/* Icon */}
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <svg
                className="h-6 w-6 text-red-600"
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

            <h2 id="delete-title" className="mb-2 text-center text-lg font-semibold text-gray-900">
              Hapus Produk?
            </h2>
            <p id="delete-desc" className="mb-1 text-center text-sm text-gray-600">
              <span className="font-medium text-gray-900">"{product.name}"</span> akan dihapus
              secara permanen.
            </p>
            <p className="mb-6 text-center text-xs text-gray-400">
              Produk dengan riwayat transaksi akan dinonaktifkan secara otomatis, bukan dihapus.
            </p>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={onCancel}
                disabled={isPending}
                className="flex-1"
              >
                Batal
              </Button>
              <Button
                type="button"
                loading={isPending}
                onClick={onConfirm}
                className="flex-1 bg-red-600 hover:bg-red-700 active:bg-red-800 focus-visible:ring-red-500"
              >
                Hapus
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
