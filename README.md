# UMKM-Sense

> Platform prediksi penjualan berbasis AI untuk UMKM Indonesia

UMKM-Sense membantu pelaku usaha kecil dan menengah membuat keputusan bisnis yang lebih cerdas. Platform ini mengolah data transaksi historis, dikombinasikan dengan faktor eksternal — prakiraan cuaca lokal dan kalender hari libur nasional — untuk menghasilkan prediksi penjualan akurat dan rekomendasi aksi yang dapat langsung diterapkan. Semua proses berat (komputasi Prophet/ARIMA) berjalan secara _asynchronous_ di latar belakang sehingga antarmuka tetap responsif.

---

## Fitur Utama

- **Manajemen produk & transaksi** — CRUD lengkap dengan validasi kepemilikan per user
- **Import transaksi massal** — unggah CSV dengan pratinjau validasi sebelum konfirmasi
- **Dashboard analitik** — ringkasan penjualan hari ini, tren 7 hari, produk terlaris, kondisi cuaca
- **Prediksi penjualan AI** — pilih produk + rentang tanggal (maks 14 hari), sistem memilih model terbaik (Prophet / ARIMA / WMA) secara otomatis
- **Rekomendasi & peringatan otomatis** — hasil prediksi disertai rekomendasi berprioritas (high/medium/low) dan peringatan kualitas data
- **Riwayat prediksi** — daftar dan detail semua prediksi yang pernah dibuat
- **Kalender event** — libur nasional Indonesia + event lokal kustom yang memengaruhi prediksi
- **Autentikasi aman** — login/register via Sanctum SPA, reset kata sandi dengan OTP

---

## Arsitektur

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser                                                        │
│  React SPA (Vite · TypeScript · TanStack Query)                 │
└──────────────────────┬──────────────────────────────────────────┘
                       │ HTTP / Sanctum cookie-auth
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│  Laravel 11 API  (apps/api)                                     │
│                                                                 │
│  ┌─────────────┐   202 Accepted    ┌──────────────────────┐    │
│  │  Controller │ ──────────────►   │  Database Queue      │    │
│  └─────────────┘                   │  (RunPredictionJob)  │    │
│                                    └──────────┬───────────┘    │
│  ┌──────────────────────────────┐             │ HTTP + secret  │
│  │  WeatherService (DB-first)   │             ▼                │
│  │  HolidayService (seeder/DB)  │   ┌──────────────────────┐   │
│  │  Laravel Scheduler           │   │  FastAPI (Python)    │   │
│  │    weather:sync (6 jam)      │   │  services/predict    │   │
│  │    holidays:sync (harian)    │   │  Prophet/ARIMA/WMA   │   │
│  └──────────────────────────────┘   └──────────┬───────────┘   │
│                                                │ JSON result   │
│  ┌────────────────────────────────────────◄────┘               │
│  │  PredictionLog → status: done                               │
│  └─────────────────────────────────────────────────────────────┘
│                       │
│          PostgreSQL 16 (Docker)                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Kenapa FastAPI dipisah?** Komputasi Prophet/statsmodels memerlukan Python runtime dan bisa memakan waktu 2–10 detik per prediksi. Jika dijalankan langsung di dalam Laravel request, seluruh PHP-FPM worker akan terblokir. Dengan microservice terpisah yang dipanggil lewat _background job_, API utama tetap cepat dan performa prediksi dapat di-_scale_ secara independen.

---

## Tech Stack

| Layer             | Teknologi                                                                                |
| ----------------- | ---------------------------------------------------------------------------------------- |
| Frontend          | React 19, Vite, TypeScript, TanStack Query, TanStack Router, Tailwind CSS, Framer Motion |
| Backend API       | Laravel 11, PHP 8.2+, Sanctum SPA Auth, Eloquent, Policies                               |
| Queue / Job       | Laravel Queue — database driver (PostgreSQL)                                             |
| Microservice AI   | Python 3.13, FastAPI, Prophet, ARIMA (statsmodels), WMA                                  |
| Database          | PostgreSQL 16 (Docker)                                                                   |
| Cache & Scheduler | Laravel Cache (database driver) + Laravel Scheduler                                      |
| Monorepo          | Turborepo + pnpm workspaces                                                              |

---

## Prasyarat

