"""
Rule-based insight engine for UMKM-Sense predictions.

Contract: ForecastContext → (ai_summary, recommendations, warnings)

The InsightEngine Protocol pins the interface so callers (forecast_service.run_forecast)
never touch engine internals. Swap RuleBasedEngine for an LLMEngine at any time
without changing ForecastContext or the generate_insights() signature.
"""

import random
from dataclasses import dataclass
from datetime import date
from typing import Protocol, runtime_checkable

from app.schemas.prediction import (
    AccuracyMetrics,
    ExternalFactors,
    HistoricalDataPoint,
    PredictionPoint,
    PredictionWarning,
    Recommendation,
)


# ── Context ───────────────────────────────────────────────────────────────────


@dataclass
class ForecastContext:
    product_id: str
    historical_data: list[HistoricalDataPoint]
    predictions: list[PredictionPoint]
    accuracy_metrics: AccuracyMetrics
    external_factors: ExternalFactors
    adjustment_map: dict[date, float]
    avg_price: float


# ── Swappable interface ───────────────────────────────────────────────────────


@runtime_checkable
class InsightEngine(Protocol):
    def build_summary(self, ctx: ForecastContext) -> str: ...
    def build_recommendations(self, ctx: ForecastContext) -> list[Recommendation]: ...
    def build_warnings(self, ctx: ForecastContext) -> list[PredictionWarning]: ...


# ── Internal helpers ──────────────────────────────────────────────────────────


def _hist_avg_qty(ctx: ForecastContext) -> float:
    if not ctx.historical_data:
        return 0.0
    return sum(d.qty_sold for d in ctx.historical_data) / len(ctx.historical_data)


def _pred_avg_qty(ctx: ForecastContext) -> float:
    if not ctx.predictions:
        return 0.0
    return sum(p.predicted_qty for p in ctx.predictions) / len(ctx.predictions)


def _trend_pct(ctx: ForecastContext) -> float:
    hist = _hist_avg_qty(ctx)
    if hist == 0:
        return 0.0
    return (_pred_avg_qty(ctx) - hist) / hist * 100


def _peak_day(ctx: ForecastContext) -> PredictionPoint | None:
    return max(ctx.predictions, key=lambda p: p.predicted_qty) if ctx.predictions else None


def _trough_day(ctx: ForecastContext) -> PredictionPoint | None:
    return min(ctx.predictions, key=lambda p: p.predicted_qty) if ctx.predictions else None


def _holidays_in_period(ctx: ForecastContext) -> list[str]:
    pred_dates = {p.date for p in ctx.predictions}
    return [h.name for h in ctx.external_factors.holidays if h.date in pred_dates]


def _high_events_in_period(ctx: ForecastContext) -> list[str]:
    pred_dates = {p.date for p in ctx.predictions}
    return [
        e.name
        for e in ctx.external_factors.events
        if e.date in pred_dates and e.impact == "high"
    ]


def _bad_weather_days(ctx: ForecastContext) -> int:
    pred_dates = {p.date for p in ctx.predictions}
    return sum(
        1
        for w in ctx.external_factors.weather
        if w.date in pred_dates and w.condition in ("rainy", "stormy")
    )


def _avg_daily_revenue(ctx: ForecastContext) -> float:
    if not ctx.predictions:
        return 0.0
    return sum(float(p.predicted_revenue) for p in ctx.predictions) / len(ctx.predictions)


def _rng(ctx: ForecastContext) -> random.Random:
    return random.Random(hash(ctx.product_id) & 0xFFFFFFFF)


# ── AI Summary ────────────────────────────────────────────────────────────────

_RISING_STRONG = [
    "Kabar baik! Penjualan diprediksi naik sekitar {pct:.0f}% dibanding rata-rata historis, "
    "dari {hist:.0f} menjadi {pred:.0f} unit/hari dalam {n} hari ke depan. {factors}",

    "Tren positif terdeteksi — penjualan diperkirakan melonjak {pct:.0f}% dalam {n} hari ke depan, "
    "naik dari {hist:.0f} ke {pred:.0f} unit/hari. {factors}",
]

