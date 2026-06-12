import api from '@/lib/api';
import type { PaginatedProducts, Product, ProductFilters } from './types';

export async function getProducts(filters: ProductFilters = {}): Promise<PaginatedProducts> {
  const params: Record<string, string | number> = {};
  if (filters.search) params.search = filters.search;
  if (filters.status) params.status = filters.status;
  if (filters.page && filters.page > 1) params.page = filters.page;
  const { data } = await api.get<PaginatedProducts>('/api/products', { params });
  return data;
}

export interface ProductFields {
  name: string;
  category?: string;
  price: number;
  current_stock: number;
  status: 'active' | 'inactive';
  image?: File | null;
}

function toFormData(fields: ProductFields): FormData {
  const fd = new FormData();
  fd.append('name', fields.name);
  if (fields.category) fd.append('category', fields.category);
  fd.append('price', String(fields.price));
  fd.append('current_stock', String(fields.current_stock));
  fd.append('status', fields.status);
  if (fields.image) fd.append('image', fields.image);
  return fd;
}

export async function createProduct(fields: ProductFields): Promise<Product> {
  const { data } = await api.post<{ data: Product }>('/api/products', toFormData(fields));
  return data.data;
}

export async function updateProduct(id: number, fields: ProductFields): Promise<Product> {
  const fd = toFormData(fields);
  fd.append('_method', 'PATCH');
  const { data } = await api.post<{ data: Product }>(`/api/products/${id}`, fd);
  return data.data;
}

export async function deleteProduct(id: number): Promise<{ message: string }> {
  const { data } = await api.delete<{ message: string }>(`/api/products/${id}`);
  return data;
}
