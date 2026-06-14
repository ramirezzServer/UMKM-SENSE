from fastapi import FastAPI

from app.routers import health, predict

app = FastAPI(
    title="UMKM-Sense Prediction Service",
    version="0.1.0",
    # Docs disabled in production; enable locally for dev only.
    docs_url="/docs",
    redoc_url=None,
)

app.include_router(health.router, tags=["health"])
app.include_router(predict.router, tags=["predict"])
