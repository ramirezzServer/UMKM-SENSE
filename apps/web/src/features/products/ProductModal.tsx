import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AnimatePresence, motion } from 'framer-motion';
import { ProductFormSchema } from '@umkm-sense/shared';
import { applyServerErrors } from '@/lib/errors';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useCreateProduct, useUpdateProduct } from './hooks';
import type { Product } from './types';

const ModalSchema = ProductFormSchema.extend({
  image: z.instanceof(File).nullable().optional(),
});
type ModalForm = z.infer<typeof ModalSchema>;

interface Props {
  isOpen: boolean;
  product?: Product | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export default function ProductModal({ isOpen, product, onClose, onSuccess }: Props) {
  const isEdit = !!product;
  const panelRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [priceDisplay, setPriceDisplay] = useState('');

  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    setError,
    formState: { errors },
  } = useForm<ModalForm>({
    resolver: zodResolver(ModalSchema),
    defaultValues: {
      name: '',
      category: '',
      price: 0,
      current_stock: 0,
      status: 'active',
      image: null,
    },
  });

  const statusValue = watch('status');

  // Reset form when modal opens
  useEffect(() => {
    if (!isOpen) return;
    if (product) {
      reset({
        name: product.name,
        category: product.category ?? '',
        price: product.price,
        current_stock: product.current_stock,
        status: product.status,
        image: null,
      });
      setPriceDisplay(new Intl.NumberFormat('id-ID').format(product.price));
    } else {
      reset({ name: '', category: '', price: 0, current_stock: 0, status: 'active', image: null });
      setPriceDisplay('');
    }
    setImageFile(null);
    setImagePreview(null);
    setGeneralError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, product?.id]);

  // Cleanup object URL on unmount or when preview changes
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  // Focus first input when modal opens; escape key + focus trap
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>('input:not([type="file"])')?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;

      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]):not([type="file"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      if (focusable.length < 2) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    const num = raw ? parseInt(raw, 10) : 0;
    setPriceDisplay(raw ? new Intl.NumberFormat('id-ID').format(num) : '');
    setValue('price', num, { shouldValidate: true });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setValue('image', file, { shouldValidate: true });
    e.target.value = '';
  };

  const onSubmit = async (values: ModalForm) => {
    setGeneralError(null);
    const payload = {
      name: values.name,
      category: values.category || undefined,
      price: values.price,
      current_stock: values.current_stock,
      status: values.status,
      image: imageFile,
    };

    try {
      if (isEdit && product) {
        await updateMutation.mutateAsync({ id: product.id, ...payload });
        onSuccess('Produk berhasil diperbarui.');
      } else {
        await createMutation.mutateAsync(payload);
        onSuccess('Produk berhasil ditambahkan.');
      }
      onClose();
    } catch (err) {
      const msg = applyServerErrors(err, setError);
      if (msg) setGeneralError(msg);
    }
  };

  const currentImage = imagePreview ?? product?.image_url ?? null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            key="modal-panel"
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.15 }}
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={isEdit ? 'Edit produk' : 'Tambah produk baru'}
            className="relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {isEdit ? 'Edit Produk' : 'Tambah Produk'}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup modal"
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

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 px-6 py-5">
              {generalError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {generalError}
                </div>
              )}

              {/* Image upload */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Foto Produk
                </label>
                <div
                  className="flex cursor-pointer items-center gap-4"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:border-indigo-400">
                    {currentImage ? (
                      <img
                        src={currentImage}
                        alt="Preview produk"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <svg
                        className="h-8 w-8 text-gray-300"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.5}
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"
                        />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-indigo-600">
                      {imageFile ? imageFile.name : 'Pilih gambar'}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400">JPEG, PNG, WebP · Maks 2 MB</p>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  aria-label="Pilih gambar produk (JPEG, PNG, atau WebP)"
                  className="hidden"
                  onChange={handleImageChange}
                />
                {errors.image && (
                  <p className="mt-1 text-xs text-red-600">{errors.image.message as string}</p>
                )}
              </div>

              {/* Name */}
              <Input
                label="Nama Produk"
                placeholder="contoh: Kopi Susu"
                error={errors.name?.message}
                {...register('name')}
              />

              {/* Category */}
              <Input
                label="Kategori (opsional)"
                placeholder="contoh: Minuman"
                error={errors.category?.message}
                {...register('category')}
              />

              {/* Price */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="modal-price" className="text-sm font-medium text-gray-700">
                  Harga <span className="text-red-500">*</span>
                </label>
                <div
                  className={`flex items-center rounded-lg border shadow-sm transition-colors ${
                    errors.price ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                >
                  <span className="select-none pl-3.5 text-sm text-gray-500">Rp</span>
                  <input
                    id="modal-price"
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={priceDisplay}
                    onChange={handlePriceChange}
                    aria-invalid={errors.price ? 'true' : 'false'}
                    aria-describedby={errors.price ? 'modal-price-error' : undefined}
                    className="w-full rounded-r-lg bg-transparent py-2.5 pl-2 pr-3.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                  />
                </div>
                {errors.price && (
                  <p id="modal-price-error" className="text-xs text-red-600" role="alert">
                    {errors.price.message}
                  </p>
                )}
              </div>

              {/* Stock */}
              <Input
                label="Stok"
                type="number"
                min={0}
                placeholder="0"
                error={errors.current_stock?.message}
                {...register('current_stock')}
              />

              {/* Status toggle */}
              <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">Status Produk</p>
                  <p className="text-xs text-gray-400">
                    {statusValue === 'active'
                      ? 'Produk aktif dan bisa dijual'
                      : 'Produk disembunyikan'}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={statusValue === 'active' ? 'true' : 'false'}
                  aria-label={statusValue === 'active' ? 'Nonaktifkan produk' : 'Aktifkan produk'}
                  onClick={() =>
                    setValue('status', statusValue === 'active' ? 'inactive' : 'active', {
                      shouldValidate: true,
                    })
                  }
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
                    statusValue === 'active' ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      statusValue === 'active' ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
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
                  {isEdit ? 'Simpan Perubahan' : 'Tambah Produk'}
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