_RISING_MODERATE = [
    "Penjualan menunjukkan tren naik ringan sekitar {pct:.0f}% untuk periode ini. "
    "Rata-rata harian diprediksi meningkat dari {hist:.0f} menjadi {pred:.0f} unit. {factors}",

    "Dalam {n} hari ke depan, penjualan diperkirakan tumbuh {pct:.0f}% dari baseline historis. {factors}",
]

_STABLE = [
    "Penjualan diprediksi cenderung stabil di kisaran {pred:.0f} unit per hari selama {n} hari ke depan, "
    "konsisten dengan rata-rata historis {hist:.0f} unit/hari. {factors}",

    "Tidak ada perubahan signifikan yang diprediksi — volume bergerak stabil sekitar {pred:.0f} unit/hari. {factors}",
]

_FALLING_MODERATE = [
    "Penjualan diprediksi sedikit menurun sekitar {pct:.0f}% dari rata-rata historis {hist:.0f} unit/hari "
    "menjadi {pred:.0f} unit/hari. {factors}",

    "Dalam {n} hari ke depan ada penurunan ringan {pct:.0f}% yang perlu diantisipasi. {factors}",
]

_FALLING_STRONG = [
    "Perhatian: prediksi menunjukkan penurunan {pct:.0f}% dalam periode ini — dari {hist:.0f} "
    "menjadi {pred:.0f} unit/hari. Segera tinjau strategi penjualan. {factors}",

    "Tren menurun {pct:.0f}% terdeteksi untuk {n} hari ke depan. {factors}",
]


def _factor_sentence(ctx: ForecastContext) -> str:
    parts: list[str] = []
    holidays = _holidays_in_period(ctx)
    events = _high_events_in_period(ctx)
    bad_wx = _bad_weather_days(ctx)

    if holidays:
        parts.append(f"Hari libur {' dan '.join(holidays[:2])} turut mendorong angka ini")
    if events:
        parts.append(f"Event {events[0]} berdampak pada permintaan")
    if bad_wx:
        parts.append(f"Ada {bad_wx} hari cuaca buruk yang memengaruhi estimasi")
    if not parts:
        peak = _peak_day(ctx)
        if peak:
            parts.append(
                f"Puncak prediksi pada {peak.date.strftime('%d %b')} dengan {peak.predicted_qty} unit"
            )

    return ". ".join(parts) + "." if parts else ""


def _build_summary(ctx: ForecastContext) -> str:
    rng = _rng(ctx)
    hist = _hist_avg_qty(ctx)
    pred = _pred_avg_qty(ctx)
    trend = _trend_pct(ctx)
    pct = abs(trend)
    n = len(ctx.predictions)
    factors = _factor_sentence(ctx)

    slots = dict(pct=pct, hist=hist, pred=pred, n=n, factors=factors)

    if trend > 20:
        body = rng.choice(_RISING_STRONG).format(**slots)
    elif trend > 5:
        body = rng.choice(_RISING_MODERATE).format(**slots)
    elif trend >= -5:
        body = rng.choice(_STABLE).format(**slots)
    elif trend >= -20:
        body = rng.choice(_FALLING_MODERATE).format(**slots)
    else:
        body = rng.choice(_FALLING_STRONG).format(**slots)

    mape = ctx.accuracy_metrics.mape
    if mape < 15:
        acc = f"Akurasi prediksi cukup baik (MAPE {mape:.1f}%)."
    elif mape < 30:
        acc = f"Akurasi prediksi sedang (MAPE {mape:.1f}%) — gunakan sebagai panduan awal."
    else:
        acc = f"Akurasi terbatas (MAPE {mape:.1f}%) — pertimbangkan menambah data historis."

    return f"{body} {acc}"


# ── Recommendations ───────────────────────────────────────────────────────────


