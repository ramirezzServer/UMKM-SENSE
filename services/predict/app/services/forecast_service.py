"""
Forecast service — method auto-selection:
  n >= 30  → ARIMA(1,1,1) via statsmodels
  14–29    → Prophet (weekly seasonality)
  7–13     → Weighted Moving Average
  < 7      → WMA + data-insufficient warning

External factor adjustments (applied on top of baseline):
  national holiday     → +15%
  high-impact event    → +10%
  medium-impact event  → +5%
  rainy / stormy day   → -10%

Accuracy is estimated via a simple 80/20 walk-forward backtest.
"""

import logging
from datetime import date, timedelta
from decimal import Decimal
from typing import Literal

import numpy as np

from app.schemas.prediction import (
    AccuracyMetrics,
    ExternalFactors,
    HistoricalDataPoint,
    PredictionPoint,
    PredictionRequest,
    PredictionResponse,
)

logger = logging.getLogger(__name__)

# Optional heavy deps — imported at module level so tests can patch them cleanly.
try:
    from statsmodels.tsa.arima.model import ARIMA as _ARIMA

    HAS_STATSMODELS = True
except ImportError:
    _ARIMA = None  # type: ignore[assignment,misc]
    HAS_STATSMODELS = False

try:
    from prophet import Prophet as _Prophet

    HAS_PROPHET = True
except ImportError:
    _Prophet = None  # type: ignore[assignment,misc]
    HAS_PROPHET = False

MethodName = Literal["arima", "prophet", "wma"]


# ── Method selection ──────────────────────────────────────────────────────────


def _select_method(n: int) -> MethodName:
    if n >= 30:
        return "arima"
    if n >= 14:
        return "prophet"
    return "wma"


# ── Data helpers ──────────────────────────────────────────────────────────────


def _build_series(
    data: list[HistoricalDataPoint],
) -> tuple[list[date], np.ndarray, np.ndarray]:
    sorted_data = sorted(data, key=lambda x: x.date)
    dates = [d.date for d in sorted_data]
    qty = np.array([d.qty_sold for d in sorted_data], dtype=float)
    revenue = np.array([float(d.revenue) for d in sorted_data], dtype=float)
    return dates, qty, revenue


def _avg_price(data: list[HistoricalDataPoint]) -> float:
    total_qty = sum(d.qty_sold for d in data)
    total_rev = sum(float(d.revenue) for d in data)
    return total_rev / total_qty if total_qty > 0 else 0.0


# ── Baseline forecasters ──────────────────────────────────────────────────────


def _forecast_arima(qty: np.ndarray, horizon: int) -> np.ndarray:
    if not HAS_STATSMODELS or _ARIMA is None:
        logger.warning("statsmodels not available, falling back to WMA")
        return _forecast_wma(qty, horizon)
    try:
        model = _ARIMA(qty, order=(1, 1, 1))
        result = model.fit()
        forecast = result.forecast(steps=horizon)
        return np.maximum(forecast, 0.0)
    except Exception as exc:
        logger.warning("ARIMA fit failed (%s), falling back to WMA", exc)
        return _forecast_wma(qty, horizon)


def _forecast_prophet(
    dates: list[date],
    qty: np.ndarray,
    horizon: int,
    pred_start: date,
) -> np.ndarray:
    if not HAS_PROPHET or _Prophet is None:
        logger.warning("Prophet not available, falling back to WMA")
        return _forecast_wma(qty, horizon)
    try:
        import pandas as pd  # pandas is always available with prophet

        df = pd.DataFrame({"ds": pd.to_datetime(dates), "y": qty})
        m = _Prophet(
            daily_seasonality=False,
            weekly_seasonality=len(qty) >= 7,
            yearly_seasonality=False,
            interval_width=0.8,
            # Silence noisy Stan output
            stan_backend="CMDSTANPY",
        )
        import warnings

        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            m.fit(df)

        future_dates = [pred_start + timedelta(days=i) for i in range(horizon)]
        future_df = pd.DataFrame({"ds": pd.to_datetime(future_dates)})
        forecast_df = m.predict(future_df)
        return np.maximum(forecast_df["yhat"].values, 0.0)
    except Exception as exc:
        logger.warning("Prophet fit failed (%s), falling back to WMA", exc)
        return _forecast_wma(qty, horizon)


def _forecast_wma(qty: np.ndarray, horizon: int) -> np.ndarray:
    window = min(len(qty), 7)
    recent = qty[-window:]
    weights = np.arange(1, window + 1, dtype=float)
    wma = float(np.dot(weights, recent) / weights.sum())
    return np.full(horizon, max(wma, 0.0))


# ── External factor adjustments ───────────────────────────────────────────────


def _build_adjustment_map(
    pred_dates: list[date],
    factors: ExternalFactors,
) -> dict[date, float]:
    holiday_dates = {h.date for h in factors.holidays}
    high_event_dates = {e.date for e in factors.events if e.impact == "high"}
    medium_event_dates = {e.date for e in factors.events if e.impact == "medium"}
    bad_weather_dates = {
        w.date for w in factors.weather if w.condition in ("rainy", "stormy")
    }

    result: dict[date, float] = {}
    for d in pred_dates:
        mult = 1.0
        if d in holiday_dates:
            mult += 0.15
        if d in high_event_dates:
            mult += 0.10
        elif d in medium_event_dates:
            mult += 0.05
        if d in bad_weather_dates:
            mult -= 0.10
        result[d] = max(mult, 0.0)
    return result


# ── Accuracy via walk-forward backtest ────────────────────────────────────────


