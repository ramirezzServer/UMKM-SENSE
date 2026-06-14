<?php

namespace App\Providers;

use App\Models\Product;
use App\Models\Transaction;
use App\Policies\ProductPolicy;
use App\Policies\TransactionPolicy;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        Gate::policy(Product::class, ProductPolicy::class);
        Gate::policy(Transaction::class, TransactionPolicy::class);
        $this->configureRateLimiters();
    }

    private function configureRateLimiters(): void
    {
        // Login: 5 percobaan/menit per kombinasi email+IP
        RateLimiter::for('login', function (Request $request) {
            return Limit::perMinute(5)
                ->by($request->input('email', '').'|'.$request->ip())
                ->response(function (Request $request, array $headers) {
                    $retryAfter = $headers['Retry-After'] ?? 60;

                    return response()->json([
                        'message' => "Terlalu banyak percobaan, coba lagi dalam {$retryAfter} detik.",
                    ], 429, $headers);
                });
        });

        // Forgot password & verify OTP: 5 permintaan/menit per IP
        RateLimiter::for('forgot-password', function (Request $request) {
            return Limit::perMinute(5)
                ->by($request->ip())
                ->response(function (Request $request, array $headers) {
                    $retryAfter = $headers['Retry-After'] ?? 60;

                    return response()->json([
                        'message' => "Terlalu banyak percobaan, coba lagi dalam {$retryAfter} detik.",
                    ], 429, $headers);
                });
        });

        // Register: 10 permintaan/menit per IP
        RateLimiter::for('register', function (Request $request) {
            return Limit::perMinute(10)
                ->by($request->ip())
                ->response(function (Request $request, array $headers) {
                    $retryAfter = $headers['Retry-After'] ?? 60;

                    return response()->json([
                        'message' => "Terlalu banyak percobaan, coba lagi dalam {$retryAfter} detik.",
                    ], 429, $headers);
                });
        });

        // Predictions: 10 permintaan/jam per user (anti-abuse komputasi berat)
        RateLimiter::for('predictions', function (Request $request) {
            return Limit::perHour(10)
                ->by($request->user()?->id ?: $request->ip())
                ->response(function (Request $request, array $headers) {
                    $retryAfter = $headers['Retry-After'] ?? 3600;

                    return response()->json([
                        'message' => "Batas permintaan prediksi tercapai. Coba lagi dalam {$retryAfter} detik.",
                    ], 429, $headers);
                });
        });
    }
}
