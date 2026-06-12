import api from '@/lib/api';
import type {
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
