# apps/api — Backend API (Laravel 11)

Ini adalah backend REST API UMKM-Sense. Belum di-scaffold, placeholder dulu.

## Stack yang akan dipakai
- Laravel 11
- PHP 8.3+
- PostgreSQL (database utama)
- Redis (cache & queue)

## Cara setup (nanti)
```bash
cd apps/api
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```
