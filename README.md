# UMKM-Sense

Platform analitik dan prediksi penjualan untuk UMKM Indonesia. Bantu pelaku usaha kecil dan menengah buat keputusan bisnis yang lebih cerdas berdasarkan data penjualan mereka sendiri.

---

## Arsitektur

```
umkm-sense/
├── apps/
│   ├── web/          → Frontend (React 19 + Vite + TypeScript)
│   └── api/          → Backend REST API (Laravel 11)
├── services/
│   └── predict/      → Microservice prediksi penjualan (Python FastAPI)
├── docker-compose.yml  → PostgreSQL + Redis
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

## Tech Stack

| Layer         | Teknologi                                                 |
| ------------- | --------------------------------------------------------- |
| Frontend      | React 19, Vite, TypeScript, TanStack Query, Framer Motion |
| Backend API   | Laravel 11, PHP 8.2+, Sanctum, Queue (Redis)              |
| Prediksi AI   | Python 3.10+, FastAPI, ARIMA / Prophet / WMA              |
| Database      | PostgreSQL 16                                             |
| Cache / Queue | Redis 7                                                   |
| Monorepo      | Turborepo + pnpm workspaces                               |

---

## Prasyarat

| Tool           | Versi minimum         |
| -------------- | --------------------- |
| Node.js        | 20.x                  |
| pnpm           | 9.x (`npm i -g pnpm`) |
| PHP            | 8.2+                  |
| Composer       | 2.x                   |
| Python         | 3.10+                 |
| Docker Desktop | terbaru               |

---

## Setup Pertama Kali

### 1. Infrastruktur (PostgreSQL + Redis via Docker)

```bash
cp .env.example .env          # sesuaikan POSTGRES_* jika perlu
docker compose up -d
docker compose ps             # pastikan semua "healthy"
```

### 2. Laravel API

```bash
cd apps/api
cp .env.example .env          # lihat bagian Variabel Lingkungan di bawah
composer install
php artisan key:generate
php artisan migrate --seed
```

Seed data demo + cuaca (opsional tapi disarankan):

```bash
php artisan db:seed --class=DemoSeeder
php artisan weather:sync
```

Login demo: `demo@umkm.test` / `password`

### 3. Frontend Web

```bash
# Dari root monorepo:
pnpm install
cd apps/web
cp .env.example .env          # biasanya tidak perlu diubah untuk dev
```

### 4. FastAPI Prediction Service

```bash
cd services/predict
cp .env.example .env          # isi INTERNAL_API_KEY (lihat catatan di bawah)

python -m venv .venv

# Windows:
.venv\Scripts\activate
# macOS / Linux:
source .venv/bin/activate

pip install -r requirements.txt
```

---

## Menjalankan Semua Service Sekaligus

Dari **root** monorepo:

```bash
pnpm run dev:all
```

Perintah ini menjalankan **4 service secara paralel** via `concurrently`:

| Label     | Service                                 | URL                   |
| --------- | --------------------------------------- | --------------------- |
| `API`     | Laravel (`php artisan serve`)           | http://localhost:8000 |
| `WEB`     | Vite dev server                         | http://localhost:5173 |
| `WORKER`  | Queue worker (`php artisan queue:work`) | —                     |
| `PREDICT` | FastAPI via uvicorn                     | http://localhost:8001 |

Buka **http://localhost:5173** di browser.

> **Windows**: script `dev:predict` menggunakan `.venv/Scripts/uvicorn`. Pastikan virtual env sudah dibuat di `services/predict/.venv/`.

### Menjalankan Service Secara Terpisah

```bash
pnpm run dev:api                    # hanya Laravel API (port 8000)
pnpm run dev:web                    # hanya Vite frontend (port 5173)
pnpm run dev:worker                 # hanya queue worker
pnpm --filter api run dev:predict   # hanya FastAPI (port 8001)
```

---

## Variabel Lingkungan

### `apps/api/.env` — variabel penting

```dotenv
# Database (harus cocok dengan docker-compose .env di root)
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=umkm_sense
DB_USERNAME=umkm
DB_PASSWORD=rahasia

# Queue & Cache — Redis harus jalan via Docker
QUEUE_CONNECTION=redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# Sanctum — izinkan SPA dev server (port 5173)
SANCTUM_STATEFUL_DOMAINS=localhost,localhost:5173,127.0.0.1,127.0.0.1:5173
SESSION_DOMAIN=localhost