| Tool           | Versi minimum | Catatan            |
| -------------- | ------------- | ------------------ |
| Node.js        | 20.x          | `node -v`          |
| pnpm           | 9.x           | `npm i -g pnpm`    |
| PHP            | 8.2+          | `php -v`           |
| Composer       | 2.x           | `composer -V`      |
| Python         | 3.13+         | `python --version` |
| Docker Desktop | terbaru       | postgres + redis   |

---

## Cara Menjalankan (Pertama Kali)

> **Windows / PowerShell:** Semua perintah ditulis terpisah per baris — PowerShell tidak mendukung operator `&&` untuk chaining.

### 1. Clone & persiapan infrastruktur

```powershell
git clone <url-repo> umkm-sense
cd umkm-sense
```

Buat file `.env` untuk Docker Compose di root:

```powershell
Copy-Item .env.example .env
```

Isi file `.env` root (nilai default sudah sesuai untuk dev lokal):

```dotenv
POSTGRES_USER=umkm
POSTGRES_PASSWORD=rahasia
POSTGRES_DB=umkm_sense
```

Jalankan PostgreSQL dan Redis:

```powershell
docker compose up -d
docker compose ps
```

Pastikan semua service berstatus **healthy** sebelum lanjut.

---

### 2. Backend Laravel (apps/api)

```powershell
cd apps\api
Copy-Item .env.example .env
```

Buka `apps/api/.env` dan sesuaikan nilai berikut:

```dotenv
# Database — sesuaikan dengan .env root
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=umkm_sense
DB_USERNAME=umkm
DB_PASSWORD=rahasia

# Sanctum — izinkan SPA dev server
SANCTUM_STATEFUL_DOMAINS=localhost,localhost:5173,127.0.0.1,127.0.0.1:5173
SESSION_DOMAIN=localhost

# Shared secret dengan FastAPI — harus SAMA PERSIS dengan INTERNAL_API_KEY di services/predict/.env
PREDICT_SERVICE_URL=http://localhost:8001
PREDICT_INTERNAL_KEY=ganti-ini-dengan-string-acak-yang-kuat
PREDICT_TIMEOUT=30
```

Install dependensi dan setup database:

```powershell
composer install
php artisan key:generate
php artisan migrate:fresh --seed
php artisan db:seed --class=DemoSeeder
```

> `migrate:fresh --seed` menjalankan semua migration dari awal dan seeder dasar (termasuk libur nasional). `DemoSeeder` menambahkan akun demo beserta data contoh transaksi.

**Akun demo:** `demo@umkm.test` / `password`

---

### 3. Frontend (apps/web)

Dari **root** monorepo:

```powershell
cd ..\..
pnpm install
```

Buat `.env` untuk frontend (biasanya tidak perlu diubah untuk dev):

```powershell
cd apps\web
Copy-Item .env.example .env
cd ..\..
```

---

### 4. Microservice prediksi Python (services/predict)

```powershell
cd services\predict
Copy-Item .env.example .env
```

Buka `services/predict/.env` dan isi `INTERNAL_API_KEY` dengan nilai yang **sama persis** dengan `PREDICT_INTERNAL_KEY` di `apps/api/.env`:

```dotenv
INTERNAL_API_KEY=ganti-ini-dengan-string-acak-yang-kuat
PORT=8001
```

Buat virtual environment dan install dependensi:

```powershell
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
cd ..\..
```

---

### 5. Jalankan semua service sekaligus

Dari **root** monorepo:

```powershell
pnpm run dev:all
```

Perintah ini menjalankan 4 service secara paralel:

| Label     | Service                                 | URL                   |
| --------- | --------------------------------------- | --------------------- |
| `API`     | Laravel (`php artisan serve`)           | http://localhost:8000 |
| `WEB`     | Vite dev server                         | http://localhost:5173 |
| `WORKER`  | Queue worker (`php artisan queue:work`) | —                     |
| `PREDICT` | FastAPI via uvicorn                     | http://localhost:8001 |

Buka **http://localhost:5173** di browser dan login dengan akun demo.

> **Catatan Windows:** `pnpm run dev:all` sudah menggunakan `python.exe -m uvicorn`. Pastikan virtual env `services/predict/.venv` sudah dibuat dan `pip install` sudah dijalankan. Jika `PREDICT` gagal start, aktifkan venv manual lalu jalankan `uvicorn app.main:app --reload --port 8001` dari direktori `services/predict`.

