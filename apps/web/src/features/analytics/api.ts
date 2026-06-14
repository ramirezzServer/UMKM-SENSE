import api from '@/lib/api';
import type { PredictionCreateResponse, PredictionStatusResponse } from './types';

export interface PredictionPayload {
  product_id: number;
  prediction_start: string;
  prediction_end: string;
}

export async function createPrediction(
  payload: PredictionPayload
): Promise<PredictionCreateResponse> {
  const { data } = await api.post<PredictionCreateResponse>('/api/predictions', payload);
  return data;
}

export async function getPredictionStatus(id: number): Promise<PredictionStatusResponse> {
  const { data } = await api.get<PredictionStatusResponse>(`/api/predictions/${id}/status`);
  return data;
}
