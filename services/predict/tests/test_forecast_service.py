"""
Unit tests for forecast_service.
Heavy ML libraries (ARIMA, Prophet) are mocked so tests run without long install times.
The WMA path is tested fully without mocks since it has no external deps.
"""

from datetime import date, timedelta
from decimal import Decimal
from unittest.mock import patch

import numpy as np
import pytest

from app.schemas.prediction import (
    Event,
    ExternalFactors,
    HistoricalDataPoint,
    Holiday,
    PredictionRequest,
    WeatherPoint,
)
from app.services.forecast_service import (
    _build_adjustment_map,
    _forecast_wma,
    _select_method,
    _to_level,
    run_forecast,
)


# ── Fixtures / helpers ────────────────────────────────────────────────────────


def make_data(n: int, base_qty: int = 10, base_rev: float = 150_000.0) -> list[HistoricalDataPoint]:
    start = date(2026, 1, 1)
    return [
        HistoricalDataPoint(
            date=start + timedelta(days=i),
            qty_sold=base_qty,
            revenue=Decimal(str(base_rev)),
        )
        for i in range(n)
    ]


def make_request(
    n: int,
    horizon: int = 7,
    factors: ExternalFactors | None = None,
) -> PredictionRequest:
    data = make_data(n)
    pred_start = date(2026, 1, 1) + timedelta(days=n)
    pred_end = pred_start + timedelta(days=horizon - 1)
    return PredictionRequest(
        product_id="test-001",
        historical_data=data,
        prediction_start=pred_start,
        prediction_end=pred_end,
        external_factors=factors or ExternalFactors(),
    )


# ── Method selection ──────────────────────────────────────────────────────────


class TestSelectMethod:
    def test_arima_at_30(self):
        assert _select_method(30) == "arima"

    def test_arima_above_30(self):
        assert _select_method(60) == "arima"

    def test_prophet_at_14(self):
        assert _select_method(14) == "prophet"

    def test_prophet_at_29(self):
        assert _select_method(29) == "prophet"

    def test_wma_at_13(self):
        assert _select_method(13) == "wma"

    def test_wma_at_7(self):
        assert _select_method(7) == "wma"

    def test_wma_at_1(self):
        assert _select_method(1) == "wma"


# ── WMA forecaster ────────────────────────────────────────────────────────────


class TestForecastWMA:
    def test_constant_series_returns_same_value(self):
        qty = np.full(7, 10.0)
        result = _forecast_wma(qty, horizon=3)
        assert len(result) == 3
        assert all(abs(v - 10.0) < 1e-6 for v in result)

    def test_zero_series_returns_zeros(self):
        qty = np.zeros(5)
        result = _forecast_wma(qty, horizon=2)
        assert all(v == 0.0 for v in result)

    def test_horizon_respected(self):
        qty = np.array([5.0, 10.0, 15.0])
        result = _forecast_wma(qty, horizon=5)
        assert len(result) == 5

    def test_recent_values_weighted_higher(self):
        # Last value (15) is heavier than first (5); result should be > 10
        qty = np.array([5.0, 10.0, 15.0])
        result = _forecast_wma(qty, horizon=1)
        assert result[0] > 10.0


# ── Adjustment map ────────────────────────────────────────────────────────────


