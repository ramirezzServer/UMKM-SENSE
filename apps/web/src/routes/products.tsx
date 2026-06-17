import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useProducts, useDeleteProduct } from '@/features/products/hooks';
import ProductCard from '@/features/products/ProductCard';
import ProductSkeleton from '@/features/products/ProductSkeleton';
import ProductModal from '@/features/products/ProductModal';
import DeleteDialog from '@/features/products/DeleteDialog';
import { useDebounce } from '@/hooks/useDebounce';
import Button from '@/components/ui/Button';
import { stagger, staggerItem } from '@/lib/motion';
import type { Product } from '@/features/products/types';

type StatusFilter = 'active' | 'inactive' | '';

interface Toast {
  type: 'success' | 'error';
  message: string;
}

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');
  const [page, setPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const { data, isPending, isFetching } = useProducts({
    search: debouncedSearch,
    status: statusFilter,
    page,
  });

  const deleteMutation = useDeleteProduct();

  const showToast = (type: Toast['type'], message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleOpenAdd = () => {
    setEditProduct(null);
    setShowModal(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditProduct(p);
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
        showToast('error', 'Gagal menghapus produk. Silakan coba lagi.');
      },
    });
  };

  const products = data?.data ?? [];
  const meta = data?.meta;

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <motion.div
        variants={staggerItem}
        className="flex flex-wrap items-center justify-between gap-3"
      >
        <div>
          <h1 className="font-display text-2xl font-bold text-warm-900">Data Produk</h1>
          {meta && <p className="mt-0.5 text-sm text-warm-500">{meta.total} produk terdaftar</p>}
        </div>
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
          Tambah Produk
        </Button>
      </motion.div>

      {/* Filters */}
      <motion.div variants={staggerItem} className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-warm-400"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <input
            type="search"
            placeholder="Cari nama produk..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-warm-300 bg-white/80 py-2.5 pl-9 pr-9 text-sm text-warm-900 shadow-warm-sm placeholder:text-warm-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-accent-500"
          />
          {isFetching && !isPending && (
            <span
              aria-hidden="true"
              className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-primary-400 border-t-transparent"
            />
          )}
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          aria-label="Filter status produk"
          className="rounded-lg border border-warm-300 bg-white/80 py-2.5 pl-3 pr-8 text-sm text-warm-700 shadow-warm-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-accent-500"
        >
          <option value="">Semua Status</option>
          <option value="active">Aktif</option>
          <option value="inactive">Nonaktif</option>
        </select>
      </motion.div>

      {/* Grid */}
      <motion.div variants={staggerItem}>
        {isPending ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 rounded-full bg-warm-100 p-6">
              <svg
                className="h-10 w-10 text-warm-400"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                />
              </svg>
            </div>
            <h3 className="font-display text-lg font-semibold text-warm-900">
              {debouncedSearch || statusFilter ? 'Produk tidak ditemukan' : 'Belum ada produk'}
            </h3>
            <p className="mt-1 max-w-xs text-sm text-warm-500">
              {debouncedSearch || statusFilter
                ? 'Coba ubah kata kunci atau filter pencarian.'
                : 'Mulai dengan menambahkan produk pertama Anda.'}
            </p>
            {!debouncedSearch && !statusFilter && (
              <Button onClick={handleOpenAdd} className="mt-4">
                Tambah Produk Pertama
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {products.map((product, i) => (
              <ProductCard
                key={product.id}
                product={product}
                index={i}
                onEdit={handleOpenEdit}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* Pagination */}
      {meta && meta.last_page > 1 && (
        <motion.div variants={staggerItem} className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || isFetching}
            className="flex items-center gap-1 rounded-lg border border-warm-200 px-3 py-2 text-sm font-medium text-warm-600 transition-colors hover:bg-warm-50 disabled:cursor-not-allowed disabled:opacity-40"
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
          <span className="px-2 text-sm text-warm-500">
            {page} / {meta.last_page}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
            disabled={page === meta.last_page || isFetching}
            className="flex items-center gap-1 rounded-lg border border-warm-200 px-3 py-2 text-sm font-medium text-warm-600 transition-colors hover:bg-warm-50 disabled:cursor-not-allowed disabled:opacity-40"
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
        </motion.div>
      )}

      {/* Modals */}
      <ProductModal
        isOpen={showModal}
        product={editProduct}
        onClose={() => setShowModal(false)}
        onSuccess={(msg) => showToast('success', msg)}
      />

      <DeleteDialog
        isOpen={!!deleteTarget}
        product={deleteTarget}
        isPending={deleteMutation.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />

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
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-warm-lg ${
              toast.type === 'success' ? 'bg-success-600' : 'bg-danger-600'
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
    </motion.div>
  );
}
