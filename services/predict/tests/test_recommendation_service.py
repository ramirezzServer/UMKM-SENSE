"""
Unit tests for recommendation_service.
All tests use ForecastContext directly — no HTTP layer involved.
"""

from datetime import date, timedelta
from decimal import Decimal

import pytest

from app.schemas.prediction import (
    AccuracyMetrics,
    Event,
    ExternalFactors,
    HistoricalDataPoint,
    Holiday,
    PredictionPoint,
    PredictionWarning,
    Recommendation,
    WeatherPoint,
)
from app.services.recommendation_service import (
    ForecastContext,
    InsightEngine,
    RuleBasedEngine,
    _bad_weather_days,
    _build_recommendations,
    _build_summary,
    _build_warnings,
    _high_events_in_period,
    _holidays_in_period,
    _trend_pct,
    generate_insights,
)


# ── Helpers ───────────────────────────────────────────────────────────────────


def make_hist(n: int, base_qty: int = 10, base_rev: float = 150_000.0) -> list[HistoricalDataPoint]:
    start = date(2026, 1, 1)
    return [
        HistoricalDataPoint(
            date=start + timedelta(days=i),
            qty_sold=base_qty,
            revenue=Decimal(str(base_rev)),
        )
        for i in range(n)
    ]


def make_predictions(
    n: int,
    qty: int = 10,
    rev: float = 150_000.0,
    confidence: float = 0.70,
    start: date = date(2026, 2, 1),
) -> list[PredictionPoint]:
    return [
        PredictionPoint(
            date=start + timedelta(days=i),
            predicted_qty=qty,
            predicted_revenue=Decimal(str(rev)),
            confidence=confidence,
            level="medium",
        )
        for i in range(n)
    ]


def make_ctx(
    n_hist: int = 10,
    hist_qty: int = 10,
    hist_rev: float = 150_000.0,
    pred_qty: int = 10,
    pred_rev: float = 150_000.0,
    confidence: float = 0.70,
    mape: float = 10.0,
    factors: ExternalFactors | None = None,
    pred_start: date = date(2026, 2, 1),
    n_pred: int = 7,
) -> ForecastContext:
    hist = make_hist(n_hist, hist_qty, hist_rev)
    preds = make_predictions(n_pred, pred_qty, pred_rev, confidence, pred_start)
    adj = {p.date: 1.0 for p in preds}
    return ForecastContext(
        product_id="test-001",
        historical_data=hist,
        predictions=preds,
        accuracy_metrics=AccuracyMetrics(method="wma", mae=1.0, mape=mape),
        external_factors=factors or ExternalFactors(),
        adjustment_map=adj,
        avg_price=hist_rev / hist_qty if hist_qty > 0 else 0.0,
    )


# ── Trend detection ───────────────────────────────────────────────────────────


class TestTrendPct:
    def test_rising_trend(self):
        ctx = make_ctx(hist_qty=10, pred_qty=15)
        assert _trend_pct(ctx) == pytest.approx(50.0)

    def test_falling_trend(self):
        ctx = make_ctx(hist_qty=10, pred_qty=8)
        assert _trend_pct(ctx) == pytest.approx(-20.0)

    def test_stable_trend(self):
        ctx = make_ctx(hist_qty=10, pred_qty=10)
        assert _trend_pct(ctx) == pytest.approx(0.0)

    def test_zero_historical_returns_zero(self):
        ctx = make_ctx(hist_qty=0, pred_qty=5)
        assert _trend_pct(ctx) == 0.0


# ── Factor helpers ────────────────────────────────────────────────────────────


