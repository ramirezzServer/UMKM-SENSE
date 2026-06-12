<?php

namespace App\Http\Controllers;

use App\Http\Requests\ForgotPasswordRequest;
use App\Http\Requests\ResetPasswordRequest;
use App\Http\Requests\VerifyOtpRequest;
use App\Mail\OtpMail;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;

class PasswordResetController extends Controller
{
    private const OTP_TTL_MINUTES = 15;

    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        $user = User::where('email', $request->email)->first();

        if ($user) {
            $otp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

            DB::table('password_resets')->updateOrInsert(
                ['email' => $request->email],
                ['token' => $otp, 'created_at' => now()],
            );

            Mail::to($request->email)->send(new OtpMail($otp));
        }

        // Respon generik — tidak bocorkan apakah email terdaftar (anti user enumeration)
        return response()->json([
            'message' => 'Jika email terdaftar, kode OTP telah dikirim ke inbox Anda.',
        ]);
    }

    public function verifyOtp(VerifyOtpRequest $request): JsonResponse
    {
        $reset = DB::table('password_resets')
            ->where('email', $request->email)
            ->where('token', $request->otp)
            ->first();

        if (! $reset || Carbon::parse($reset->created_at)->addMinutes(self::OTP_TTL_MINUTES)->isPast()) {
            throw ValidationException::withMessages([
                'otp' => ['Kode OTP tidak valid atau sudah kedaluwarsa.'],
            ]);
        }

        return response()->json(['verified' => true]);
    }

    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $reset = DB::table('password_resets')
            ->where('email', $request->email)
            ->where('token', $request->otp)
            ->first();

        if (! $reset || Carbon::parse($reset->created_at)->addMinutes(self::OTP_TTL_MINUTES)->isPast()) {
            throw ValidationException::withMessages([
                'otp' => ['Kode OTP tidak valid atau sudah kedaluwarsa.'],
            ]);
        }

        User::where('email', $request->email)
            ->update(['password' => Hash::make($request->password)]);

        DB::table('password_resets')->where('email', $request->email)->delete();

        return response()->json([
            'message' => 'Password berhasil diperbarui. Silakan login dengan password baru Anda.',
        ]);
    }
}
