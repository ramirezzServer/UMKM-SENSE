import { useMutation, useQuery } from '@tanstack/react-query';
import * as analyticsApi from './api';
import type { PredictionPayload } from './api';

export const ANALYTICS_KEYS = {
  status: (id: number) => ['predictions', 'status', id] as const,
};

export function useCreatePrediction() {
  return useMutation({
    mutationFn: (payload: PredictionPayload) => analyticsApi.createPrediction(payload),
  });
}

export function usePredictionStatus(id: number | null) {
  return useQuery({
    queryKey: ANALYTICS_KEYS.status(id ?? 0),
    queryFn: () => analyticsApi.getPredictionStatus(id!),
    enabled: id !== null,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'pending' || status === 'processing') return 2000;
      return false;
    },
    retry: false,
    staleTime: 0,
  });
}
