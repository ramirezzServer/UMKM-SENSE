import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ForgotPasswordForm, LoginForm, RegisterForm } from '@umkm-sense/shared';
import * as authApi from './api';
import type { AuthUser } from './types';

export const AUTH_KEYS = {
  me: ['me'] as const,
  districts: ['districts'] as const,
};

/**
 * Returns the currently authenticated user, or null when not logged in.
 * Error from the 401 response is swallowed — unauthenticated state is represented as null.
 */
export function useAuth() {
  return useQuery<AuthUser | null>({
    queryKey: AUTH_KEYS.me,
    queryFn: async () => {
      try {
        return await authApi.getMe();
      } catch {
        return null;
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useDistricts() {
  return useQuery({
    queryKey: AUTH_KEYS.districts,
    queryFn: authApi.getDistricts,
    staleTime: 30 * 60 * 1000,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: LoginForm) => authApi.login(payload),
    onSuccess: (user) => {
      qc.setQueryData(AUTH_KEYS.me, user);
    },
  });
}

export function useRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: RegisterForm) => authApi.register(payload),
    onSuccess: (user) => {
      qc.setQueryData(AUTH_KEYS.me, user);
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      qc.setQueryData(AUTH_KEYS.me, null);
      qc.removeQueries({ queryKey: AUTH_KEYS.me });
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (payload: ForgotPasswordForm) => authApi.forgotPassword(payload),
  });
}

export function useVerifyOtp() {
  return useMutation({
    mutationFn: (payload: { email: string; otp: string }) => authApi.verifyOtp(payload),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (payload: {
      email: string;
      otp: string;
      password: string;
      password_confirmation: string;
    }) => authApi.resetPassword(payload),
  });
}