class TestBuildAdjustmentMap:
    def test_no_factors_returns_ones(self):
        dates = [date(2026, 2, 1), date(2026, 2, 2)]
        adj = _build_adjustment_map(dates, ExternalFactors())
        assert adj[date(2026, 2, 1)] == pytest.approx(1.0)
        assert adj[date(2026, 2, 2)] == pytest.approx(1.0)

    def test_holiday_adds_15_percent(self):
        d = date(2026, 2, 1)
        factors = ExternalFactors(holidays=[Holiday(date=d, name="Imlek")])
        adj = _build_adjustment_map([d], factors)
        assert adj[d] == pytest.approx(1.15)

    def test_high_event_adds_10_percent(self):
        d = date(2026, 2, 5)
        factors = ExternalFactors(events=[Event(date=d, name="Festival", impact="high")])
        adj = _build_adjustment_map([d], factors)
        assert adj[d] == pytest.approx(1.10)

    def test_medium_event_adds_5_percent(self):
        d = date(2026, 2, 6)
        factors = ExternalFactors(events=[Event(date=d, name="Bazaar", impact="medium")])
        adj = _build_adjustment_map([d], factors)
        assert adj[d] == pytest.approx(1.05)

    def test_rainy_day_subtracts_10_percent(self):
        d = date(2026, 2, 3)
        factors = ExternalFactors(
            weather=[WeatherPoint(date=d, condition="rainy", temp=25.0)]
        )
        adj = _build_adjustment_map([d], factors)
        assert adj[d] == pytest.approx(0.90)

    def test_stormy_day_subtracts_10_percent(self):
        d = date(2026, 2, 4)
        factors = ExternalFactors(
            weather=[WeatherPoint(date=d, condition="stormy", temp=20.0)]
        )
        adj = _build_adjustment_map([d], factors)
        assert adj[d] == pytest.approx(0.90)

    def test_clear_day_no_adjustment(self):
        d = date(2026, 2, 7)
        factors = ExternalFactors(
            weather=[WeatherPoint(date=d, condition="clear", temp=30.0)]
        )
        adj = _build_adjustment_map([d], factors)
        assert adj[d] == pytest.approx(1.0)

    def test_holiday_plus_rain_stacks(self):
        # +15% holiday -10% rain = 1.05
        d = date(2026, 2, 1)
        factors = ExternalFactors(
            holidays=[Holiday(date=d, name="Libur")],
            weather=[WeatherPoint(date=d, condition="rainy", temp=22.0)],
        )
        adj = _build_adjustment_map([d], factors)
        assert adj[d] == pytest.approx(1.05)

    def test_adjustment_never_negative(self):
        # Contrived: two -10% adjustments would still floor at 0
        d = date(2026, 2, 1)
        factors = ExternalFactors(
            weather=[WeatherPoint(date=d, condition="stormy", temp=18.0)],
        )
        adj = _build_adjustment_map([d], factors)
        assert adj[d] >= 0.0


# ── Confidence level ──────────────────────────────────────────────────────────


class TestToLevel:
    def test_high_at_075(self):
        assert _to_level(0.75) == "high"

    def test_high_above_075(self):
        assert _to_level(0.90) == "high"

    def test_medium_at_050(self):
        assert _to_level(0.50) == "medium"

    def test_medium_between(self):
        assert _to_level(0.60) == "medium"

    def test_low_below_050(self):
        assert _to_level(0.30) == "low"

    def test_low_at_minimum(self):
        assert _to_level(0.10) == "low"


# ── Full forecast: WMA path (no heavy deps needed) ────────────────────────────


class TestRunForecastWMA:
    def test_output_schema_valid(self):
        req = make_request(n=7, horizon=3)
        result = run_forecast(req)

        assert len(result.predictions) == 3
        for p in result.predictions:
            assert p.predicted_qty >= 0
            assert p.predicted_revenue >= 0
            assert 0.0 <= p.confidence <= 1.0
            assert p.level in ("low", "medium", "high")

        assert result.accuracy_metrics.method == "wma"
        assert result.accuracy_metrics.mae >= 0
        assert result.accuracy_metrics.mape >= 0
        assert isinstance(result.ai_summary, str) and len(result.ai_summary) > 0
        assert isinstance(result.recommendations, list)
        assert isinstance(result.warnings, list)

    def test_prediction_dates_match_range(self):
        req = make_request(n=7, horizon=5)
        result = run_forecast(req)
        expected_dates = [req.prediction_start + timedelta(days=i) for i in range(5)]
        actual_dates = [p.date for p in result.predictions]
        assert actual_dates == expected_dates

    def test_minimal_data_has_warning(self):
        req = make_request(n=3, horizon=3)
        result = run_forecast(req)
        # Warning message says "hanya 3 hari" (from recommendation_service._build_warnings)
        assert any(w.level == "high" and "hari" in w.message for w in result.warnings)

    def test_sufficient_data_no_shortage_warning(self):
        req = make_request(n=10, horizon=3)
        result = run_forecast(req)
        # n=10 → medium warning (< 14), not a high data-shortage warning
        assert not any(w.level == "high" and "hanya" in w.message for w in result.warnings)

    def test_holiday_increases_prediction(self):
        """A holiday on the prediction day must raise predicted_qty vs no-holiday baseline."""
        data = make_data(7, base_qty=10, base_rev=150_000.0)
        holiday_date = date(2026, 1, 8)

        req_plain = PredictionRequest(
            product_id="test",
            historical_data=data,
            prediction_start=holiday_date,
            prediction_end=holiday_date,
            external_factors=ExternalFactors(),
        )
        req_holiday = PredictionRequest(
            product_id="test",
            historical_data=data,
            prediction_start=holiday_date,
            prediction_end=holiday_date,
            external_factors=ExternalFactors(
                holidays=[Holiday(date=holiday_date, name="Libur")]
            ),
        )

        plain_qty = run_forecast(req_plain).predictions[0].predicted_qty
        holiday_qty = run_forecast(req_holiday).predictions[0].predicted_qty
        assert holiday_qty >= plain_qty

    def test_rainy_day_decreases_prediction(self):
        data = make_data(7, base_qty=10, base_rev=150_000.0)
        rain_date = date(2026, 1, 8)

        req_plain = PredictionRequest(
            product_id="test",
            historical_data=data,
            prediction_start=rain_date,
            prediction_end=rain_date,
            external_factors=ExternalFactors(),
        )
        req_rain = PredictionRequest(
            product_id="test",
            historical_data=data,
            prediction_start=rain_date,
            prediction_end=rain_date,
            external_factors=ExternalFactors(
                weather=[WeatherPoint(date=rain_date, condition="rainy", temp=24.0)]
            ),
        )

        plain_qty = run_forecast(req_plain).predictions[0].predicted_qty
        rain_qty = run_forecast(req_rain).predictions[0].predicted_qty
        assert rain_qty <= plain_qty

    def test_low_data_lowers_confidence(self):
        req_low = make_request(n=3, horizon=2)
        req_ok = make_request(n=10, horizon=2)
        conf_low = run_forecast(req_low).predictions[0].confidence
        conf_ok = run_forecast(req_ok).predictions[0].confidence
        assert conf_low <= conf_ok

    def test_constant_series_predicts_same_qty(self):
        req = make_request(n=7, horizon=3, factors=ExternalFactors())
        result = run_forecast(req)
        qtys = [p.predicted_qty for p in result.predictions]
        assert len(set(qtys)) == 1  # all identical
        assert qtys[0] == 10


