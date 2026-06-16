import { useQuery } from '@tanstack/react-query';
import * as predictionsApi from './api';

export const PREDICTION_KEYS = {
  list: (page: number) => ['predictions', 'history', page] as const,
  detail: (id: number) => ['predictions', 'detail', id] as const,
};

export function usePredictionHistory(page = 1) {
  return useQuery({
    queryKey: PREDICTION_KEYS.list(page),
    queryFn: () => predictionsApi.getPredictionHistory(page),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

export function usePredictionDetail(id: number | null) {
  return useQuery({
    queryKey: PREDICTION_KEYS.detail(id ?? 0),
    queryFn: () => predictionsApi.getPredictionDetail(id!),
    enabled: id !== null && id > 0,
    staleTime: 5 * 60_000,
    retry: false,
  });
}
