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
      navigate('/', { replace: true });
    } catch (err) {
      const msg = applyServerErrors(err, setError);
      setGlobalError(msg);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Buat Akun UMKM-Sense</h1>
          <p className="mt-2 text-sm text-gray-500">
            Sudah punya akun?{' '}
            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Masuk di sini
            </Link>
          </p>
        </div>

        <div className="rounded-2xl bg-white px-8 py-10 shadow-sm ring-1 ring-gray-200">
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
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
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
            <p className="pt-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
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
              <label htmlFor="business_category" className="text-sm font-medium text-gray-700">
                Kategori Usaha
              </label>
              <select
                id="business_category"
                {...register('business_category')}
                aria-invalid={!!errors.business_category}
                className={
                  'w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 shadow-sm ' +
                  'bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ' +
                  'focus:border-transparent ' +
                  (errors.business_category ? 'border-red-400 bg-red-50' : 'border-gray-300')
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
              <label htmlFor="district" className="text-sm font-medium text-gray-700">
                Kecamatan
              </label>
              <select
                id="district"
                {...register('district')}
                disabled={loadingDistricts}
                aria-invalid={!!errors.district}
                className={
                  'w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 shadow-sm ' +
                  'bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ' +
                  'focus:border-transparent disabled:opacity-60 ' +
                  (errors.district ? 'border-red-400 bg-red-50' : 'border-gray-300')
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
