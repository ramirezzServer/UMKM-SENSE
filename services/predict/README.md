# services/predict — Prediction Microservice (Python FastAPI)

Microservice prediksi penjualan untuk UMKM-Sense. Dipanggil oleh Laravel server-to-server dengan
header `X-Internal-Key`. Tidak ada akses publik.

## Struktur

```text
services/predict/
├── app/
│   ├── main.py               # FastAPI app entry point
│   ├── core/
│   │   ├── config.py         # Env-based settings (pydantic-settings)
│   │   └── security.py       # X-Internal-Key dependency
│   ├── routers/
│   │   ├── health.py         # GET /health
│   │   └── predict.py        # POST /predict
│   ├── schemas/
│   │   └── prediction.py     # PredictionRequest + PredictionResponse
│   └── services/
│       └── prediction_service.py  # Logika prediksi (dummy → real nanti)
├── .env.example
├── requirements.txt
└── README.md
```

## Setup & menjalankan

### 1. Buat virtualenv

```bash
cd services/predict

# Buat venv
python -m venv .venv

# Aktifkan (Windows PowerShell)
.venv\Scripts\Activate.ps1

# Aktifkan (Windows CMD)
.venv\Scripts\activate.bat

# Aktifkan (Linux/macOS)
source .venv/bin/activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

> **Catatan:** `prophet` butuh compiler C. Di Windows, install [Visual C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
> atau gunakan conda: `conda install -c conda-forge prophet`.

### 3. Konfigurasi env

```bash
cp .env.example .env
# Edit .env, isi INTERNAL_API_KEY dengan nilai yang sama seperti di .env Laravel
```

### 4. Jalankan service

```bash
# Development (auto-reload)
uvicorn app.main:app --reload --port 8001

# Production
uvicorn app.main:app --host 0.0.0.0 --port 8001 --workers 2
```

Service berjalan di `http://localhost:8001`.

## API Endpoints

| Method | Path     | Auth              | Deskripsi                    |
| ------ | -------- | ----------------- | ---------------------------- |
| GET    | /health  | Tidak perlu       | Smoke test / circuit breaker |
| POST   | /predict | X-Internal-Key    | Prediksi penjualan produk    |
| GET    | /docs    | Tidak perlu (dev) | Swagger UI interaktif        |

## Contoh request

```bash
# Health check
curl http://localhost:8001/health

# Prediksi (dengan key yang benar)
curl -X POST http://localhost:8001/predict \
  -H "Content-Type: application/json" \
  -H "X-Internal-Key: ganti-dengan-secret-yang-kuat" \
  -d '{
    "product_id": "prod-001",
    "historical_data": [
      {"date": "2026-01-01", "qty_sold": 10, "revenue": "150000"},
      {"date": "2026-01-02", "qty_sold": 12, "revenue": "180000"}
    ],
    "prediction_start": "2026-02-01",
    "prediction_end": "2026-02-07",
    "external_factors": {
      "holidays": [{"date": "2026-02-01", "name": "Imlek"}],
      "events": [],
      "weather": []
    }
  }'

# Tanpa key → 401
curl -X POST http://localhost:8001/predict \
  -H "Content-Type: application/json" \
  -d '{...}'
```
