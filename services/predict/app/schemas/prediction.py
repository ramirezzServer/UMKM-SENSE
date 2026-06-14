from datetime import date
from decimal import Decimal
from typing import Literal
from pydantic import BaseModel, Field


# ── Input sub-schemas ─────────────────────────────────────────────────────────

class HistoricalDataPoint(BaseModel):
    date: date
    qty_sold: int = Field(..., ge=0)
    revenue: Decimal = Field(..., ge=0)


class Holiday(BaseModel):
    date: date
    name: str


class Event(BaseModel):
    date: date
    name: str
    impact: Literal["low", "medium", "high"]


class WeatherPoint(BaseModel):
    date: date
    condition: Literal["clear", "cloudy", "rainy", "stormy"]
    temp: float


class ExternalFactors(BaseModel):
    holidays: list[Holiday] = Field(default_factory=list)
    events: list[Event] = Field(default_factory=list)
    weather: list[WeatherPoint] = Field(default_factory=list)


class PredictionRequest(BaseModel):
    product_id: str
    historical_data: list[HistoricalDataPoint] = Field(..., min_length=1)
    prediction_start: date
    prediction_end: date
    external_factors: ExternalFactors = Field(default_factory=ExternalFactors)

    model_config = {
        "json_schema_extra": {
            "example": {
                "product_id": "prod-001",
                "historical_data": [
                    {"date": "2026-01-01", "qty_sold": 10, "revenue": "150000"},
                    {"date": "2026-01-02", "qty_sold": 12, "revenue": "180000"},
                ],
                "prediction_start": "2026-02-01",
                "prediction_end": "2026-02-07",
                "external_factors": {
                    "holidays": [{"date": "2026-02-01", "name": "Imlek"}],
                    "events": [],
                    "weather": [],
                },
            }
        }
    }


# ── Output sub-schemas ────────────────────────────────────────────────────────

class PredictionPoint(BaseModel):
    date: date
    predicted_qty: int
    predicted_revenue: Decimal
    confidence: float = Field(..., ge=0.0, le=1.0, description="0–1 confidence score")
    level: Literal["low", "medium", "high"]


class AccuracyMetrics(BaseModel):
    method: str
    mae: float = Field(..., description="Mean Absolute Error")
    mape: float = Field(..., description="Mean Absolute Percentage Error (%)")


class PredictionResponse(BaseModel):
    predictions: list[PredictionPoint]
    accuracy_metrics: AccuracyMetrics
    ai_summary: str
    recommendations: list[str]
    warnings: list[str]
