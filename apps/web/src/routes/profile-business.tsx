import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  UpdateProfileFormSchema,
  type UpdateProfileForm,
  BusinessCategorySchema,
} from '@umkm-sense/shared';
import { useUpdateProfile } from '@/features/profile/hooks';
import { useAuth, useDistricts } from '@/features/auth/hooks';
import { applyServerErrors } from '@/lib/errors';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { stagger, staggerItem } from '@/lib/motion';

const CATEGORIES = BusinessCategorySchema.options;

export default function ProfileBusinessPage() {
  const { data: user, isPending: loadingUser } = useAuth();
  const { data: districts, isLoading: loadingDistricts } = useDistricts();
  const updateMutation = useUpdateProfile();

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UpdateProfileForm>({
    resolver: zodResolver(UpdateProfileFormSchema),
  });

  useEffect(() => {
    if (user?.business) {
      reset({
        name: user.business.name,
        category: user.business.category as UpdateProfileForm['category'],
        district: user.business.district,
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: UpdateProfileForm) => {
    setGlobalError(null);
    setSuccessMsg(null);
    try {
      await updateMutation.mutateAsync(data);
      setSuccessMsg('Profil usaha berhasil diperbarui.');
      reset(data);
    } catch (err) {
      const msg = applyServerErrors(err, setError);
      setGlobalError(msg);
    }
  };

  const isFormLoading = loadingUser || !user?.business;

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="visible"
      className="max-w-2xl space-y-6"
    >
      {/* Page header */}
      <motion.div variants={staggerItem}>
        <h1 className="font-display text-2xl font-bold text-warm-900">Profil Usaha</h1>
        <p className="mt-0.5 text-sm text-warm-500">Kelola informasi usaha dan akun Anda.</p>
      </motion.div>

      {/* Account info — read-only */}
      <motion.div variants={staggerItem}>
        <div className="glass-card rounded-2xl p-6 shadow-warm-sm">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-warm-400">
            Informasi Akun
          </p>
          {loadingUser ? (
            <div className="space-y-3">
              <div className="h-4 w-40 animate-pulse rounded bg-warm-100" />
              <div className="h-4 w-56 animate-pulse rounded bg-warm-100" />
            </div>
          ) : (
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-warm-400">Nama Pemilik</dt>
                <dd className="mt-0.5 text-sm font-medium text-warm-900">{user?.name ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-warm-400">Email</dt>
                <dd className="mt-0.5 text-sm font-medium text-warm-900">{user?.email ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-warm-400">Status Email</dt>
                <dd className="mt-0.5">
                  {user?.email_verified_at ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary-700">
                      <span
                        aria-hidden="true"
                        className="h-1.5 w-1.5 rounded-full bg-secondary-500"
                      />
                      Terverifikasi
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-warm-500">
                      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-warm-400" />
                      Belum terverifikasi
                    </span>
                  )}
                </dd>
              </div>
            </dl>
          )}
        </div>
      </motion.div>

      {/* Business data — editable */}
      <motion.div variants={staggerItem}>
        <div className="glass-card rounded-2xl p-6 shadow-warm-sm">
          <p className="mb-5 text-xs font-semibold uppercase tracking-wider text-warm-400">
            Data Usaha
          </p>

          {successMsg && (
            <div
              role="status"
              className="mb-5 rounded-lg bg-secondary-50 px-4 py-3 text-sm text-secondary-700 ring-1 ring-secondary-200"
            >
              {successMsg}
            </div>
          )}

          {globalError && (
            <div
              role="alert"
              className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200"
            >
              {globalError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
            <Input
              label="Nama Usaha"
              type="text"
              autoComplete="organization"
              placeholder="Warung Nasi Budi"
              error={errors.name?.message}
              disabled={isFormLoading}
              {...register('name')}
            />

            {/* Category select */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="category" className="text-sm font-medium text-warm-700">
                Kategori Usaha
              </label>
              <select
                id="category"
                {...register('category')}
                disabled={isFormLoading}
                aria-invalid={errors.category ? 'true' : 'false'}
                className={
                  'w-full rounded-lg border px-3.5 py-2.5 text-sm text-warm-900 shadow-sm ' +
                  'bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 ' +
                  'focus:border-transparent disabled:opacity-60 ' +
                  (errors.category ? 'border-red-400 bg-red-50' : 'border-warm-300')
                }
              >
                <option value="">— Pilih kategori —</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="text-xs text-red-600" role="alert">
                  {errors.category.message}
                </p>
              )}
            </div>

            {/* District select */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="district" className="text-sm font-medium text-warm-700">
                Kecamatan
              </label>
              <select
                id="district"
                {...register('district')}
                disabled={isFormLoading || loadingDistricts}
                aria-invalid={errors.district ? 'true' : 'false'}
                className={
                  'w-full rounded-lg border px-3.5 py-2.5 text-sm text-warm-900 shadow-sm ' +
                  'bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 ' +
                  'focus:border-transparent disabled:opacity-60 ' +
                  (errors.district ? 'border-red-400 bg-red-50' : 'border-warm-300')
                }
              >
                <option value="">
                  {loadingDistricts ? 'Memuat data kecamatan…' : '— Pilih kecamatan —'}
                </option>
                {districts?.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name} — {d.city}
                  </option>
                ))}
              </select>
              {errors.district && (
                <p className="text-xs text-red-600" role="alert">
                  {errors.district.message}
                </p>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                loading={isSubmitting}
                disabled={!isDirty || isFormLoading}
                className="min-w-[140px]"
              >
                Simpan Perubahan
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}