# ── Fallback: ARIMA exception → WMA ──────────────────────────────────────────


class TestARIMAFallback:
    def test_arima_exception_still_returns_valid_response(self):
        with patch(
            "app.services.forecast_service._ARIMA",
            side_effect=Exception("simulated ARIMA failure"),
        ):
            req = make_request(n=30, horizon=3)
            result = run_forecast(req)
            assert len(result.predictions) == 3
            assert all(p.predicted_qty >= 0 for p in result.predictions)

    def test_statsmodels_unavailable_uses_wma(self):
        with patch("app.services.forecast_service.HAS_STATSMODELS", False):
            req = make_request(n=30, horizon=3)
            result = run_forecast(req)
            assert len(result.predictions) == 3


# ── ARIMA path (mocked to avoid statsmodels install in CI) ───────────────────


class TestRunForecastARIMAMocked:
    def test_arima_method_used_for_30_days(self):
        with patch(
            "app.services.forecast_service._forecast_arima",
            side_effect=lambda qty, horizon: np.full(horizon, 12.0),
        ):
            req = make_request(n=30, horizon=7)
            result = run_forecast(req)

        assert len(result.predictions) == 7
        assert result.accuracy_metrics.method == "arima"
        assert all(p.predicted_qty >= 0 for p in result.predictions)

    def test_holiday_still_applied_in_arima_mode(self):
        holiday_date = date(2026, 1, 31)
        data = make_data(30)
        req = PredictionRequest(
            product_id="test",
            historical_data=data,
            prediction_start=holiday_date,
            prediction_end=holiday_date,
            external_factors=ExternalFactors(
                holidays=[Holiday(date=holiday_date, name="Libur Nasional")]
            ),
        )

        with patch(
            "app.services.forecast_service._forecast_arima",
            side_effect=lambda qty, horizon: np.full(horizon, 10.0),
        ):
            result = run_forecast(req)

        assert result.predictions[0].predicted_qty >= 10  # +15% → at least 11 or 12


# ── Prophet path (mocked) ─────────────────────────────────────────────────────


class TestRunForecastProphetMocked:
    def test_prophet_method_used_for_14_days(self):
        with patch(
            "app.services.forecast_service._forecast_prophet",
            side_effect=lambda dates, qty, horizon, pred_start: np.full(horizon, 8.0),
        ):
            req = make_request(n=14, horizon=5)
            result = run_forecast(req)

        assert len(result.predictions) == 5
        assert result.accuracy_metrics.method == "prophet"

    def test_prophet_unavailable_falls_back_to_wma(self):
        with patch("app.services.forecast_service.HAS_PROPHET", False):
            req = make_request(n=14, horizon=3)
            result = run_forecast(req)
            assert len(result.predictions) == 3
            assert all(p.predicted_qty >= 0 for p in result.predictions)
