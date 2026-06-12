import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ForgotPasswordFormSchema,
  VerifyOtpFormSchema,
  ResetPasswordFormSchema,
  type ForgotPasswordForm,
  type VerifyOtpForm,
  type ResetPasswordForm,
} from '@umkm-sense/shared';
import { useForgotPassword, useVerifyOtp, useResetPassword } from '@/features/auth/hooks';
import { applyServerErrors } from '@/lib/errors';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import PasswordInput from '@/components/ui/PasswordInput';

type Step = 'email' | 'otp' | 'password' | 'done';

// ─── Step 1: Email ────────────────────────────────────────────────────────────

function EmailStep({ onSuccess }: { onSuccess: (email: string) => void }) {
  const mutation = useForgotPassword();
  const [globalError, setGlobalError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordForm>({ resolver: zodResolver(ForgotPasswordFormSchema) });

  useEffect(() => {
    setFocus('email');
  }, [setFocus]);

  const onSubmit = async (data: ForgotPasswordForm) => {
    setGlobalError(null);
    try {
      await mutation.mutateAsync(data);
      onSuccess(data.email);
    } catch (err) {
      const msg = applyServerErrors(err, setError);
      setGlobalError(msg);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      <p className="text-sm text-gray-500">
        Masukkan email yang terdaftar. Kami akan mengirimkan kode OTP 6 digit.
      </p>

      {globalError && (
        <div
          role="alert"
          className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200"
        >
          {globalError}
        </div>
      )}

      <Input
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="nama@contoh.com"
        error={errors.email?.message}
        {...register('email')}
      />

      <Button type="submit" loading={isSubmitting} className="w-full">
        Kirim Kode OTP
      </Button>
    </form>
  );
}

// ─── Step 2: OTP ──────────────────────────────────────────────────────────────

function OtpStep({
  email,
  onSuccess,
  onBack,
}: {
  email: string;
  onSuccess: (otp: string) => void;
  onBack: () => void;
}) {
  const mutation = useVerifyOtp();
  const [globalError, setGlobalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<VerifyOtpForm>({ resolver: zodResolver(VerifyOtpFormSchema) });

  const { ref: rhfRef, ...otpProps } = register('otp');

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const onSubmit = async (data: VerifyOtpForm) => {
    setGlobalError(null);
    try {
      await mutation.mutateAsync({ email, otp: data.otp });
      onSuccess(data.otp);
    } catch (err) {
      const msg = applyServerErrors(err, setError);
      setGlobalError(msg);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      <p className="text-sm text-gray-500">
        Kode OTP telah dikirim ke <strong>{email}</strong>. Masukkan kode 6 digit di bawah.
      </p>

      {globalError && (
        <div
          role="alert"
          className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200"
        >
          {globalError}
        </div>
      )}

      <Input
        label="Kode OTP"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        placeholder="123456"
        error={errors.otp?.message}
        ref={(el) => {
          rhfRef(el);
          inputRef.current = el;
        }}
        {...otpProps}
      />

      <Button type="submit" loading={isSubmitting} className="w-full">
        Verifikasi Kode
      </Button>

      <Button type="button" variant="ghost" onClick={onBack} className="w-full">
        ← Kembali
      </Button>
    </form>
  );
}

// ─── Step 3: New Password ─────────────────────────────────────────────────────

function NewPasswordStep({
  email,
  otp,
  onSuccess,
}: {
  email: string;
  otp: string;
  onSuccess: () => void;
}) {
  const mutation = useResetPassword();
  const [globalError, setGlobalError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordForm>({ resolver: zodResolver(ResetPasswordFormSchema) });

  useEffect(() => {
    setFocus('password');
  }, [setFocus]);

  const onSubmit = async (data: ResetPasswordForm) => {
    setGlobalError(null);
    try {
      await mutation.mutateAsync({ email, otp, ...data });
      onSuccess();
    } catch (err) {
      const msg = applyServerErrors(err, setError);
      setGlobalError(msg);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      <p className="text-sm text-gray-500">Buat password baru untuk akun Anda.</p>

      {globalError && (
        <div
          role="alert"
          className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200"
        >
          {globalError}
        </div>
      )}

      <PasswordInput
        label="Password Baru"
        autoComplete="new-password"
        placeholder="Minimal 8 karakter"
        error={errors.password?.message}
        {...register('password')}
      />

      <PasswordInput
        label="Konfirmasi Password"
        autoComplete="new-password"
        placeholder="Ulangi password baru"
        error={errors.password_confirmation?.message}
        {...register('password_confirmation')}
      />

      <Button type="submit" loading={isSubmitting} className="w-full">
        Simpan Password Baru
      </Button>
    </form>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const STEP_TITLES: Record<Step, string> = {
  email: 'Reset Password',
  otp: 'Verifikasi OTP',
  password: 'Password Baru',
  done: 'Berhasil!',
};

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">{STEP_TITLES[step]}</h1>
          {step !== 'done' && (
            <p className="mt-2 text-sm text-gray-500">
              Ingat password?{' '}
              <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                Masuk di sini
              </Link>
            </p>
          )}
        </div>

        <div className="rounded-2xl bg-white px-8 py-10 shadow-sm ring-1 ring-gray-200">
          {/* Step indicator */}
          <div className="mb-6 flex items-center gap-2">
            {(['email', 'otp', 'password'] as const).map((s, i) => (
              <div key={s} className="flex flex-1 items-center gap-2">
                <div
                  className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    step === s || step === 'done'
                      ? 'bg-indigo-600 text-white'
                      : (['email', 'otp', 'password'].indexOf(step) ?? 0) > i
                        ? 'bg-indigo-200 text-indigo-700'
                        : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {i + 1}
                </div>
                {i < 2 && <div className="h-px flex-1 bg-gray-200" />}
              </div>
            ))}
          </div>

          {step === 'email' && (
            <EmailStep
              onSuccess={(em) => {
                setEmail(em);
                setStep('otp');
              }}
            />
          )}

          {step === 'otp' && (
            <OtpStep
              email={email}
              onSuccess={(code) => {
                setOtp(code);
                setStep('password');
              }}
              onBack={() => setStep('email')}
            />
          )}

          {step === 'password' && (
            <NewPasswordStep email={email} otp={otp} onSuccess={() => setStep('done')} />
          )}

          {step === 'done' && (
            <div className="flex flex-col items-center gap-5 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-7 w-7"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm text-gray-600">
                Password berhasil diperbarui. Silakan masuk dengan password baru Anda.
              </p>
              <Button className="w-full" onClick={() => navigate('/login', { replace: true })}>
                Ke Halaman Masuk
              </Button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
