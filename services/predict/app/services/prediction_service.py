from datetime import timedelta
from decimal import Decimal

from app.schemas.prediction import (
    AccuracyMetrics,
    PredictionPoint,
    PredictionRequest,
    PredictionResponse,
)


def generate_dummy_prediction(req: PredictionRequest) -> PredictionResponse:
    """
    Placeholder: returns a stub response that satisfies the schema contract.
    Real algorithm (Prophet / SARIMA / ensemble) will replace this in Phase 4.
    """
    predictions: list[PredictionPoint] = []
    current = req.prediction_start
    while current <= req.prediction_end:
        predictions.append(
            PredictionPoint(
                date=current,
                predicted_qty=10,
                predicted_revenue=Decimal("150000"),
                confidence=0.75,
                level="medium",
            )
        )
        current += timedelta(days=1)

    return PredictionResponse(
        predictions=predictions,
        accuracy_metrics=AccuracyMetrics(method="dummy", mae=0.0, mape=0.0),
        ai_summary=(
            "Ini adalah prediksi dummy. Algoritma penuh akan diimplementasi pada iterasi berikutnya."
        ),
        recommendations=["Pastikan data historis minimal 30 hari untuk hasil lebih akurat."],
        warnings=["Prediksi ini adalah placeholder — belum menggunakan model statistik nyata."],
    )
