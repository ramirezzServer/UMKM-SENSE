import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
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
  const location = useLocation();
  // ProtectedRoute stores the intended path in state.from
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard';
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
      navigate(from, { replace: true });
    } catch (err) {
      const msg = applyServerErrors(err, setError);
      setGlobalError(msg);
    }
  };

  return (
    <main className="auth-bg flex min-h-screen items-center justify-center px-4 py-12">
      <div className="auth-card-enter w-full max-w-md">
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
            <h1 className="font-display text-2xl font-bold text-warm-900">
              Selamat datang kembali
            </h1>
            <p className="mt-1.5 text-sm text-warm-500">
              Belum punya akun?{' '}
              <Link
                to="/register"
                className="font-semibold text-primary-600 transition-colors hover:text-primary-700"
              >
                Daftar gratis
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
                className="text-sm font-semibold text-primary-600 transition-colors hover:text-primary-700"
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
