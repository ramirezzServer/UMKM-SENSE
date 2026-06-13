import { useQuery } from '@tanstack/react-query';
import * as dashboardApi from './api';

export const DASHBOARD_KEYS = {
  summary: ['dashboard', 'summary'] as const,
  trend: (days: number) => ['dashboard', 'trend', days] as const,
  topProducts: (days: number, limit: number) => ['dashboard', 'top-products', days, limit] as const,
  conditions: ['dashboard', 'conditions'] as const,
};

const TWO_MINUTES = 2 * 60 * 1000;
const TEN_MINUTES = 10 * 60 * 1000;

export function useDashboardSummary() {
  return useQuery({
    queryKey: DASHBOARD_KEYS.summary,
    queryFn: dashboardApi.getSummary,
    staleTime: TWO_MINUTES,
  });
}

export function useSalesTrend(days = 7) {
  return useQuery({
    queryKey: DASHBOARD_KEYS.trend(days),
    queryFn: () => dashboardApi.getSalesTrend(days),
    staleTime: TWO_MINUTES,
  });
}

export function useTopProducts(days = 7, limit = 5) {
  return useQuery({
    queryKey: DASHBOARD_KEYS.topProducts(days, limit),
    queryFn: () => dashboardApi.getTopProducts(days, limit),
    staleTime: TWO_MINUTES,
  });
}

export function useConditions() {
  return useQuery({
    queryKey: DASHBOARD_KEYS.conditions,
    queryFn: dashboardApi.getConditions,
    staleTime: TEN_MINUTES,
  });
}
