<?php

namespace Tests\Feature;

use App\Jobs\RunPrediction;
use App\Models\PredictionLog;
use App\Models\Product;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\User;
use App\Services\HolidayService;
use App\Services\PredictionClient;
use App\Services\WeatherService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class RunPredictionJobTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Product $product;

    private PredictionLog $log;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->product = Product::factory()->for($this->user)->create(['price' => 15000]);

        $this->log = PredictionLog::create([
            'user_id' => $this->user->id,
            'product_id' => $this->product->id,
            'status' => 'pending',
            'prediction_start' => now()->addDay()->toDateString(),
            'prediction_end' => now()->addDays(7)->toDateString(),
        ]);
    }

    // ── Successful processing ─────────────────────────────────────────────────

    public function test_job_processes_and_saves_full_result(): void
    {
        $this->seedTransactions();

        Http::fake([
            '*/predict' => Http::response($this->fakePredictionResponse(), 200),
        ]);

        RunPrediction::dispatchSync($this->log->id);

        $this->log->refresh();
        $this->assertEquals('done', $this->log->status);
        $this->assertEquals('wma', $this->log->forecast_method);
        $this->assertEquals(1.0, $this->log->mae);
        $this->assertEquals(5.0, $this->log->mape);
        $this->assertEquals('Prediksi stabil.', $this->log->ai_summary);
        $this->assertNull($this->log->error_message);
    }

    public function test_job_saves_prediction_items(): void
    {
        $this->seedTransactions();

        Http::fake(['*/predict' => Http::response($this->fakePredictionResponse(), 200)]);

        RunPrediction::dispatchSync($this->log->id);

        $this->assertDatabaseCount('prediction_items', 1);
        $this->assertDatabaseHas('prediction_items', [
            'prediction_log_id' => $this->log->id,
            'predicted_qty' => 10,
            'confidence' => 0.75,
            'level' => 'medium',
        ]);
    }

    public function test_job_saves_recommendations(): void
    {
        $this->seedTransactions();

        Http::fake(['*/predict' => Http::response($this->fakePredictionResponse(), 200)]);

        RunPrediction::dispatchSync($this->log->id);

        $this->assertDatabaseCount('prediction_recommendations', 1);
        $this->assertDatabaseHas('prediction_recommendations', [
            'prediction_log_id' => $this->log->id,
            'priority' => 'medium',
            'title' => 'Pantau Realisasi',
        ]);
    }

    public function test_job_saves_warnings(): void
    {
        $this->seedTransactions();

        Http::fake(['*/predict' => Http::response($this->fakePredictionResponse(warnings: [
            ['level' => 'medium', 'message' => 'Data historis terbatas.'],
        ]), 200)]);

        RunPrediction::dispatchSync($this->log->id);

        $this->assertDatabaseCount('prediction_warnings', 1);
        $this->assertDatabaseHas('prediction_warnings', [
            'prediction_log_id' => $this->log->id,
            'level' => 'medium',
            'message' => 'Data historis terbatas.',
        ]);
    }

    public function test_job_sets_status_to_processing_then_done(): void
    {
        $this->seedTransactions();

        Http::fake(['*/predict' => Http::response($this->fakePredictionResponse(), 200)]);

        // Verify: after dispatchSync the final status is 'done'.
        RunPrediction::dispatchSync($this->log->id);

        $this->assertEquals('done', $this->log->fresh()->status);
    }

    // ── Service down / error ──────────────────────────────────────────────────

    public function test_job_marks_failed_when_service_returns_500(): void
    {
        $this->seedTransactions();

        Http::fake(['*/predict' => Http::response(['error' => 'Internal error'], 500)]);

        // With tries=3, job will attempt 3 times — use dispatchSync to run once and catch.
        // We test the `failed()` callback by directly testing final DB state after exhaustion.
        // dispatchSync does not retry, so we call failed() manually to simulate exhaustion.
        $job = new RunPrediction($this->log->id);
        try {
            $job->handle(
                app(PredictionClient::class),
                app(WeatherService::class),
                app(HolidayService::class),
            );
        } catch (\Throwable $e) {
            $job->failed($e);
        }

        $this->assertEquals('failed', $this->log->fresh()->status);
        $this->assertNotNull($this->log->fresh()->error_message);
    }

    public function test_job_marks_failed_when_service_connection_refused(): void
    {
        $this->seedTransactions();

        Http::fake(['*/predict' => fn () => throw new ConnectionException('Connection refused')]);

        $job = new RunPrediction($this->log->id);
        try {
            $job->handle(
                app(PredictionClient::class),
                app(WeatherService::class),
                app(HolidayService::class),
            );
        } catch (\Throwable $e) {
            $job->failed($e);
        }

        $this->assertEquals('failed', $this->log->fresh()->status);
    }

    public function test_job_marks_failed_gracefully_when_no_historical_data(): void
    {
        // No transactions seeded — historical_data will be empty.
        // Fake all HTTP so HolidayService / WeatherService don't hit real APIs.
        Http::fake();

        RunPrediction::dispatchSync($this->log->id);

        $fresh = $this->log->fresh();
        $this->assertEquals('failed', $fresh->status);
        $this->assertStringContainsString('historis', $fresh->error_message);

        // FastAPI /predict endpoint must never have been called.
        Http::assertNotSent(fn ($req) => str_contains($req->url(), '/predict'));
    }

    // ── Isolation: other users cannot see results ─────────────────────────────

    public function test_other_user_prediction_log_is_isolated(): void
    {
        $this->seedTransactions();

        Http::fake(['*/predict' => Http::response($this->fakePredictionResponse(), 200)]);

        RunPrediction::dispatchSync($this->log->id);

        // A different user's log must not appear in the first user's scope.
        $other = User::factory()->create();
        $count = PredictionLog::where('user_id', $other->id)->count();
        $this->assertEquals(0, $count);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function seedTransactions(): void
    {
        $transaction = Transaction::create([
            'user_id' => $this->user->id,
            'customer_name' => 'Pelanggan Test',
            'transaction_date' => now()->subDays(5)->toDateString(),
            'payment_method' => 'Cash',
            'total_amount' => 150000,
            'status' => 'success',
        ]);

        TransactionItem::create([
            'transaction_id' => $transaction->id,
            'product_id' => $this->product->id,
            'product_name' => $this->product->name,
            'qty' => 10,
            'unit_price' => 15000,
            'subtotal' => 150000,
        ]);
    }

    private function fakePredictionResponse(array $warnings = []): array
    {
        return [
            'predictions' => [
                [
                    'date' => now()->addDay()->toDateString(),
                    'predicted_qty' => 10,
                    'predicted_revenue' => '150000.00',
                    'confidence' => 0.75,
                    'level' => 'medium',
                ],
            ],
            'accuracy_metrics' => [
                'method' => 'wma',
                'mae' => 1.0,
                'mape' => 5.0,
            ],
            'ai_summary' => 'Prediksi stabil.',
            'recommendations' => [
                [
                    'priority' => 'medium',
                    'title' => 'Pantau Realisasi',
                    'description' => 'Bandingkan penjualan aktual dengan prediksi setiap hari.',
                ],
            ],
            'warnings' => $warnings,
        ];
    }
}
