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
- **PHP** 8.3+ dan **Composer** (untuk apps/api nanti)
- **Python** 3.12+ (untuk services/predict nanti)
- **PostgreSQL** dan **Redis** (lokal atau via Docker)

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
