import api from '@/lib/api';
import type { PredictionHistoryResponse } from './types';
import type { PredictionDetail } from '@/features/analytics/types';

export async function getPredictionHistory(page = 1): Promise<PredictionHistoryResponse> {
  const { data } = await api.get<PredictionHistoryResponse>('/api/predictions', {
    params: { page },
  });
  return data;
}

export async function getPredictionDetail(id: number): Promise<PredictionDetail> {
  const { data } = await api.get<{ data: PredictionDetail }>(`/api/predictions/${id}`);
  return data.data;
}
