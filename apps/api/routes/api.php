<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\PasswordResetController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\TransactionController;
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

    Route::apiResource('products', ProductController::class);
    Route::apiResource('transactions', TransactionController::class);
});