# FastAPI Prediction Microservice
# ⚠️  PREDICT_INTERNAL_KEY harus SAMA PERSIS dengan INTERNAL_API_KEY di services/predict/.env
PREDICT_SERVICE_URL=http://localhost:8001
PREDICT_INTERNAL_KEY=ganti-dengan-secret-yang-kuat
PREDICT_TIMEOUT=30
```

### `services/predict/.env` — variabel penting

```dotenv
# ⚠️  Harus SAMA PERSIS dengan PREDICT_INTERNAL_KEY di apps/api/.env
INTERNAL_API_KEY=ganti-dengan-secret-yang-kuat
PORT=8001
```

### `apps/web/.env` — variabel penting

```dotenv
# Kosongkan untuk dev — Vite proxy otomatis ke localhost:8000
# Isi jika frontend dan backend di-deploy ke domain berbeda
VITE_API_URL=
```

> **Penting**: `PREDICT_INTERNAL_KEY` dan `INTERNAL_API_KEY` adalah **shared secret** untuk komunikasi server-to-server antara Laravel dan FastAPI. Nilai keduanya harus identik.

---

## Alur End-to-End: Prediksi Penjualan

Pastikan **semua 4 service berjalan** (`pnpm run dev:all`), lalu:

1. Buka **http://localhost:5173** → login
2. **Tambah produk** → `/products`
3. **Tambah transaksi** (minimal 7 hari historis untuk prediksi) → `/sales`
4. **Analisis Cerdas** → `/analytics`
5. Pilih produk + periode (maks 14 hari) → **Analisis Sekarang**
6. Sistem mengirim HTTP 202 (async) → queue worker mengambil job
7. Worker memanggil FastAPI → menghitung ARIMA / Prophet / WMA
8. Hasil disimpan ke DB → status berubah `done`
9. Frontend polling otomatis setiap 2 detik → hasil tampil (3 tab: Ringkasan, Prediksi, Rekomendasi)
10. Kembali ke **Dashboard** → kartu **"Prediksi Besok"** otomatis terisi dari data yang sudah ada di DB

---

## Testing

### Laravel

```bash
cd apps/api
php artisan test                                          # semua test
php artisan test --filter="PredictionTest"                # endpoint predictions
php artisan test --filter="RunPredictionJobTest"          # job async
```

### FastAPI (Python)

```bash
cd services/predict
# aktifkan venv dulu
pytest                   # 80 unit tests (forecast + recommendation)
pytest -v --tb=short     # verbose
```

### Frontend (TypeScript + build check)

```bash
pnpm --filter web build
```

---

## Perintah Berguna

```bash
# Root monorepo
pnpm dev:all              # Semua 4 service bersamaan (dev)
pnpm --filter web build   # Build produksi frontend + type-check
pnpm test                 # Semua test

# apps/api
php artisan test
php artisan db:seed --class=DemoSeeder   # Re-seed demo (idempotent)
php artisan weather:sync                  # Sinkronisasi data cuaca

# services/predict
pytest -v
uvicorn app.main:app --reload --port 8001   # manual start
```

---

## Troubleshooting

| Masalah                               | Solusi                                                                                                   |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `CSRF mismatch 419`                   | Pastikan `SANCTUM_STATEFUL_DOMAINS` di `apps/api/.env` menyertakan `localhost:5173`                      |
| FastAPI tidak bisa dipanggil          | Cek `PREDICT_SERVICE_URL=http://localhost:8001` di `apps/api/.env` dan pastikan service predict berjalan |
| Job tidak diproses                    | Pastikan `QUEUE_CONNECTION=redis` dan `dev:worker` sedang berjalan; cek Redis jalan via Docker           |
| "Tidak ada data historis"             | Tambah minimal 1 transaksi sukses untuk produk tersebut di `/sales`                                      |
| `Connection refused` Redis/PostgreSQL | Jalankan `docker compose up -d` dari root                                                                |
| Python `ModuleNotFoundError`          | Aktifkan virtual env (`source .venv/bin/activate`) lalu `pip install -r requirements.txt`                |
| `dev:predict` gagal di Windows        | Pastikan `.venv\Scripts\uvicorn.exe` ada; jika tidak, coba `pip install uvicorn` ulang dalam venv        |

---

## Struktur Database Utama

| Tabel                        | Deskripsi                                                           |
| ---------------------------- | ------------------------------------------------------------------- |
| `prediction_logs`            | Log prediksi per user/produk (`pending → processing → done/failed`) |
| `prediction_items`           | Hasil prediksi per hari (qty, revenue, confidence)                  |
| `prediction_recommendations` | Rekomendasi berprioritas dari mesin AI                              |
| `prediction_warnings`        | Peringatan (data kurang, confidence rendah, dll)                    |
| `calendar_events`            | Event lokal yang mempengaruhi prediksi (impact: high/medium/low)    |
| `transactions`               | Data penjualan historis                                             |
| `transaction_items`          | Detail item per transaksi                                           |
| `products`                   | Katalog produk user                                                 |

---

## Lisensi

Hak cipta © 2026. Semua hak dilindungi.
