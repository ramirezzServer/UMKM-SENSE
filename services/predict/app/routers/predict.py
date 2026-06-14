from fastapi import APIRouter, Depends

from app.core.security import verify_internal_key
from app.schemas.prediction import PredictionRequest, PredictionResponse
from app.services.prediction_service import generate_dummy_prediction

router = APIRouter(dependencies=[Depends(verify_internal_key)])


@router.post("/predict", response_model=PredictionResponse)
async def predict(req: PredictionRequest) -> PredictionResponse:
    return generate_dummy_prediction(req)
