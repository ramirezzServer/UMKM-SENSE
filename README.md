# UMKM-Sense

Platform analitik dan prediksi penjualan untuk UMKM Indonesia. Bantu pelaku usaha kecil dan menengah buat keputusan bisnis yang lebih cerdas berdasarkan data penjualan mereka sendiri.

---

## Apa ini?

UMKM-Sense adalah web app yang memungkinkan UMKM untuk:
- Melacak dan memvisualisasikan data penjualan secara real-time
- Mendapatkan prediksi tren penjualan ke depan
- Membaca insight bisnis yang actionable tanpa perlu paham statistik

---

## Struktur Monorepo

```
umkm-sense/
├── apps/
│   ├── web/          → Frontend (React 19 + Vite + TypeScript)
│   └── api/          → Backend REST API (Laravel 11)
├── services/
│   └── predict/      → Microservice prediksi penjualan (Python FastAPI)
├── packages/         → Shared packages (types, utils, dll — akan diisi nanti)
├── turbo.json        → Konfigurasi Turborepo
├── pnpm-workspace.yaml
└── package.json
```

---

## Tech Stack

| Layer        | Teknologi                          |
|--------------|------------------------------------|
| Frontend     | React 19, Vite, TypeScript         |
| Backend API  | Laravel 11, PHP 8.3+               |
| Prediksi     | Python 3.12+, FastAPI              |
| Database     | PostgreSQL                         |
| Cache/Queue  | Redis                              |
| Monorepo     | Turborepo + pnpm workspaces        |

---

## Prasyarat

Sebelum mulai, pastikan sudah terpasang:

- **Node.js** v20+ (cek: `node -v`) — disarankan pakai [nvm](https://github.com/nvm-sh/nvm)
- **pnpm** v9+ (cek: `pnpm -v`) — install via `npm install -g pnpm`
- **PHP** 8.2+ dan **Composer** (untuk apps/api)
- **Python** 3.12+ (untuk services/predict nanti)
- **Docker** & **Docker Compose** v2+ — untuk menjalankan PostgreSQL dan Redis lokal

---

## Menjalankan Database Lokal

PostgreSQL dan Redis dijalankan via Docker Compose. Tidak perlu install dua-duanya secara manual di host.

### Setup pertama kali

```bash
# Salin template env untuk docker compose
cp .env.example .env

# Edit .env dan ganti POSTGRES_PASSWORD dengan password pilihan kamu
# (POSTGRES_USER dan POSTGRES_DB boleh dibiarkan default)
```

### Nyalakan service

```bash
# Jalankan di background
docker compose up -d

# Cek status — semua service harus "healthy"
docker compose ps
```

Output yang diharapkan:

```
NAME                IMAGE                STATUS
umkm-sense-postgres-1   postgres:16-alpine   Up (healthy)
umkm-sense-redis-1      redis:7-alpine       Up (healthy)
```

### Cek koneksi manual (opsional)

```bash
# Masuk ke psql
docker compose exec postgres psql -U umkm -d umkm_sense

# Ping Redis
docker compose exec redis redis-cli ping
# Output: PONG
```

### Matikan service

```bash
docker compose down          # Matikan container, volume tetap ada
docker compose down -v       # Matikan + hapus semua data (hati-hati!)
```

### Koneksi ke Laravel

Setelah service jalan, setup Laravel dengan:

```bash
cd apps/api
cp .env.example .env
# Pastikan nilai DB_* dan REDIS_* di apps/api/.env cocok dengan root .env
php artisan key:generate
php artisan migrate
```

Nilai default sudah dikonfigurasi menunjuk ke `127.0.0.1:5432` (PostgreSQL) dan `127.0.0.1:6379` (Redis) — sama persis dengan port yang di-expose docker compose.

---

## Cara Install

Clone dulu, lalu install semua dependensi Node sekaligus dari root:

```bash
git clone <repo-url>
cd umkm-sense

# Pakai versi Node yang benar (kalau pakai nvm)
nvm use

# Install semua dependencies
pnpm install
```

---

## Cara Run

```bash
# Jalankan semua apps sekaligus (development mode)
pnpm dev

# Atau spesifik per app
pnpm --filter web dev
pnpm --filter api dev
```

### Pipeline lain yang tersedia

```bash
pnpm build    # Build semua apps
pnpm lint     # Lint semua apps
pnpm test     # Jalankan semua test
```

---

## Kontribusi

Masih fase awal. Struktur dan konvensi kode akan didokumentasikan lebih lanjut seiring perkembangan proyek.

---

## Lisensi

Hak cipta © 2026. Semua hak dilindungi.
