<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\District;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class ProfileAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    private function createUserWithBusiness(string $email = 'user@test.com'): array
    {
        $user = User::factory()->create(['email' => $email]);
        $business = Business::create([
            'user_id' => $user->id,
            'name' => "Bisnis {$email}",
            'category' => 'Kuliner',
            'district' => 'Coblong',
        ]);

        return [$user, $business];
    }

    public function test_unauthenticated_cannot_access_profile(): void
    {
        $this->getJson('/api/profile')->assertStatus(401);
        $this->putJson('/api/profile', [])->assertStatus(401);
    }

    public function test_user_can_view_own_profile(): void
    {
        [$user] = $this->createUserWithBusiness('budi@test.com');

        $this->actingAs($user)
            ->getJson('/api/profile')
            ->assertStatus(200)
            ->assertJsonPath('data.email', 'budi@test.com')
            ->assertJsonPath('data.business.name', 'Bisnis budi@test.com');
    }

    public function test_user_can_update_own_business_via_profile(): void
    {
        [$user] = $this->createUserWithBusiness('budi@test.com');

        // Create district so 'exists' validation passes
        District::create([
            'name' => 'Bandung Wetan',
            'city' => 'Kota Bandung',
            'province' => 'Jawa Barat',
            'latitude' => -6.9135,
            'longitude' => 107.6218,
        ]);

        $this->actingAs($user)
            ->putJson('/api/profile', [
                'name' => 'Warung Nasi Budi',
                'category' => 'Kuliner',
                'district' => 'Bandung Wetan',
            ])
            ->assertStatus(200)
            ->assertJsonPath('data.business.name', 'Warung Nasi Budi')
            ->assertJsonPath('data.business.district', 'Bandung Wetan');

        $this->assertDatabaseHas('businesses', ['name' => 'Warung Nasi Budi']);
    }

    public function test_user_cannot_edit_others_business_via_id_route(): void
    {
        [$userA] = $this->createUserWithBusiness('a@test.com');
        [, $businessB] = $this->createUserWithBusiness('b@test.com');

        // User A tries to update User B's business by explicit ID — must be blocked
        $this->actingAs($userA)
            ->putJson('/api/business/'.$businessB->id, ['name' => 'Hacked'])
            ->assertStatus(403);

        // Business B must remain unchanged
        $this->assertDatabaseMissing('businesses', ['name' => 'Hacked']);
    }

    public function test_user_b_can_still_update_own_business(): void
    {
        [, $businessA] = $this->createUserWithBusiness('a@test.com');
        [$userB] = $this->createUserWithBusiness('b@test.com');

        // After the IDOR attempt above, User B can still update their own business
        $this->actingAs($userB)
            ->putJson('/api/business/'.$userB->business->id, ['name' => 'Toko Sah Milik B'])
            ->assertStatus(200)
            ->assertJsonPath('data.business.name', 'Toko Sah Milik B');

        // Business A must be untouched
        $this->assertDatabaseHas('businesses', ['id' => $businessA->id, 'name' => 'Bisnis a@test.com']);
    }

    public function test_security_headers_are_present(): void
    {
        [$user] = $this->createUserWithBusiness();

        $response = $this->actingAs($user)->getJson('/api/profile');

        $response->assertHeader('X-Content-Type-Options', 'nosniff');
        $response->assertHeader('X-Frame-Options', 'DENY');
        $response->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    }
}