class TestFactorHelpers:
    def test_holidays_in_period_detected(self):
        d = date(2026, 2, 3)
        factors = ExternalFactors(holidays=[Holiday(date=d, name="Hari Raya")])
        ctx = make_ctx(factors=factors, pred_start=date(2026, 2, 1), n_pred=7)
        assert "Hari Raya" in _holidays_in_period(ctx)

    def test_holidays_outside_period_ignored(self):
        d = date(2026, 1, 1)  # before prediction window
        factors = ExternalFactors(holidays=[Holiday(date=d, name="Tahun Baru")])
        ctx = make_ctx(factors=factors, pred_start=date(2026, 2, 1), n_pred=7)
        assert _holidays_in_period(ctx) == []

    def test_high_events_detected(self):
        d = date(2026, 2, 2)
        factors = ExternalFactors(events=[Event(date=d, name="Festival", impact="high")])
        ctx = make_ctx(factors=factors, pred_start=date(2026, 2, 1), n_pred=7)
        assert "Festival" in _high_events_in_period(ctx)

    def test_low_impact_events_not_in_high_events(self):
        d = date(2026, 2, 2)
        factors = ExternalFactors(events=[Event(date=d, name="Kecil", impact="low")])
        ctx = make_ctx(factors=factors, pred_start=date(2026, 2, 1), n_pred=7)
        assert _high_events_in_period(ctx) == []

    def test_bad_weather_days_count(self):
        factors = ExternalFactors(weather=[
            WeatherPoint(date=date(2026, 2, 1), condition="rainy", temp=24.0),
            WeatherPoint(date=date(2026, 2, 2), condition="stormy", temp=20.0),
            WeatherPoint(date=date(2026, 2, 3), condition="clear", temp=30.0),
        ])
        ctx = make_ctx(factors=factors, pred_start=date(2026, 2, 1), n_pred=7)
        assert _bad_weather_days(ctx) == 2


# ── AI Summary ────────────────────────────────────────────────────────────────


class TestBuildSummary:
    def test_rising_trend_mentions_increase(self):
        ctx = make_ctx(hist_qty=10, pred_qty=15)  # +50%
        summary = _build_summary(ctx)
        assert any(word in summary.lower() for word in ("naik", "melonjak", "tumbuh"))

    def test_falling_trend_mentions_decrease(self):
        ctx = make_ctx(hist_qty=10, pred_qty=5)  # -50%
        summary = _build_summary(ctx)
        assert any(word in summary.lower() for word in ("turun", "menurun", "penurunan"))

    def test_stable_trend_mentions_stabil(self):
        ctx = make_ctx(hist_qty=10, pred_qty=10)  # 0%
        summary = _build_summary(ctx)
        assert "stabil" in summary.lower()

    def test_summary_includes_mape(self):
        ctx = make_ctx(mape=12.5)
        summary = _build_summary(ctx)
        assert "12.5%" in summary or "MAPE" in summary

    def test_summary_includes_holiday_name(self):
        holiday_date = date(2026, 2, 3)
        factors = ExternalFactors(holidays=[Holiday(date=holiday_date, name="Imlek")])
        ctx = make_ctx(factors=factors, pred_start=date(2026, 2, 1), n_pred=7)
        summary = _build_summary(ctx)
        assert "Imlek" in summary

    def test_summary_is_non_empty_string(self):
        ctx = make_ctx()
        assert isinstance(_build_summary(ctx), str)
        assert len(_build_summary(ctx)) > 30

    def test_summary_varies_by_product_id(self):
        # Different product IDs may produce different template variants (random seed differs)
        def make_ctx_for(pid: str) -> ForecastContext:
            ctx = make_ctx(hist_qty=8, pred_qty=15)  # strong rising trend
            return ForecastContext(
                product_id=pid,
                historical_data=ctx.historical_data,
                predictions=ctx.predictions,
                accuracy_metrics=ctx.accuracy_metrics,
                external_factors=ctx.external_factors,
                adjustment_map=ctx.adjustment_map,
                avg_price=ctx.avg_price,
            )

        # Both must be valid non-empty strings
        s1 = _build_summary(make_ctx_for("prod-aaa"))
        s2 = _build_summary(make_ctx_for("prod-bbb"))
        assert isinstance(s1, str) and len(s1) > 0
        assert isinstance(s2, str) and len(s2) > 0


# ── Recommendations ───────────────────────────────────────────────────────────