def _build_recommendations(ctx: ForecastContext) -> list[Recommendation]:
    recs: list[Recommendation] = []
    trend = _trend_pct(ctx)
    holidays = _holidays_in_period(ctx)
    events = _high_events_in_period(ctx)
    bad_wx = _bad_weather_days(ctx)
    n_hist = len(ctx.historical_data)
    peak = _peak_day(ctx)
    trough = _trough_day(ctx)

    # ── HIGH priority ─────────────────────────────────────────────────────────

    if trend > 10 or holidays or events:
        extra = max(round((_pred_avg_qty(ctx) - _hist_avg_qty(ctx)) * 1.2), 3)
        if holidays:
            trigger = f" Hari libur {holidays[0]} diperkirakan mendorong lonjakan permintaan."
        elif events:
            trigger = f" Event {events[0]} berdampak tinggi pada volume penjualan."
        else:
            trigger = f" Prediksi menunjukkan kenaikan {trend:.0f}% dari baseline historis."

        recs.append(Recommendation(
            priority="high",
            title="Tambah Stok untuk Periode Ramai",
            description=(
                f"Permintaan diprediksi meningkat.{trigger} "
                f"Siapkan stok tambahan sekitar {extra} unit lebih dari biasanya "
                f"untuk menghindari kehabisan produk pada periode ini."
            ),
        ))

    if holidays:
        names = " dan ".join(holidays[:2])
        recs.append(Recommendation(
            priority="high",
            title=f"Persiapan Menyambut {holidays[0]}",
            description=(
                f"Hari libur {names} jatuh dalam periode prediksi. "
                f"Pastikan ketersediaan produk, pertimbangkan promosi tematik, "
                f"dan siapkan operasional lebih awal untuk memaksimalkan penjualan."
            ),
        ))
    elif events:
        recs.append(Recommendation(
            priority="high",
            title=f"Manfaatkan Momentum Event {events[0]}",
            description=(
                f"Event {events[0]} memberi peluang kenaikan penjualan. "
                f"Fokuskan kapasitas layanan pada hari tersebut dan pastikan stok tidak habis di tengah event."
            ),
        ))

    # ── MEDIUM priority ───────────────────────────────────────────────────────

    if bad_wx > 0 and trough:
        recs.append(Recommendation(
            priority="medium",
            title="Strategi Promosi Hari Hujan",
            description=(
                f"Terdapat {bad_wx} hari dengan perkiraan cuaca buruk yang bisa menekan penjualan. "
                f"Pertimbangkan diskon ongkir, promo bundling, atau notifikasi pelanggan "
                f"untuk menjaga volume pada hari-hari tersebut."
            ),
        ))

    if ctx.avg_price > 0:
        recs.append(Recommendation(
            priority="medium",
            title="Peluang Bundling & Upsell",
            description=(
                f"Dengan harga rata-rata Rp {ctx.avg_price:,.0f}/unit, produk ini berpotensi "
                f"dibundling dengan produk komplementer atau ditawarkan dalam paket hemat. "
                f"Strategi ini meningkatkan nilai transaksi rata-rata tanpa menambah biaya akuisisi."
            ),
        ))

    if peak and not holidays and not events:
        recs.append(Recommendation(
            priority="medium",
            title="Optimalkan Hari Puncak Penjualan",
            description=(
                f"Hari dengan prediksi penjualan tertinggi adalah {peak.date.strftime('%d %b %Y')} "
                f"({peak.predicted_qty} unit). Pastikan stok dan layanan siap penuh pada hari itu."
            ),
        ))

    # ── LOW priority ──────────────────────────────────────────────────────────

    if n_hist < 14:
        recs.append(Recommendation(
            priority="low",
            title="Lengkapi Data Historis",
            description=(
                f"Saat ini hanya tersedia {n_hist} hari data historis. "
                f"Dengan minimal 14 hari data, prediksi akan jauh lebih akurat. "
                f"Pastikan setiap transaksi tercatat secara konsisten."
            ),
        ))

    recs.append(Recommendation(
        priority="low",
        title="Pantau Realisasi vs Prediksi",
        description=(
            "Bandingkan penjualan aktual dengan prediksi ini setiap hari. "
            "Pola perbedaan yang konsisten bisa menjadi sinyal untuk menyesuaikan strategi stok atau harga."
        ),
    ))

    # Guarantee minimum 3
    if len(recs) < 3:
        recs.append(Recommendation(
            priority="low",
            title="Diversifikasi Waktu Penjualan",
            description=(
                "Coba tawarkan produk pada jam atau hari yang biasanya sepi untuk meratakan "
                "beban operasional dan menjangkau lebih banyak segmen pelanggan."
            ),
        ))

    return recs


