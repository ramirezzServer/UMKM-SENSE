import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as profileApi from './api';
import { AUTH_KEYS } from '@/features/auth/hooks';
import type { UpdateProfileForm } from '@umkm-sense/shared';

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateProfileForm) => profileApi.updateProfile(payload),
    onSuccess: (user) => {
      qc.setQueryData(AUTH_KEYS.me, user);
    },
  });
}
