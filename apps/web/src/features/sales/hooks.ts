import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as salesApi from './api';
import type { TransactionPayload } from './api';
import type { TransactionFilters } from './types';

export const SALES_KEYS = {
  all: ['transactions'] as const,
  list: (filters: TransactionFilters) => ['transactions', 'list', filters] as const,
  selectProducts: ['products', 'select'] as const,
};

export function useTransactions(filters: TransactionFilters = {}) {
  return useQuery({
    queryKey: SALES_KEYS.list(filters),
    queryFn: () => salesApi.getTransactions(filters),
    placeholderData: keepPreviousData,
  });
}

export function useSelectProducts() {
  return useQuery({
    queryKey: SALES_KEYS.selectProducts,
    queryFn: salesApi.getSelectProducts,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: salesApi.createTransaction,
    onSuccess: () => qc.invalidateQueries({ queryKey: SALES_KEYS.all }),
  });
}

type UpdatePayload = { id: number } & TransactionPayload;

export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdatePayload) => salesApi.updateTransaction(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: SALES_KEYS.all }),
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: salesApi.deleteTransaction,
    onSuccess: () => qc.invalidateQueries({ queryKey: SALES_KEYS.all }),
  });
}