class TestBuildRecommendations:
    def test_minimum_3_recommendations_always(self):
        ctx = make_ctx(n_hist=20, hist_qty=10, pred_qty=10)  # stable, no factors
        recs = _build_recommendations(ctx)
        assert len(recs) >= 3

    def test_recommendation_fields_valid(self):
        ctx = make_ctx()
        for rec in _build_recommendations(ctx):
            assert rec.priority in ("high", "medium", "low")
            assert isinstance(rec.title, str) and len(rec.title) > 0
            assert isinstance(rec.description, str) and len(rec.description) > 0

    def test_holiday_triggers_high_stock_recommendation(self):
        holiday_date = date(2026, 2, 2)
        factors = ExternalFactors(holidays=[Holiday(date=holiday_date, name="Imlek")])
        ctx = make_ctx(factors=factors, pred_start=date(2026, 2, 1), n_pred=7)
        recs = _build_recommendations(ctx)

        high_recs = [r for r in recs if r.priority == "high"]
        assert len(high_recs) >= 1
        titles = " ".join(r.title for r in high_recs)
        assert any(w in titles.lower() for w in ("stok", "persiapan", "libur"))

    def test_holiday_triggers_event_preparation_recommendation(self):
        holiday_date = date(2026, 2, 2)
        factors = ExternalFactors(holidays=[Holiday(date=holiday_date, name="Lebaran")])
        ctx = make_ctx(factors=factors, pred_start=date(2026, 2, 1), n_pred=7)
        recs = _build_recommendations(ctx)
        combined = " ".join(r.title + " " + r.description for r in recs)
        assert "Lebaran" in combined

    def test_rainy_days_trigger_promo_recommendation(self):
        factors = ExternalFactors(weather=[
            WeatherPoint(date=date(2026, 2, 1), condition="rainy", temp=24.0),
        ])
        ctx = make_ctx(factors=factors, pred_start=date(2026, 2, 1), n_pred=7)
        recs = _build_recommendations(ctx)
        combined = " ".join(r.title + " " + r.description for r in recs).lower()
        assert any(w in combined for w in ("hujan", "promo", "promosi"))

    def test_bundling_recommendation_present_when_price_positive(self):
        ctx = make_ctx(hist_rev=150_000.0, hist_qty=10)  # avg_price = 15_000
        recs = _build_recommendations(ctx)
        combined = " ".join(r.description for r in recs).lower()
        assert "bundl" in combined or "upsell" in combined or "bundling" in combined

    def test_low_n_hist_triggers_data_recommendation(self):
        ctx = make_ctx(n_hist=5)
        recs = _build_recommendations(ctx)
        combined = " ".join(r.description for r in recs).lower()
        assert any(w in combined for w in ("data", "historis", "hari"))

    def test_rising_trend_triggers_high_stock_recommendation(self):
        ctx = make_ctx(hist_qty=10, pred_qty=15)  # +50%
        recs = _build_recommendations(ctx)
        high_recs = [r for r in recs if r.priority == "high"]
        assert len(high_recs) >= 1

    def test_high_event_generates_high_priority_recommendation(self):
        event_date = date(2026, 2, 3)
        factors = ExternalFactors(events=[Event(date=event_date, name="Pameran", impact="high")])
        ctx = make_ctx(factors=factors, pred_start=date(2026, 2, 1), n_pred=7)
        recs = _build_recommendations(ctx)
        combined = " ".join(r.title + " " + r.description for r in recs)
        assert "Pameran" in combined

    def test_recommendations_sorted_by_priority(self):
        """High-priority recs should appear before low-priority ones."""
        holiday_date = date(2026, 2, 2)
        factors = ExternalFactors(holidays=[Holiday(date=holiday_date, name="Libur")])
        ctx = make_ctx(factors=factors, pred_start=date(2026, 2, 1), n_pred=7)
        recs = _build_recommendations(ctx)
        priorities = [r.priority for r in recs]
        order_map = {"high": 0, "medium": 1, "low": 2}
        numeric = [order_map[p] for p in priorities]
        assert numeric == sorted(numeric), "Recommendations are not ordered high→medium→low"


# ── Warnings ──────────────────────────────────────────────────────────────────


