import api from '@/lib/api';
import axios from 'axios';
import type {
  ImportConfirmResponse,
  ImportPreviewResponse,
  PaginatedTransactions,
  SelectProduct,
  Transaction,
  TransactionFilters,
} from './types';

export async function getTransactions(
  filters: TransactionFilters = {}
): Promise<PaginatedTransactions> {
  const params: Record<string, string | number> = {};
  if (filters.status) params.status = filters.status;
  if (filters.date_from) params.date_from = filters.date_from;
  if (filters.date_to) params.date_to = filters.date_to;
  if (filters.page && filters.page > 1) params.page = filters.page;
  const { data } = await api.get<PaginatedTransactions>('/api/transactions', { params });
  return data;
}

export async function getSelectProducts(): Promise<SelectProduct[]> {
  const { data } = await api.get<{ data: SelectProduct[] }>('/api/products/select');
  return data.data;
}

export interface TransactionPayload {
  customer_name?: string;
  transaction_date: string;
  payment_method: 'Transfer' | 'Cash' | 'QRIS';
  status: 'success' | 'pending' | 'failed';
  items: { product_id: number; qty: number }[];
}

export async function createTransaction(payload: TransactionPayload): Promise<Transaction> {
  const { data } = await api.post<{ data: Transaction }>('/api/transactions', payload);
  return data.data;
}

export async function updateTransaction(
  id: number,
  payload: TransactionPayload
): Promise<Transaction> {
  const { data } = await api.patch<{ data: Transaction }>(`/api/transactions/${id}`, payload);
  return data.data;
}

export async function deleteTransaction(id: number): Promise<{ message: string }> {
  const { data } = await api.delete<{ message: string }>(`/api/transactions/${id}`);
  return data;
}

// ─── Import flow ──────────────────────────────────────────────────────────────

export async function downloadTemplate(): Promise<void> {
  const response = await api.get('/api/transactions/import/template', {
    responseType: 'blob',
  });
  const blob = new Blob([response.data as BlobPart], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'template_transaksi.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function previewImport(file: File): Promise<ImportPreviewResponse> {
  const fd = new FormData();
  fd.append('file', file);
  const { data } = await api.post<ImportPreviewResponse>('/api/transactions/import/preview', fd);
  return data;
}

export async function confirmImport(token: string): Promise<ImportConfirmResponse> {
  const { data } = await api.post<ImportConfirmResponse>('/api/transactions/import/confirm', {
    preview_token: token,
  });
  return data;
}

export function extractImportError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const body = err.response?.data as Record<string, unknown> | undefined;
    if (status === 422) {
      const fileErrors = (body?.errors as Record<string, string[]> | undefined)?.file;
      if (fileErrors?.[0]) return fileErrors[0];
      const msg = body?.message as string | undefined;
      if (msg) return msg;
      return 'File tidak valid. Periksa format, header, dan isi file.';
    }
    const msg = body?.message as string | undefined;
    if (msg) return msg;
    if (status === 413) return 'Ukuran file terlalu besar untuk diunggah.';
  }
  return 'Terjadi kesalahan tak terduga. Silakan coba lagi.';
}
