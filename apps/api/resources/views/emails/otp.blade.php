<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Kode OTP Reset Password</title>
</head>
<body style="font-family: sans-serif; max-width: 480px; margin: 40px auto; color: #333;">
    <h2 style="color: #1e40af;">UMKM-Sense</h2>
    <p>Halo,</p>
    <p>Kami menerima permintaan reset password untuk akun Anda. Gunakan kode OTP berikut:</p>
    <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
        <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1e40af;">{{ $otp }}</span>
    </div>
    <p>Kode ini berlaku selama <strong>15 menit</strong>.</p>
    <p style="color: #ef4444;">Jangan bagikan kode ini kepada siapapun, termasuk tim UMKM-Sense.</p>
    <hr style="margin: 32px 0; border: none; border-top: 1px solid #e2e8f0;">
    <p style="font-size: 12px; color: #94a3b8;">
        Jika Anda tidak meminta reset password, abaikan email ini. Akun Anda tetap aman.
    </p>
</body>
</html>
