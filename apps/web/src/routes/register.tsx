import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RegisterFormSchema, type RegisterForm, BusinessCategorySchema } from '@umkm-sense/shared';
import { useRegister, useDistricts } from '@/features/auth/hooks';
import { applyServerErrors } from '@/lib/errors';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import PasswordInput from '@/components/ui/PasswordInput';

const CATEGORIES = BusinessCategorySchema.options;

export default function RegisterPage() {
  const navigate = useNavigate();
  const registerMutation = useRegister();
  const { data: districts, isLoading: loadingDistricts } = useDistricts();
  const [globalError, setGlobalError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(RegisterFormSchema),
    defaultValues: { business_category: undefined },
  });

  useEffect(() => {
    setFocus('name');
  }, [setFocus]);

  const onSubmit = async (data: RegisterForm) => {
    setGlobalError(null);
    try {
      await registerMutation.mutateAsync(data);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg = applyServerErrors(err, setError);
      setGlobalError(msg);
    }
  };

  return (
    <main className="auth-bg flex min-h-screen items-start justify-center px-4 py-12">
      <div className="auth-card-enter w-full max-w-lg">
        {/* Brand header */}
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <Link
            to="/"
            className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-accent-600 shadow-warm-sm">
              <span className="text-sm font-bold text-white">U</span>
            </div>
            <span className="font-display text-lg font-semibold text-warm-900">UMKM-Sense</span>
          </Link>
          <div>
            <h1 className="font-display text-2xl font-bold text-warm-900">Buat Akun Gratis</h1>
            <p className="mt-1.5 text-sm text-warm-500">
              Sudah punya akun?{' '}
              <Link
                to="/login"
                className="font-semibold text-primary-600 transition-colors hover:text-primary-700"
              >
                Masuk di sini
              </Link>
            </p>
          </div>
        </div>

        {/* Form card */}
        <div className="rounded-2xl bg-white px-8 py-10 shadow-warm-md ring-1 ring-warm-200">
          {globalError && (
            <div
              role="alert"
              className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200"
            >
              {globalError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
            {/* Personal info */}
            <p className="text-xs font-semibold uppercase tracking-wider text-warm-400">
              Data Pribadi
            </p>

            <Input
              label="Nama Lengkap"
              type="text"
              autoComplete="name"
              placeholder="Budi Santoso"
              error={errors.name?.message}
              {...register('name')}
            />

            <Input
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="nama@contoh.com"
              error={errors.email?.message}
              {...register('email')}
            />

            <PasswordInput
              label="Password"
              autoComplete="new-password"
              placeholder="Minimal 8 karakter"
              error={errors.password?.message}
              {...register('password')}
            />

            <PasswordInput
              label="Konfirmasi Password"
              autoComplete="new-password"
              placeholder="Ulangi password"
              error={errors.password_confirmation?.message}
              {...register('password_confirmation')}
            />

            {/* Business info */}
            <p className="pt-2 text-xs font-semibold uppercase tracking-wider text-warm-400">
              Data Usaha
            </p>

            <Input
              label="Nama Usaha"
              type="text"
              autoComplete="organization"
              placeholder="Warung Nasi Budi"
              error={errors.business_name?.message}
              {...register('business_name')}
            />

            {/* Category select */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="business_category" className="text-sm font-medium text-warm-700">
                Kategori Usaha
              </label>
              <select
                id="business_category"
                {...register('business_category')}
                aria-invalid={errors.business_category ? 'true' : 'false'}
                className={
                  'w-full rounded-lg border px-3.5 py-2.5 text-sm text-warm-900 shadow-sm ' +
                  'bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 ' +
                  'focus:border-transparent ' +
                  (errors.business_category ? 'border-red-400 bg-red-50' : 'border-warm-300')
                }
              >
                <option value="">— Pilih kategori —</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {errors.business_category && (
                <p className="text-xs text-red-600" role="alert">
                  {errors.business_category.message}
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
                disabled={loadingDistricts}
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

            <Button type="submit" loading={isSubmitting} className="w-full mt-2">
              Buat Akun
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
