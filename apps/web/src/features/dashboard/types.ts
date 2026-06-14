export interface Comparison {
  pct: number | null;
  direction: 'up' | 'down' | null;
}

export interface DashboardSummary {
  total_penjualan: number;
  jumlah_transaksi: number;
  rata_rata_per_transaksi: number;
  vs_kemarin: {
    total_penjualan: Comparison;
    jumlah_transaksi: Comparison;
    rata_rata_per_transaksi: Comparison;
  };
}

export interface TrendDay {
  date: string;
  day_label: string;
  total: number;
  count: number;
}

export interface TopProduct {
  product_id: number;
  product_name: string;
  total_qty: number;
  total_revenue: number;
  vs_sebelumnya: Comparison;
}

export interface WeatherCondition {
  district: string;
  date: string;
  condition: 'clear' | 'cloudy' | 'rainy' | 'stormy';
  temp_min: number | null;
  temp_max: number | null;
  precipitation: number | null;
  weather_code: number | null;
}

export interface HolidayEvent {
  date: string;
  name: string;
  year: number;
}

export interface DashboardConditions {
  cuaca: WeatherCondition | null;
  events: HolidayEvent[];
}

export type TomorrowPrediction =
  | { has_prediction: false }
  | {
      has_prediction: true;
      prediction_log_id: number;
      product_id: number;
      predicted_revenue: number;
      predicted_qty: number;
      confidence: number;
      level: 'low' | 'medium' | 'high';
      forecast_method: string;
      mape: number;
      top_recommendation: { priority: 'high' | 'medium' | 'low'; title: string } | null;
    };