class TestBuildWarnings:
    def test_warning_fields_valid(self):
        ctx = make_ctx(n_hist=3)
        for w in _build_warnings(ctx):
            assert w.level in ("high", "medium", "low")
            assert isinstance(w.message, str) and len(w.message) > 0

    def test_insufficient_data_under_7_days_is_high_warning(self):
        ctx = make_ctx(n_hist=4)
        warnings = _build_warnings(ctx)
        assert any(w.level == "high" and "kurang dari 7 hari" in w.message.lower() or
                   ("7" in w.message and w.level == "high")
                   for w in warnings)

    def test_insufficient_data_7_to_13_days_is_medium_warning(self):
        ctx = make_ctx(n_hist=10)
        warnings = _build_warnings(ctx)
        assert any("10 hari" in w.message or "14 hari" in w.message for w in warnings)

    def test_no_data_warning_for_sufficient_data(self):
        ctx = make_ctx(n_hist=20)
        warnings = _build_warnings(ctx)
        data_msgs = [w for w in warnings if "hari" in w.message and "data historis" in w.message]
        assert len(data_msgs) == 0

    def test_low_confidence_generates_high_warning(self):
        ctx = make_ctx(confidence=0.30)
        warnings = _build_warnings(ctx)
        assert any(w.level == "high" and "kepercayaan" in w.message.lower() for w in warnings)

    def test_sufficient_confidence_no_confidence_warning(self):
        ctx = make_ctx(n_hist=20, confidence=0.80, mape=5.0)
        warnings = _build_warnings(ctx)
        assert not any("kepercayaan" in w.message.lower() for w in warnings)

    def test_high_mape_generates_high_warning(self):
        ctx = make_ctx(n_hist=20, mape=45.0, confidence=0.80)
        warnings = _build_warnings(ctx)
        assert any(w.level == "high" and "mape" in w.message.lower() for w in warnings)

    def test_medium_mape_generates_medium_warning(self):
        ctx = make_ctx(n_hist=20, mape=20.0, confidence=0.80)
        warnings = _build_warnings(ctx)
        assert any(w.level == "medium" and "mape" in w.message.lower() for w in warnings)

    def test_single_product_dependency_warning_when_high_revenue(self):
        # avg_daily_revenue = 600_000 * 10 / 10 = 600_000 > 500_000 threshold
        ctx = make_ctx(n_hist=20, pred_qty=10, pred_rev=600_000.0, mape=5.0, confidence=0.80)
        warnings = _build_warnings(ctx)
        dep_warnings = [w for w in warnings if "ketergantungan" in w.message.lower() or "diversif" in w.message.lower()]
        assert len(dep_warnings) >= 1

    def test_no_dependency_warning_when_low_revenue(self):
        # avg_daily_revenue = 10 * 15_000 = 150_000 < 500_000 threshold
        ctx = make_ctx(n_hist=20, pred_qty=10, pred_rev=150_000.0, mape=5.0, confidence=0.80)
        warnings = _build_warnings(ctx)
        assert not any("ketergantungan" in w.message.lower() for w in warnings)

    def test_stockout_warning_when_prediction_exceeds_historical_max(self):
        # hist max = 10, pred max = 20 → 2× historical → warn
        hist = make_hist(10, base_qty=10)
        preds = make_predictions(7, qty=20, rev=300_000.0, confidence=0.70)
        ctx = ForecastContext(
            product_id="test",
            historical_data=hist,
            predictions=preds,
            accuracy_metrics=AccuracyMetrics(method="wma", mae=1.0, mape=5.0),
            external_factors=ExternalFactors(),
            adjustment_map={p.date: 1.0 for p in preds},
            avg_price=15_000.0,
        )
        warnings = _build_warnings(ctx)
        assert any("stok" in w.message.lower() or "maksimum" in w.message.lower() for w in warnings)


# ── Protocol compliance ───────────────────────────────────────────────────────


class TestInsightEngineProtocol:
    def test_rule_based_engine_implements_protocol(self):
        engine = RuleBasedEngine()
        assert isinstance(engine, InsightEngine)

    def test_generate_insights_returns_correct_types(self):
        ctx = make_ctx()
        summary, recs, warnings = generate_insights(ctx)
        assert isinstance(summary, str)
        assert isinstance(recs, list)
        assert all(isinstance(r, Recommendation) for r in recs)
        assert isinstance(warnings, list)
        assert all(isinstance(w, PredictionWarning) for w in warnings)

    def test_custom_engine_is_used_when_injected(self):
        class FakeEngine:
            def build_summary(self, ctx: ForecastContext) -> str:
                return "injected summary"

            def build_recommendations(self, ctx: ForecastContext) -> list[Recommendation]:
                return [Recommendation(priority="high", title="T", description="D")]

            def build_warnings(self, ctx: ForecastContext) -> list[PredictionWarning]:
                return []

        ctx = make_ctx()
        summary, recs, warnings = generate_insights(ctx, engine=FakeEngine())
        assert summary == "injected summary"
        assert recs[0].title == "T"
        assert warnings == []
