import axios from 'axios';
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';

/**
 * Maps Laravel 422 validation errors onto react-hook-form fields.
 * Returns a human-readable string for any non-422 error, or null when all
 * errors were successfully mapped to individual fields.
 */
export function applyServerErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>
): string | null {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;

    if (status === 422) {
      const errors = (error.response?.data?.errors ?? {}) as Record<string, string[]>;
      let anyMapped = false;
      for (const [field, messages] of Object.entries(errors)) {
        setError(field as Path<T>, { type: 'server', message: messages[0] });
        anyMapped = true;
      }
      if (!anyMapped) {
        return error.response?.data?.message ?? 'Validasi gagal.';
      }
      return null;
    }

    if (status === 429) {
      return error.response?.data?.message ?? 'Terlalu banyak percobaan. Coba lagi nanti.';
    }
  }

  return 'Terjadi kesalahan. Silakan coba lagi.';
}
