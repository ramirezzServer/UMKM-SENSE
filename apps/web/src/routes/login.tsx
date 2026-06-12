import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginFormSchema, type LoginForm } from '@umkm-sense/shared';
import { useLogin } from '@/features/auth/hooks';
import { applyServerErrors } from '@/lib/errors';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import PasswordInput from '@/components/ui/PasswordInput';

export default function LoginPage() {
  const navigate = useNavigate();
  const loginMutation = useLogin();
  const [globalError, setGlobalError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(LoginFormSchema),
  });

  useEffect(() => {
    setFocus('email');
  }, [setFocus]);

  const onSubmit = async (data: LoginForm) => {
    setGlobalError(null);
    try {
      await loginMutation.mutateAsync(data);
      navigate('/', { replace: true });
    } catch (err) {
      const msg = applyServerErrors(err, setError);
      setGlobalError(msg);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Masuk ke UMKM-Sense</h1>
          <p className="mt-2 text-sm text-gray-500">
            Belum punya akun?{' '}
            <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
              Daftar sekarang
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
              autoComplete="current-password"
              placeholder="Masukkan password"
              error={errors.password?.message}
              {...register('password')}
            />

            <div className="flex items-center justify-end">
              <Link
                to="/reset-password"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                Lupa password?
              </Link>
            </div>

            <Button type="submit" loading={isSubmitting} className="w-full mt-1">
              Masuk
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
