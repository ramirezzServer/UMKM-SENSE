import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useSelectProducts } from '@/features/sales/hooks';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z
  .object({
    product_id: z.coerce
      .number({ invalid_type_error: 'Pilih produk terlebih dahulu.' })
      .min(1, 'Pilih produk terlebih dahulu.'),
    prediction_start: z.string().min(1, 'Tanggal mulai wajib diisi.'),
    prediction_end: z.string().min(1, 'Tanggal selesai wajib diisi.'),
  })
  .superRefine((val, ctx) => {
    if (!val.prediction_start || !val.prediction_end) return;
    const start = new Date(val.prediction_start);
    const end = new Date(val.prediction_end);
    if (end < start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Tanggal selesai tidak boleh sebelum tanggal mulai.',
        path: ['prediction_end'],
      });
      return;
    }
    const diffMs = end.getTime() - start.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays > 14) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Horizon prediksi maksimal 14 hari.',
        path: ['prediction_end'],
      });
    }
  });

export type PredictionFormValues = z.infer<typeof schema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function addDays(dateStr: string, n: number) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  onSubmit: (values: PredictionFormValues) => void;
  isSubmitting: boolean;
}

export default function PredictionForm({ onSubmit, isSubmitting }: Props) {
  const { data: products = [], isPending: loadingProducts } = useSelectProducts();

  const today = todayStr();
  const defaultStart = addDays(today, 1);
  const defaultEnd = addDays(today, 7);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<PredictionFormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      product_id: 0,
      prediction_start: defaultStart,
      prediction_end: defaultEnd,
    },
  });

  const startValue = watch('prediction_start');

  // When start changes, keep end within 14-day window
  useEffect(() => {
    const endValue = watch('prediction_end');
    if (!startValue || !endValue) return;
    const start = new Date(startValue);
    const end = new Date(endValue);
    if (end < start) {
      setValue('prediction_end', addDays(startValue, 7), { shouldValidate: true });
    } else {
      const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 14) {
        setValue('prediction_end', addDays(startValue, 14), { shouldValidate: true });
      }
    }
  }, [startValue]); // eslint-disable-line react-hooks/exhaustive-deps

  const isDisabled = isSubmitting || loadingProducts;

  return (
    <motion.form
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5"
      noValidate
    >
      {/* Product dropdown */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="product_id" className="text-sm font-medium text-gray-700">
          Produk
        </label>
        {loadingProducts ? (
          <div className="h-11 animate-pulse rounded-lg bg-gray-100" />
        ) : (
          <select
            id="product_id"
            {...register('product_id')}
            disabled={isDisabled}
            aria-invalid={errors.product_id ? 'true' : 'false'}
            className={
              'w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 shadow-sm ' +
              'transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ' +
              'disabled:pointer-events-none disabled:opacity-50 ' +
              (errors.product_id ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white')
            }
          >
            <option value={0} disabled>
              — Pilih produk —
            </option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        )}
        {errors.product_id && (
          <p className="text-xs text-red-600" role="alert">
            {errors.product_id.message}
          </p>
        )}
        {products.length === 0 && !loadingProducts && (
          <p className="text-xs text-amber-600">
            Belum ada produk aktif. Tambahkan produk terlebih dahulu.
          </p>
        )}
      </div>

      {/* Date range */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Tanggal Mulai"
          type="date"
          min={today}
          disabled={isDisabled}
          error={errors.prediction_start?.message}
          {...register('prediction_start')}
        />
        <Input
          label="Tanggal Selesai"
          type="date"
          min={startValue || today}
          max={startValue ? addDays(startValue, 14) : undefined}
          disabled={isDisabled}
          error={errors.prediction_end?.message}
          {...register('prediction_end')}
        />
      </div>

      {/* Horizon hint */}
      <p className="text-xs text-gray-500">Periode prediksi maksimal 14 hari ke depan.</p>

      {/* Submit */}
      <Button
        type="submit"
        loading={isSubmitting}
        disabled={!isValid || isDisabled || products.length === 0}
        className="w-full py-3 text-base"
      >
        {isSubmitting ? 'Mengirim permintaan…' : 'Analisis Sekarang'}
      </Button>
    </motion.form>
  );
}
