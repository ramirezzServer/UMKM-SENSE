<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush(); // reset rate limiters between tests
        Mail::fake();   // intercept all outgoing mail
    }

    public function test_correct_otp_is_accepted(): void
    {
        User::factory()->create(['email' => 'budi@example.com']);

        // Step 1: request OTP
        $this->postJson('/api/forgot-password', ['email' => 'budi@example.com'])
            ->assertStatus(200);

        // Retrieve generated OTP directly from DB
        $otp = DB::table('password_resets')
            ->where('email', 'budi@example.com')
            ->value('token');

        $this->assertNotNull($otp);

        // Step 2: verify OTP
        $response = $this->postJson('/api/verify-otp', [
            'email' => 'budi@example.com',
            'otp' => $otp,
        ]);

        $response->assertStatus(200)->assertJsonPath('verified', true);
    }

    public function test_wrong_otp_is_rejected(): void
    {
        User::factory()->create(['email' => 'budi@example.com']);

        $this->postJson('/api/forgot-password', ['email' => 'budi@example.com']);

        $response = $this->postJson('/api/verify-otp', [
            'email' => 'budi@example.com',
            'otp' => '000000', // deliberately wrong
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('errors.otp.0', 'Kode OTP tidak valid atau sudah kedaluwarsa.');
    }

    public function test_expired_otp_is_rejected(): void
    {
        User::factory()->create(['email' => 'budi@example.com']);

        // Insert an OTP that expired 16 minutes ago
        DB::table('password_resets')->insert([
            'email' => 'budi@example.com',
            'token' => '123456',
            'created_at' => Carbon::now()->subMinutes(16),
        ]);

        $response = $this->postJson('/api/verify-otp', [
            'email' => 'budi@example.com',
            'otp' => '123456',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('errors.otp.0', 'Kode OTP tidak valid atau sudah kedaluwarsa.');
    }
}
