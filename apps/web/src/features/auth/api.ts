import api from '@/lib/api';
import type { ForgotPasswordForm, LoginForm, RegisterForm } from '@umkm-sense/shared';
import type { AuthUser, District } from './types';

// Derive app origin from the API base URL (strip path like /api)
const APP_ORIGIN = new URL(import.meta.env.VITE_API_URL as string).origin;

/** Must be called before any state-changing Sanctum SPA request to get the CSRF cookie. */
async function fetchCsrfCookie(): Promise<void> {
  await api.get(`${APP_ORIGIN}/sanctum/csrf-cookie`);
}

export async function getMe(): Promise<AuthUser> {
  const { data } = await api.get<{ data: AuthUser }>('/api/me');
  return data.data;
}

export async function login(payload: LoginForm): Promise<AuthUser> {
  await fetchCsrfCookie();
  const { data } = await api.post<{ data: AuthUser }>('/api/login', payload);
  return data.data;
}

export async function register(payload: RegisterForm): Promise<AuthUser> {
  await fetchCsrfCookie();
  const { data } = await api.post<{ data: AuthUser }>('/api/register', payload);
  return data.data;
}

export async function logout(): Promise<void> {
  await api.post('/api/logout');
}

export async function forgotPassword(payload: ForgotPasswordForm): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>('/api/forgot-password', payload);
  return data;
}

export async function verifyOtp(payload: {
  email: string;
  otp: string;
}): Promise<{ verified: boolean }> {
  const { data } = await api.post<{ verified: boolean }>('/api/verify-otp', payload);
  return data;
}

export async function resetPassword(payload: {
  email: string;
  otp: string;
  password: string;
  password_confirmation: string;
}): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>('/api/reset-password', payload);
  return data;
}

export async function getDistricts(): Promise<District[]> {
  const { data } = await api.get<District[]>('/api/districts');
  return data;
}
