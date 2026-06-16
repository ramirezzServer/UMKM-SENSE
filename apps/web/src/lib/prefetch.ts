import type { QueryClient } from '@tanstack/react-query';
import * as dashboardApi from '@/features/dashboard/api';
import { DASHBOARD_KEYS } from '@/features/dashboard/hooks';
import * as productsApi from '@/features/products/api';
import { PRODUCT_KEYS } from '@/features/products/hooks';
import * as salesApi from '@/features/sales/api';
import { SALES_KEYS } from '@/features/sales/hooks';
import * as predictionsApi from '@/features/predictions/api';
import { PREDICTION_KEYS } from '@/features/predictions/hooks';

/**
 * Prefetch data for a route on sidebar hover.
 * TanStack Query respects staleTime — stale data is not re-fetched,
 * so this is safe to call on every mouseenter.
 */
export function prefetchRoute(qc: QueryClient, path: string): void {
  switch (path) {
    case '/dashboard':
      void qc.prefetchQuery({
        queryKey: DASHBOARD_KEYS.summary,
        queryFn: dashboardApi.getSummary,
      });
      void qc.prefetchQuery({
        queryKey: DASHBOARD_KEYS.trend(7),
        queryFn: () => dashboardApi.getSalesTrend(7),
      });
      void qc.prefetchQuery({
        queryKey: DASHBOARD_KEYS.topProducts(7, 5),
        queryFn: () => dashboardApi.getTopProducts(7, 5),
      });
      void qc.prefetchQuery({
        queryKey: DASHBOARD_KEYS.conditions,
        queryFn: dashboardApi.getConditions,
      });
      void qc.prefetchQuery({
        queryKey: DASHBOARD_KEYS.tomorrowPrediction,
        queryFn: dashboardApi.getTomorrowPrediction,
      });
      break;

    case '/products':
      void qc.prefetchQuery({
        queryKey: PRODUCT_KEYS.list({}),
        queryFn: () => productsApi.getProducts({}),
      });
      break;

    case '/sales':
      void qc.prefetchQuery({
        queryKey: SALES_KEYS.list({}),
        queryFn: () => salesApi.getTransactions({}),
      });
      break;

    case '/analytics':
      void qc.prefetchQuery({
        queryKey: SALES_KEYS.selectProducts,
        queryFn: salesApi.getSelectProducts,
        staleTime: 2 * 60 * 1000,
      });
      break;

    case '/predictions':
      void qc.prefetchQuery({
        queryKey: PREDICTION_KEYS.list(1),
        queryFn: () => predictionsApi.getPredictionHistory(1),
        staleTime: 30_000,
      });
      break;
  }
}