# ── Warnings ──────────────────────────────────────────────────────────────────


def _build_warnings(ctx: ForecastContext) -> list[PredictionWarning]:
    out: list[PredictionWarning] = []
    n_hist = len(ctx.historical_data)
    mape = ctx.accuracy_metrics.mape
    conf = ctx.predictions[0].confidence if ctx.predictions else 1.0
    avg_rev = _avg_daily_revenue(ctx)
    pred_qtys = [p.predicted_qty for p in ctx.predictions]
    hist_max = max((d.qty_sold for d in ctx.historical_data), default=0)

    # Insufficient data
    if n_hist < 7:
        out.append(PredictionWarning(
            level="high",
            message=(
                f"Data historis hanya {n_hist} hari — prediksi sangat terbatas dan sebaiknya "
                f"digunakan sebagai estimasi kasar saja. Kumpulkan minimal 7 hari data untuk hasil lebih andal."
            ),
        ))
    elif n_hist < 14:
        out.append(PredictionWarning(
            level="medium",
            message=(
                f"Data historis {n_hist} hari masih di bawah rekomendasi (14 hari). "
                f"Akurasi prediksi bisa meningkat signifikan dengan data yang lebih lengkap."
            ),
        ))

    # Low confidence
    if conf < 0.50:
        out.append(PredictionWarning(
            level="high",
            message=(
                f"Tingkat kepercayaan prediksi rendah ({conf:.0%}). "
                f"Jangan jadikan hasil ini sebagai satu-satunya acuan keputusan bisnis."
            ),
        ))

    # High MAPE
    if mape > 30:
        out.append(PredictionWarning(
            level="high",
            message=(
                f"Akurasi backtesting rendah (MAPE {mape:.1f}%). "
                f"Kemungkinan ada anomali atau pola tidak beraturan dalam data historis. "
                f"Periksa dan bersihkan data transaksi sebelum menggunakan prediksi ini."
            ),
        ))
    elif mape > 15:
        out.append(PredictionWarning(
            level="medium",
            message=(
                f"Akurasi backtesting sedang (MAPE {mape:.1f}%). "
                f"Gunakan prediksi sebagai panduan, bukan kepastian."
            ),
        ))

    # Single-product dependency risk
    if avg_rev > 500_000:
        out.append(PredictionWarning(
            level="medium",
            message=(
                f"Pendapatan produk ini diprediksi rata-rata Rp {avg_rev:,.0f}/hari. "
                f"Ketergantungan bisnis pada satu produk utama mengandung risiko — "
                f"pertimbangkan diversifikasi lini produk untuk ketahanan bisnis yang lebih baik."
            ),
        ))

    # Potential stockout
    if pred_qtys and hist_max > 0 and max(pred_qtys) > hist_max * 1.5:
        out.append(PredictionWarning(
            level="medium",
            message=(
                f"Prediksi puncak ({max(pred_qtys)} unit) jauh melampaui maksimum historis "
                f"({hist_max} unit). Pastikan kapasitas stok mencukupi untuk mencegah kehabisan produk."
            ),
        ))

    return out


# ── Rule-based engine & public API ────────────────────────────────────────────


class RuleBasedEngine:
    """
    Offline, deterministic insight engine.
    Implements InsightEngine — swap with LLMEngine without touching callers.
    """

    def build_summary(self, ctx: ForecastContext) -> str:
        return _build_summary(ctx)

    def build_recommendations(self, ctx: ForecastContext) -> list[Recommendation]:
        return _build_recommendations(ctx)

    def build_warnings(self, ctx: ForecastContext) -> list[PredictionWarning]:
        return _build_warnings(ctx)


default_engine: InsightEngine = RuleBasedEngine()


def generate_insights(
    ctx: ForecastContext,
    engine: InsightEngine = default_engine,
) -> tuple[str, list[Recommendation], list[PredictionWarning]]:
    """Single entry point used by forecast_service. Engine is injectable."""
    return (
        engine.build_summary(ctx),
        engine.build_recommendations(ctx),
        engine.build_warnings(ctx),
    )
