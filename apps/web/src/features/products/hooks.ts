import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as productsApi from './api';
import type { ProductFields } from './api';
import type { ProductFilters } from './types';

export const PRODUCT_KEYS = {
  all: ['products'] as const,
  list: (filters: ProductFilters) => ['products', 'list', filters] as const,
};

export function useProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: PRODUCT_KEYS.list(filters),
    queryFn: () => productsApi.getProducts(filters),
    placeholderData: keepPreviousData,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: productsApi.createProduct,
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUCT_KEYS.all }),
  });
}

type UpdatePayload = { id: number } & ProductFields;

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...fields }: UpdatePayload) => productsApi.updateProduct(id, fields),
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUCT_KEYS.all }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: productsApi.deleteProduct,
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUCT_KEYS.all }),
  });
}
