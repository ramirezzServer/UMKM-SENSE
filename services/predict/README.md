# services/predict — Prediction Microservice (Python FastAPI)

Ini adalah microservice untuk analitik & prediksi penjualan UMKM-Sense. Belum di-scaffold, placeholder dulu.

## Stack yang akan dipakai
- Python 3.12+
- FastAPI
- (TBD: scikit-learn / statsmodels / dll untuk model prediksi)

## Cara setup (nanti)
```bash
cd services/predict
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```
