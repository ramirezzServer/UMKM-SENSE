import api from '@/lib/api';
import type {
  DashboardConditions,
  DashboardSummary,
  TopProduct,
  TomorrowPrediction,
  TrendDay,
} from './types';

export async function getSummary(): Promise<DashboardSummary> {
  const { data } = await api.get<{ data: DashboardSummary }>('/api/dashboard/summary');
  return data.data;
}

export async function getSalesTrend(days = 7): Promise<TrendDay[]> {
  const { data } = await api.get<{ data: TrendDay[] }>('/api/dashboard/trend', {
    params: { days },
  });
  return data.data;
}

export async function getTopProducts(days = 7, limit = 5): Promise<TopProduct[]> {
  const { data } = await api.get<{ data: TopProduct[] }>('/api/dashboard/top-products', {
    params: { days, limit },
  });
  return data.data;
}

export async function getConditions(): Promise<DashboardConditions> {
  const { data } = await api.get<{ data: DashboardConditions }>('/api/dashboard/conditions');
  return data.data;
}

export async function getTomorrowPrediction(): Promise<TomorrowPrediction> {
  const { data } = await api.get<{ data: TomorrowPrediction }>(
    '/api/dashboard/tomorrow-prediction'
  );
  return data.data;
}
