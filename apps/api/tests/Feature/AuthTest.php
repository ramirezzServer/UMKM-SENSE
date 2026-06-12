<?php

namespace Tests\Feature;

use App\Models\District;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Simulate a stateful SPA request (browser from localhost:5173).
     * EnsureFrontendRequestsAreStateful needs Origin to be in the stateful
     * domains list so it boots the session middleware on API routes.
     */
    private function spa(): static
    {
        return $this->withHeader('Origin', 'http://localhost');
    }

    private function createDistrict(): District
    {
        return District::create([
            'name' => 'Coblong',
            'city' => 'Kota Bandung',
            'province' => 'Jawa Barat',
            'latitude' => -6.8876,
            'longitude' => 107.6179,
        ]);
    }

    private function registerPayload(array $overrides = []): array
    {
        return [
            'name' => 'Budi Santoso',
            'email' => 'budi@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'business_name' => 'Warung Budi',
            'business_category' => 'Kuliner',
            'district' => 'Coblong',
            ...$overrides,
        ];
    }

    public function test_user_can_register(): void
    {
        $this->createDistrict();

        $response = $this->spa()->postJson('/api/register', $this->registerPayload());

        $response->assertStatus(201)
            ->assertJsonPath('data.email', 'budi@example.com')
            ->assertJsonPath('data.business.name', 'Warung Budi')
            ->assertJsonPath('data.business.category', 'Kuliner');

        $this->assertDatabaseHas('users', ['email' => 'budi@example.com']);
        $this->assertDatabaseHas('businesses', ['name' => 'Warung Budi']);
    }

    public function test_register_rejects_duplicate_email(): void
    {
        $this->createDistrict();
        User::factory()->create(['email' => 'budi@example.com']);

        $response = $this->spa()->postJson('/api/register', $this->registerPayload());

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email'])
            ->assertJsonPath('errors.email.0', 'Email ini sudah terdaftar.');
    }

    public function test_user_can_login(): void
    {
        User::factory()->create([
            'email' => 'budi@example.com',
            'password' => Hash::make('password123'),
        ]);

        $response = $this->spa()->postJson('/api/login', [
            'email' => 'budi@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.email', 'budi@example.com');
    }

    public function test_login_rejects_wrong_credentials(): void
    {
        User::factory()->create([
            'email' => 'budi@example.com',
            'password' => Hash::make('password123'),
        ]);

        $response = $this->spa()->postJson('/api/login', [
            'email' => 'budi@example.com',
            'password' => 'salah_password',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('errors.email.0', 'Email atau password salah.');
    }

    public function test_me_requires_authentication(): void
    {
        $response = $this->getJson('/api/me');

        $response->assertStatus(401);
    }
}
