import { useEffect, useRef, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { TransactionFormSchema, type TransactionForm } from '@umkm-sense/shared';
import { applyServerErrors } from '@/lib/errors';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useCreateTransaction, useSelectProducts, useUpdateTransaction } from './hooks';
import type { Transaction } from './types';

const formatRupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(n);

function getLocalToday() {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

const selectClass =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm ' +
  'focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500';

const selectErrorClass =
  'w-full rounded-lg border border-red-400 bg-red-50 px-3 py-2.5 text-sm text-gray-900 shadow-sm ' +
  'focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500';

interface Props {
  isOpen: boolean;
  transaction?: Transaction | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export default function TransactionModal({ isOpen, transaction, onClose, onSuccess }: Props) {
  const isEdit = !!transaction;
  const panelRef = useRef<HTMLDivElement>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const today = getLocalToday();
  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();
  const { data: selectProducts = [] } = useSelectProducts();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setError,
    formState: { errors },
  } = useForm<TransactionForm>({
    resolver: zodResolver(TransactionFormSchema),
    defaultValues: {
      customer_name: '',
      transaction_date: today,
      payment_method: 'Cash',
      status: 'success',
      items: [{ product_id: 0, qty: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchedItems = watch('items');

  // Reset form when modal opens
  useEffect(() => {
    if (!isOpen) return;
    if (transaction) {
      reset({
        customer_name: transaction.customer_name ?? '',
        transaction_date: transaction.transaction_date,
        payment_method: transaction.payment_method,
        status: transaction.status,
        items: transaction.items?.map((i) => ({ product_id: i.product_id, qty: i.qty })) ?? [
          { product_id: 0, qty: 1 },
        ],
      });
    } else {
      reset({
        customer_name: '',
        transaction_date: today,
        payment_method: 'Cash',
        status: 'success',
        items: [{ product_id: 0, qty: 1 }],
      });
    }
    setGeneralError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, transaction?.id]);

  // Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus first input when opening
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>('input:not([type="date"])')?.focus();
    }, 60);
    return () => clearTimeout(timer);
  }, [isOpen]);

  // Live total from current watchedItems
  const liveTotal = watchedItems.reduce((sum, item) => {
    const id = Number(item.product_id);
    const product = selectProducts.find((p) => p.id === id);
    return sum + (Number(item.qty) || 0) * (product?.price ?? 0);
  }, 0);

  const onSubmit = async (values: TransactionForm) => {
    setGeneralError(null);
    const payload = {
      customer_name: values.customer_name || undefined,
      transaction_date: values.transaction_date,
      payment_method: values.payment_method,
      status: values.status,
      items: values.items.map((i) => ({ product_id: i.product_id, qty: i.qty })),
    };

    try {
      if (isEdit && transaction) {
        await updateMutation.mutateAsync({ id: transaction.id, ...payload });
        onSuccess('Transaksi berhasil diperbarui.');
      } else {
        await createMutation.mutateAsync(payload);
        onSuccess('Transaksi berhasil ditambahkan.');
      }
      onClose();
    } catch (err) {
      const msg = applyServerErrors(err, setError);
      if (msg) setGeneralError(msg);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="tx-modal-overlay"
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
            key="tx-modal-panel"
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.15 }}
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={isEdit ? 'Edit transaksi' : 'Tambah transaksi baru'}
            className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
          >
            {/* Sticky header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {isEdit ? 'Edit Transaksi' : 'Tambah Transaksi'}
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

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6 px-6 py-5">
              {generalError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {generalError}
                </div>
              )}

              {/* Header fields */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Nama Pelanggan (opsional)"
                  placeholder="contoh: Budi Santoso"
                  error={errors.customer_name?.message}
                  {...register('customer_name')}
                />

                {/* Date */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="tx-date" className="text-sm font-medium text-gray-700">
                    Tanggal Transaksi <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="tx-date"
                    type="date"
                    max={today}
                    aria-invalid={!!errors.transaction_date}
                    className={errors.transaction_date ? selectErrorClass : selectClass}
                    {...register('transaction_date')}
                  />
                  {errors.transaction_date && (
                    <p className="text-xs text-red-600">{errors.transaction_date.message}</p>
                  )}
                </div>

                {/* Payment method */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="tx-payment" className="text-sm font-medium text-gray-700">
                    Metode Bayar <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="tx-payment"
                    aria-invalid={!!errors.payment_method}
                    className={errors.payment_method ? selectErrorClass : selectClass}
                    {...register('payment_method')}
                  >
                    <option value="Cash">Cash</option>
                    <option value="Transfer">Transfer</option>
                    <option value="QRIS">QRIS</option>
                  </select>
                  {errors.payment_method && (
                    <p className="text-xs text-red-600">{errors.payment_method.message}</p>
                  )}
                </div>

                {/* Status */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="tx-status" className="text-sm font-medium text-gray-700">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="tx-status"
                    aria-invalid={!!errors.status}
                    className={errors.status ? selectErrorClass : selectClass}
                    {...register('status')}
                  >
                    <option value="success">Berhasil</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Gagal</option>
                  </select>
                  {errors.status && <p className="text-xs text-red-600">{errors.status.message}</p>}
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">
                    Item Transaksi
                    {(errors.items as { message?: string })?.message && (
                      <span className="ml-2 text-sm font-normal text-red-600">
                        {(errors.items as { message?: string }).message}
                      </span>
                    )}
                  </h3>
                  <button
                    type="button"
                    onClick={() => append({ product_id: 0, qty: 1 })}
                    className="flex items-center gap-1 rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-50 active:bg-indigo-100"
                  >
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 4.5v15m7.5-7.5h-15"
                      />
                    </svg>
                    Tambah Item
                  </button>
                </div>

                {/* Column labels */}
                <div className="mb-1 grid grid-cols-[1fr_72px_104px_104px_32px] gap-2 px-1 text-xs font-medium uppercase tracking-wide text-gray-400">
                  <span>Produk</span>
                  <span>Qty</span>
                  <span className="text-right">Harga</span>
                  <span className="text-right">Subtotal</span>
                  <span />
                </div>

                <AnimatePresence initial={false}>
                  {fields.map((field, i) => {
                    const productId = Number(watchedItems[i]?.product_id ?? 0);
                    const selectedProduct = selectProducts.find((p) => p.id === productId);
                    const unitPrice = selectedProduct?.price ?? 0;
                    const qty = Number(watchedItems[i]?.qty) || 0;
                    const subtotal = qty * unitPrice;

                    return (
                      <motion.div
                        key={field.id}
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20, transition: { duration: 0.12 } }}
                        transition={{ duration: 0.15 }}
                        className="mb-2 grid grid-cols-[1fr_72px_104px_104px_32px] items-start gap-2"
                      >
                        {/* Product */}
                        <div>
                          <select
                            aria-label={`Produk item ${i + 1}`}
                            aria-invalid={!!errors.items?.[i]?.product_id}
                            className={
                              errors.items?.[i]?.product_id ? selectErrorClass : selectClass
                            }
                            {...register(`items.${i}.product_id`, { valueAsNumber: true })}
                          >
                            <option value={0} disabled>
                              Pilih produk...
                            </option>
                            {selectProducts.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                                {p.current_stock === 0 ? ' ⚠' : ''}
                              </option>
                            ))}
                          </select>
                          {errors.items?.[i]?.product_id && (
                            <p className="mt-0.5 text-xs text-red-600">
                              {errors.items[i].product_id?.message}
                            </p>
                          )}
                        </div>

                        {/* Qty */}
                        <div>
                          <input
                            type="number"
                            min={1}
                            max={9999}
                            placeholder="1"
                            aria-label={`Qty item ${i + 1}`}
                            aria-invalid={!!errors.items?.[i]?.qty}
                            className={
                              (errors.items?.[i]?.qty
                                ? 'border-red-400 bg-red-50'
                                : 'border-gray-300 bg-white') +
                              ' w-full rounded-lg border px-2.5 py-2.5 text-sm shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500'
                            }
                            {...register(`items.${i}.qty`, { valueAsNumber: true })}
                          />
                          {errors.items?.[i]?.qty && (
                            <p className="mt-0.5 text-xs text-red-600">
                              {errors.items[i].qty?.message}
                            </p>
                          )}
                        </div>

                        {/* Unit price */}
                        <div className="py-2.5 text-right text-sm text-gray-500">
                          {unitPrice > 0 ? formatRupiah(unitPrice) : '—'}
                        </div>

                        {/* Subtotal */}
                        <div className="py-2.5 text-right text-sm font-semibold text-gray-900">
                          {subtotal > 0 ? formatRupiah(subtotal) : '—'}
                        </div>

                        {/* Remove */}
                        <div className="flex items-start pt-2.5">
                          <button
                            type="button"
                            onClick={() => remove(i)}
                            disabled={fields.length <= 1}
                            aria-label={`Hapus item ${i + 1}`}
                            className="flex h-6 w-6 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-30"
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
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {/* Live total */}
                <div className="mt-4 flex items-center justify-end gap-3 border-t border-gray-100 pt-3">
                  <span className="text-sm text-gray-500">Total Estimasi</span>
                  <span className="text-xl font-bold text-indigo-600">
                    {formatRupiah(liveTotal)}
                  </span>
                </div>
                <p className="mt-1 text-right text-xs text-gray-400">
                  * Harga final dihitung ulang oleh server
                </p>
              </div>

              {/* Footer actions */}
              <div className="flex gap-3 border-t border-gray-100 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                  disabled={isPending}
                  className="flex-1"
                >
                  Batal
                </Button>
                <Button type="submit" loading={isPending} className="flex-1">
                  {isEdit ? 'Simpan Perubahan' : 'Tambah Transaksi'}
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