def _compute_accuracy(
    method: MethodName,
    dates: list[date],
    qty: np.ndarray,
) -> tuple[float, float, float]:
    """Returns (mae, mape, base_confidence)."""
    n = len(qty)
    if n < 4:
        return 0.0, 99.0, 0.40

    test_size = max(1, int(n * 0.2))
    train_qty = qty[:-test_size]
    test_qty = qty[-test_size:]
    train_dates = dates[:-test_size]

    try:
        if method == "arima":
            preds = _forecast_arima(train_qty, test_size)
        elif method == "prophet":
            preds = _forecast_prophet(train_dates, train_qty, test_size, dates[-test_size])
        else:
            preds = _forecast_wma(train_qty, test_size)
    except Exception:
        return 0.0, 99.0, 0.40

    mae = float(np.mean(np.abs(preds - test_qty)))
    nonzero = test_qty != 0
    mape = (
        float(np.mean(np.abs((preds[nonzero] - test_qty[nonzero]) / test_qty[nonzero])) * 100)
        if nonzero.any()
        else 0.0
    )

    if mape < 10:
        base_conf = 0.85
    elif mape < 25:
        base_conf = 0.65
    else:
        base_conf = 0.40

    return mae, mape, base_conf


def _confidence_penalty(n: int) -> float:
    if n < 7:
        return -0.25
    if n < 14:
        return -0.15
    if n < 30:
        return -0.05
    return 0.0


def _to_level(confidence: float) -> Literal["low", "medium", "high"]:
    if confidence >= 0.75:
        return "high"
    if confidence >= 0.50:
        return "medium"
    return "low"


# ── Summary & recommendations ─────────────────────────────────────────────────


def _build_summary(method: MethodName, n: int, mape: float, has_warnings: bool) -> str:
    label = {"arima": "ARIMA", "prophet": "Prophet", "wma": "Rata-rata Berbobot (WMA)"}[method]
    quality = (
        "cukup akurat" if mape < 15 else ("perlu diperhatikan" if mape < 30 else "perkiraan kasar")
    )
    summary = (
        f"Prediksi menggunakan metode {label} berdasarkan {n} hari data historis. "
        f"Backtesting menunjukkan MAPE {mape:.1f}% — hasil {quality}."
    )
    if has_warnings:
        summary += " Harap perhatikan peringatan yang tersedia."
    return summary


def _build_recommendations(
    n: int,
    mape: float,
    adjustment_map: dict[date, float],
) -> list[str]:
    recs: list[str] = []

    if n < 14:
        recs.append(
            "Kumpulkan minimal 14 hari data historis agar prediksi lebih akurat."
        )
    elif mape > 25:
        recs.append(
            "MAPE tinggi — pastikan data historis bersih dan tidak ada anomali transaksi."
        )

    boost_days = sum(1 for v in adjustment_map.values() if v > 1.0)
    if boost_days:
        recs.append(
            f"Ada {boost_days} hari dengan potensi peningkatan penjualan (libur/event) — "
            "siapkan stok lebih untuk mengantisipasi lonjakan."
        )

    slow_days = sum(1 for v in adjustment_map.values() if v < 1.0)
    if slow_days:
        recs.append(
            f"Ada {slow_days} hari perkiraan hujan — pertimbangkan promosi khusus."
        )

    if not recs:
        recs.append("Kondisi prediksi stabil — pertahankan manajemen stok dan harga saat ini.")

    return recs


# ── Public entry point ────────────────────────────────────────────────────────


def run_forecast(req: PredictionRequest) -> PredictionResponse:
    data = req.historical_data
    n = len(data)
    dates, qty, _ = _build_series(data)
    avg_price = _avg_price(data)

    warnings_out: list[str] = []
    if n < 7:
        warnings_out.append(
            "Data historis kurang dari 7 hari — prediksi merupakan estimasi kasar "
            "dan mungkin tidak andal."
        )

    method = _select_method(n)

    # Build prediction date range
    pred_dates: list[date] = []
    current = req.prediction_start
    while current <= req.prediction_end:
        pred_dates.append(current)
        current += timedelta(days=1)
    horizon = len(pred_dates)

    # Baseline forecast
    if method == "arima":
        baseline = _forecast_arima(qty, horizon)
    elif method == "prophet":
        baseline = _forecast_prophet(dates, qty, horizon, req.prediction_start)
    else:
        baseline = _forecast_wma(qty, horizon)

    # Accuracy metrics via backtest
    mae, mape, base_conf = _compute_accuracy(method, dates, qty)
    day_confidence = round(max(0.10, min(1.0, base_conf + _confidence_penalty(n))), 2)

    # External factor adjustments
    adjustment_map = _build_adjustment_map(pred_dates, req.external_factors)

    # Build per-day predictions
    predictions: list[PredictionPoint] = []
    for i, d in enumerate(pred_dates):
        mult = adjustment_map[d]
        adj_qty = max(0, round(float(baseline[i]) * mult))
        adj_revenue = Decimal(str(round(adj_qty * avg_price, 2)))
        predictions.append(
            PredictionPoint(
                date=d,
                predicted_qty=adj_qty,
                predicted_revenue=adj_revenue,
                confidence=day_confidence,
                level=_to_level(day_confidence),
            )
        )

    return PredictionResponse(
        predictions=predictions,
        accuracy_metrics=AccuracyMetrics(
            method=method,
            mae=round(mae, 2),
            mape=round(mape, 2),
        ),
        ai_summary=_build_summary(method, n, mape, bool(warnings_out)),
        recommendations=_build_recommendations(n, mape, adjustment_map),
        warnings=warnings_out,
    )
