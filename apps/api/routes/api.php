<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\PasswordResetController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\TransactionImportController;
use App\Http\Controllers\WeatherController;
use App\Models\District;
use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => response()->json(['status' => 'ok']));

Route::get('/districts', fn () => response()->json(
    District::orderBy('city')->orderBy('name')->get(['id', 'name', 'city', 'province'])
));

Route::post('/register', [AuthController::class, 'register'])
    ->middleware('throttle:register');

Route::post('/login', [AuthController::class, 'login'])
    ->middleware('throttle:login');

Route::post('/forgot-password', [PasswordResetController::class, 'forgotPassword'])
    ->middleware('throttle:forgot-password');

Route::post('/verify-otp', [PasswordResetController::class, 'verifyOtp'])
    ->middleware('throttle:forgot-password');

Route::post('/reset-password', [PasswordResetController::class, 'resetPassword']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Business profile (always the authenticated user's own business)
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);

    // Explicit ID route — demonstrates IDOR/ownership protection via BusinessPolicy
    Route::put('/business/{business}', [ProfileController::class, 'updateById']);

    Route::get('/products/select', [ProductController::class, 'select']);
    Route::apiResource('products', ProductController::class);

    // Import routes BEFORE apiResource to avoid {transaction} binding conflict
    Route::get('/transactions/import/template', [TransactionImportController::class, 'template']);
    Route::post('/transactions/import/preview', [TransactionImportController::class, 'preview']);
    Route::post('/transactions/import/confirm', [TransactionImportController::class, 'confirm']);

    Route::apiResource('transactions', TransactionController::class);

    Route::get('/weather/today', [WeatherController::class, 'today']);
});