---

## Menjalankan Test

### Laravel (148 test)

```powershell
cd apps\api
php artisan test
```

Suite mencakup: autentikasi, transaksi CRUD, import CSV, prediksi (endpoint + job async), keamanan/ownership antar-user, edge cases, cuaca, libur nasional.

Test spesifik:

```powershell
php artisan test --filter="PredictionTest"
php artisan test --filter="WeatherTest"
php artisan test --filter="DashboardTest"
```

### FastAPI / Python

```powershell
cd services\predict
.venv\Scripts\activate
pytest -v --tb=short
```

### Frontend (type-check + build)

```powershell
pnpm --filter web build
```

---

## Struktur Folder

```
umkm-sense/
├── apps/
│   ├── web/              React 19 + Vite + TypeScript (SPA)
│   │   └── src/
│   │       ├── features/ modul per domain (auth, dashboard, analytics, …)
│   │       └── routes/   halaman per route
│   └── api/              Laravel 11 REST API
│       ├── app/
│       │   ├── Http/     Controllers, Middleware, Requests
│       │   ├── Jobs/     RunPredictionJob (queue)
│       │   ├── Models/   Eloquent models
│       │   └── Services/ WeatherService, HolidayService, …
│       ├── database/
│       │   ├── migrations/
│       │   └── seeders/  DemoSeeder, NationalHolidaySeeder
│       ├── routes/
│       │   ├── api.php
│       │   └── console.php  Laravel Scheduler (weather:sync, holidays:sync)
│       └── tests/Feature/   148 test
├── services/
│   └── predict/          Python 3.13 FastAPI
│       ├── app/
│       │   ├── forecasting/  Prophet, ARIMA, WMA
│       │   └── recommendations/  rule-based engine
│       └── tests/            unit tests
├── docker-compose.yml    PostgreSQL 16 + Redis 7
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

---

## Catatan Penting

**Data libur nasional** tidak bergantung pada API eksternal. Seeder lokal (`NationalHolidaySeeder`) menyediakan data yang andal sebagai fallback. Perintah `holidays:sync` mencoba sinkronisasi dari API publik; jika gagal, data seeder tetap dipakai.

**Sinkronisasi cuaca dan libur** dilakukan otomatis via Laravel Scheduler:

- `weather:sync` — setiap 6 jam (sesuai cache TTL 6 jam di WeatherService)
- `holidays:sync` — setiap hari

Untuk menjalankan scheduler di dev lokal:

```powershell
cd apps\api
php artisan schedule:work
```

Di production, tambahkan satu entri cron di server:

```
* * * * * cd /path/to/apps/api && php artisan schedule:run >> /dev/null 2>&1
```

---

## Troubleshooting

| Masalah                               | Solusi                                                                                                       |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `CSRF mismatch 419`                   | Pastikan `SANCTUM_STATEFUL_DOMAINS` di `apps/api/.env` menyertakan `localhost:5173`                          |
| FastAPI tidak merespons               | Cek `PREDICT_SERVICE_URL=http://localhost:8001` dan pastikan service `PREDICT` sudah berjalan                |
| Job prediksi tidak diproses           | Pastikan `QUEUE_CONNECTION=database` dan service `WORKER` berjalan (`php artisan queue:work`)                |
| `Connection refused` PostgreSQL/Redis | Jalankan `docker compose up -d` dari root dan tunggu status _healthy_                                        |
| Python `ModuleNotFoundError`          | Aktifkan venv: `.venv\Scripts\activate`, lalu `pip install -r requirements.txt`                              |
| "Tidak ada data historis"             | Tambah minimal 1 transaksi sukses untuk produk tersebut di halaman `/sales`                                  |
| `PREDICT_INTERNAL_KEY` mismatch       | Nilai `PREDICT_INTERNAL_KEY` (apps/api/.env) harus identik dengan `INTERNAL_API_KEY` (services/predict/.env) |

---

## Kredit

Dikembangkan sebagai proyek PKM-KC (Program Kreativitas Mahasiswa — Karsa Cipta).

© 2026 Tim UMKM-Sense. Hak cipta dilindungi.
