export interface PredictionHistorySummary {
  id: number;
  product_id: number;
  product_name: string;
  status: 'pending' | 'processing' | 'done' | 'failed';
  prediction_start: string;
  prediction_end: string;
  forecast_method: string | null;
  mape: number | null;
  growth_pct: number | null;
  created_at: string;
}

export interface PredictionHistoryMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface PredictionHistoryResponse {
  data: PredictionHistorySummary[];
  meta: PredictionHistoryMeta;
}
