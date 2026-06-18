import api from '@/lib/api';
import type { AuthUser } from '@/features/auth/types';
import type { UpdateProfileForm } from '@umkm-sense/shared';

export async function updateProfile(payload: UpdateProfileForm): Promise<AuthUser> {
  const { data } = await api.put<{ data: AuthUser }>('/api/profile', payload);
  return data.data;
}
