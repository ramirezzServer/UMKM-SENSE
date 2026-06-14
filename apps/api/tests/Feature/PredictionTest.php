<?php

namespace Tests\Feature;

use App\Jobs\RunPrediction;
use App\Models\PredictionLog;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class PredictionTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->product = Product::factory()->for($this->user)->create();
    }

    // ── POST /predictions ─────────────────────────────────────────────────────

    public function test_post_returns_202_and_dispatches_job(): void
    {
        Queue::fake();

        $this->actingAs($this->user)
            ->postJson('/api/predictions', [
                'product_id' => $this->product->id,
                'prediction_start' => now()->addDay()->toDateString(),
                'prediction_end' => now()->addDays(7)->toDateString(),
            ])
            ->assertStatus(202)
            ->assertJsonStructure(['prediction_id', 'status', 'message'])
            ->assertJson(['status' => 'pending']);

        Queue::assertPushed(RunPrediction::class, function ($job) {
            $log = PredictionLog::first();

            return $log && $log->status === 'pending';
        });
    }

    public function test_post_creates_pending_log_in_database(): void
    {
        Queue::fake();

        $start = now()->addDay()->toDateString();
        $end = now()->addDays(7)->toDateString();

        $this->actingAs($this->user)
            ->postJson('/api/predictions', [
                'product_id' => $this->product->id,
                'prediction_start' => $start,
                'prediction_end' => $end,
            ])
            ->assertStatus(202);

        $this->assertDatabaseHas('prediction_logs', [
            'user_id' => $this->user->id,
            'product_id' => $this->product->id,
            'status' => 'pending',
        ]);

        // Dates are cast to Carbon — compare via model, not raw assertDatabaseHas
        $log = PredictionLog::where('user_id', $this->user->id)->first();
        $this->assertEquals($start, $log->prediction_start->format('Y-m-d'));
        $this->assertEquals($end, $log->prediction_end->format('Y-m-d'));
    }

    public function test_post_rejects_product_owned_by_another_user(): void
    {
        Queue::fake();
        $other = User::factory()->create();
        $otherProduct = Product::factory()->for($other)->create();

        $this->actingAs($this->user)
            ->postJson('/api/predictions', [
                'product_id' => $otherProduct->id,
                'prediction_start' => now()->addDay()->toDateString(),
                'prediction_end' => now()->addDays(7)->toDateString(),
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('product_id');

        Queue::assertNothingPushed();
    }

    public function test_post_rejects_nonexistent_product(): void
    {
        Queue::fake();

        $this->actingAs($this->user)
            ->postJson('/api/predictions', [
                'product_id' => 99999,
                'prediction_start' => now()->addDay()->toDateString(),
                'prediction_end' => now()->addDays(7)->toDateString(),
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('product_id');
    }

    public function test_post_rejects_horizon_exceeding_14_days(): void
    {
        Queue::fake();

        $this->actingAs($this->user)
            ->postJson('/api/predictions', [
                'product_id' => $this->product->id,
                'prediction_start' => now()->addDay()->toDateString(),
                'prediction_end' => now()->addDays(16)->toDateString(), // 15 days
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('prediction_end');
    }

    public function test_post_accepts_exactly_14_day_horizon(): void
    {
        Queue::fake();

        $this->actingAs($this->user)
            ->postJson('/api/predictions', [
                'product_id' => $this->product->id,
                'prediction_start' => now()->addDay()->toDateString(),
                'prediction_end' => now()->addDays(15)->toDateString(), // 14-day horizon
            ])
            ->assertStatus(202);
    }

    public function test_post_rejects_end_before_start(): void
    {
        Queue::fake();

        $this->actingAs($this->user)
            ->postJson('/api/predictions', [
                'product_id' => $this->product->id,
                'prediction_start' => now()->addDays(5)->toDateString(),
                'prediction_end' => now()->addDay()->toDateString(),
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('prediction_end');
    }

    public function test_post_requires_authentication(): void
    {
        $this->postJson('/api/predictions', [
            'product_id' => $this->product->id,
            'prediction_start' => now()->addDay()->toDateString(),
            'prediction_end' => now()->addDays(7)->toDateString(),
        ])->assertStatus(401);
    }

    // ── GET /predictions/{id}/status ─────────────────────────────────────────

    public function test_get_status_returns_pending_for_new_log(): void
    {
        $log = PredictionLog::create([
            'user_id' => $this->user->id,
            'product_id' => $this->product->id,
            'status' => 'pending',
            'prediction_start' => now()->addDay()->toDateString(),
            'prediction_end' => now()->addDays(7)->toDateString(),
        ]);

        $this->actingAs($this->user)
            ->getJson("/api/predictions/{$log->id}/status")
            ->assertOk()
            ->assertJson(['status' => 'pending']);
    }

    public function test_get_status_returns_done_with_full_prediction(): void
    {
        $log = PredictionLog::create([
            'user_id' => $this->user->id,
            'product_id' => $this->product->id,
            'status' => 'done',
            'prediction_start' => now()->addDay()->toDateString(),
            'prediction_end' => now()->addDays(7)->toDateString(),
            'forecast_method' => 'wma',
            'mae' => 1.2,
            'mape' => 5.0,
            'ai_summary' => 'Prediksi stabil.',
        ]);

        $log->items()->create([
            'date' => now()->addDay()->toDateString(),
            'predicted_qty' => 10,
            'predicted_revenue' => 150000,
            'confidence' => 0.75,
            'level' => 'medium',
        ]);

        $log->recommendations()->create([
            'priority' => 'medium',
            'title' => 'Test Rec',
            'description' => 'Test description.',
            'sort_order' => 0,
        ]);

        $this->actingAs($this->user)
            ->getJson("/api/predictions/{$log->id}/status")
            ->assertOk()
            ->assertJson(['status' => 'done'])
            ->assertJsonStructure([
                'status',
                'prediction' => [
                    'product_id',
                    'prediction_start',
                    'prediction_end',
                    'forecast_method',
                    'mae',
                    'mape',
                    'ai_summary',
                    'items',
                    'recommendations',
                    'warnings',
                ],
            ]);
    }

    public function test_get_status_returns_failed_with_error_message(): void
    {
        $log = PredictionLog::create([
            'user_id' => $this->user->id,
            'product_id' => $this->product->id,
            'status' => 'failed',
            'prediction_start' => now()->addDay()->toDateString(),
            'prediction_end' => now()->addDays(7)->toDateString(),
            'error_message' => 'Layanan prediksi tidak tersedia.',
        ]);

        $this->actingAs($this->user)
            ->getJson("/api/predictions/{$log->id}/status")
            ->assertOk()
            ->assertJson([
                'status' => 'failed',
                'error' => 'Layanan prediksi tidak tersedia.',
            ]);
    }

    public function test_user_cannot_access_another_users_prediction(): void
    {
        $other = User::factory()->create();
        $otherProduct = Product::factory()->for($other)->create();

        $log = PredictionLog::create([
            'user_id' => $other->id,
            'product_id' => $otherProduct->id,
            'status' => 'pending',
            'prediction_start' => now()->addDay()->toDateString(),
            'prediction_end' => now()->addDays(7)->toDateString(),
        ]);

        $this->actingAs($this->user)
            ->getJson("/api/predictions/{$log->id}/status")
            ->assertStatus(404);
    }

    public function test_get_status_requires_authentication(): void
    {
        $log = PredictionLog::create([
            'user_id' => $this->user->id,
            'product_id' => $this->product->id,
            'status' => 'pending',
            'prediction_start' => now()->addDay()->toDateString(),
            'prediction_end' => now()->addDays(7)->toDateString(),
        ]);

        $this->getJson("/api/predictions/{$log->id}/status")
            ->assertStatus(401);
    }
}
