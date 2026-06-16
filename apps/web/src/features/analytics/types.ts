export interface PredictionCreateResponse {
  prediction_id: number;
  status: 'pending';
  message: string;
}

export interface PredictionPoint {
  date: string;
  predicted_qty: number;
  predicted_revenue: string;
  confidence: number;
  level: 'low' | 'medium' | 'high';
}

export interface AccuracyMetrics {
  method: 'arima' | 'prophet' | 'wma';
  mae: number;
  mape: number;
}

export interface PredictionRecommendation {
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
}

export interface PredictionWarning {
  level: 'high' | 'medium' | 'low';
  message: string;
}

export interface PredictionDetail {
  product_id: number;
  product_name?: string;
  prediction_start: string;
  prediction_end: string;
  forecast_method: string;
  mae: number;
  mape: number;
  ai_summary: string;
  items: PredictionPoint[];
  recommendations: PredictionRecommendation[];
  warnings: PredictionWarning[];
}

export type PredictionStatusResponse =
  | { status: 'pending' | 'processing'; prediction_id: number; error?: null }
  | { status: 'done'; prediction_id?: number; prediction: PredictionDetail }
  | { status: 'failed'; prediction_id?: number; error: string | null };
