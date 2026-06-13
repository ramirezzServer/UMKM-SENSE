<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\District;
use App\Models\NationalHoliday;
use App\Models\Product;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\User;
use App\Models\WeatherData;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private function makeTx(string $date, float $amount, string $status = 'success'): Transaction
    {
        return Transaction::create([
            'user_id' => $this->user->id,
            'transaction_date' => $date,
            'total_amount' => $amount,
            'payment_method' => 'Cash',
            'status' => $status,
        ]);
    }

    private function addItem(Transaction $tx, Product $product, int $qty): void
    {
        TransactionItem::create([
            'transaction_id' => $tx->id,
            'product_id' => $product->id,
            'product_name' => $product->name,
            'qty' => $qty,
            'unit_price' => (float) $product->price,
            'subtotal' => $qty * (float) $product->price,
        ]);
    }

    private function makeProduct(string $name, float $price = 10000): Product
    {
        return Product::factory()->create([
            'user_id' => $this->user->id,
            'name' => $name,
            'price' => $price,
        ]);
    }

    // =========================================================================
    // Summary
    // =========================================================================

    public function test_summary_requires_authentication(): void
    {
        $this->getJson('/api/dashboard/summary')->assertUnauthorized();
    }

    public function test_summary_returns_zeros_with_no_transactions(): void
    {
        $this->actingAs($this->user)
            ->getJson('/api/dashboard/summary')
            ->assertOk()
            ->assertJsonPath('data.total_penjualan', 0)
            ->assertJsonPath('data.jumlah_transaksi', 0)
            ->assertJsonPath('data.rata_rata_per_transaksi', 0)
            ->assertJsonPath('data.vs_kemarin.total_penjualan.direction', null);
    }

    public function test_summary_aggregates_todays_transactions(): void
    {
        $today = now()->format('Y-m-d');
        $this->makeTx($today, 100000);
        $this->makeTx($today, 50000);

        $response = $this->actingAs($this->user)
            ->getJson('/api/dashboard/summary')
            ->assertOk();

        // Use assertEquals (not assertJsonPath) to avoid strict int/float mismatch in JSON
        $this->assertEquals(150000, $response->json('data.total_penjualan'));
        $this->assertEquals(2, $response->json('data.jumlah_transaksi'));
        $this->assertEquals(75000, $response->json('data.rata_rata_per_transaksi'));
    }

    public function test_summary_comparison_shows_up_when_today_better_than_yesterday(): void
    {
        $today = now()->format('Y-m-d');
        $yesterday = now()->subDay()->format('Y-m-d');

        $this->makeTx($today, 200000);
        $this->makeTx($yesterday, 100000);

        $response = $this->actingAs($this->user)
            ->getJson('/api/dashboard/summary')
            ->assertOk();

        $this->assertEquals('up', $response->json('data.vs_kemarin.total_penjualan.direction'));
        $this->assertEquals(100.0, $response->json('data.vs_kemarin.total_penjualan.pct'));
    }

    public function test_summary_comparison_shows_down_when_today_worse(): void
    {
        $today = now()->format('Y-m-d');
        $yesterday = now()->subDay()->format('Y-m-d');

        $this->makeTx($today, 50000);
        $this->makeTx($yesterday, 100000);

        $this->actingAs($this->user)
            ->getJson('/api/dashboard/summary')
            ->assertOk()
            ->assertJsonPath('data.vs_kemarin.total_penjualan.direction', 'down');
    }

    public function test_summary_excludes_failed_and_pending_transactions(): void
    {
        $today = now()->format('Y-m-d');
        $this->makeTx($today, 100000, 'failed');
        $this->makeTx($today, 200000, 'pending');

        $this->actingAs($this->user)
            ->getJson('/api/dashboard/summary')
            ->assertOk()
            ->assertJsonPath('data.total_penjualan', 0)
            ->assertJsonPath('data.jumlah_transaksi', 0);
    }

    public function test_summary_does_not_leak_other_users_data(): void
    {
        $other = User::factory()->create();
        $today = now()->format('Y-m-d');

        Transaction::create([
            'user_id' => $other->id,
            'transaction_date' => $today,
            'total_amount' => 999999,
            'payment_method' => 'Cash',
            'status' => 'success',
        ]);

        $this->actingAs($this->user)
            ->getJson('/api/dashboard/summary')
            ->assertOk()
            ->assertJsonPath('data.total_penjualan', 0);
    }

    // =========================================================================
    // Trend
    // =========================================================================

    public function test_trend_requires_authentication(): void
    {
        $this->getJson('/api/dashboard/trend')->assertUnauthorized();
    }

    public function test_trend_returns_seven_days_by_default(): void
    {
        $response = $this->actingAs($this->user)
            ->getJson('/api/dashboard/trend')
            ->assertOk();

        $this->assertCount(7, $response->json('data'));
    }

    public function test_trend_fills_missing_days_with_zero(): void
    {
        $today = now()->format('Y-m-d');
        $this->makeTx($today, 100000);

        $response = $this->actingAs($this->user)
            ->getJson('/api/dashboard/trend?days=7')
            ->assertOk();

        $data = $response->json('data');
        $this->assertCount(7, $data);

        // Today must have the transaction
        $todayEntry = collect($data)->firstWhere('date', $today);
        $this->assertEquals(100000.0, $todayEntry['total']);

        // All other days must be zero
        $others = collect($data)->filter(fn ($d) => $d['date'] !== $today);
        foreach ($others as $day) {
            $this->assertEquals(0.0, $day['total']);
        }
    }

    public function test_trend_has_correct_indonesian_day_labels(): void
    {
        $response = $this->actingAs($this->user)
            ->getJson('/api/dashboard/trend?days=7')
            ->assertOk();

        $dayLabels = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'];

        foreach ($response->json('data') as $entry) {
            $this->assertContains($entry['day_label'], $dayLabels);
        }
    }

    public function test_trend_does_not_leak_other_users_data(): void
    {
        $other = User::factory()->create();
        $today = now()->format('Y-m-d');

        Transaction::create([
            'user_id' => $other->id,
            'transaction_date' => $today,
            'total_amount' => 999999,
            'payment_method' => 'Cash',
            'status' => 'success',
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/dashboard/trend?days=1')
            ->assertOk();

        $this->assertEquals(0.0, $response->json('data.0.total'));
    }

    public function test_trend_validates_days_param(): void
    {
        $this->actingAs($this->user)
            ->getJson('/api/dashboard/trend?days=0')
            ->assertUnprocessable();

        $this->actingAs($this->user)
            ->getJson('/api/dashboard/trend?days=91')
            ->assertUnprocessable();
    }

    // =========================================================================
    // Top Products
    // =========================================================================

    public function test_top_products_requires_authentication(): void
    {
        $this->getJson('/api/dashboard/top-products')->assertUnauthorized();
    }

    public function test_top_products_returns_empty_when_no_transactions(): void
    {
        $this->actingAs($this->user)
            ->getJson('/api/dashboard/top-products')
            ->assertOk()
            ->assertJsonPath('data', []);
    }

    public function test_top_products_ranks_by_qty_descending(): void
    {
        $today = now()->format('Y-m-d');
        $prodA = $this->makeProduct('Produk A');
        $prodB = $this->makeProduct('Produk B');

        $tx = $this->makeTx($today, 100000);
        $this->addItem($tx, $prodA, 10); // more qty
        $this->addItem($tx, $prodB, 3);

        $response = $this->actingAs($this->user)
            ->getJson('/api/dashboard/top-products?days=7&limit=5')
            ->assertOk();

        $names = array_column($response->json('data'), 'product_name');
        $this->assertEquals('Produk A', $names[0]);
        $this->assertEquals('Produk B', $names[1]);
    }

    public function test_top_products_comparison_shows_up_when_current_better(): void
    {
        $today = now()->format('Y-m-d');
        $lastWeek = now()->subDays(8)->format('Y-m-d'); // previous period

        $prod = $this->makeProduct('Produk X');

        // Previous period: 5 sold
        $txPrev = $this->makeTx($lastWeek, 50000);
        $this->addItem($txPrev, $prod, 5);

        // Current period: 15 sold
        $txCurr = $this->makeTx($today, 150000);
        $this->addItem($txCurr, $prod, 15);

        $response = $this->actingAs($this->user)
            ->getJson('/api/dashboard/top-products?days=7')
            ->assertOk();

        $item = $response->json('data.0');
        $this->assertEquals(15, $item['total_qty']);
        $this->assertEquals('up', $item['vs_sebelumnya']['direction']);
        $this->assertEquals(200.0, $item['vs_sebelumnya']['pct']); // (15-5)/5*100
    }

    public function test_top_products_respects_limit(): void
    {
        $today = now()->format('Y-m-d');
        $tx = $this->makeTx($today, 300000);

        foreach (range(1, 6) as $i) {
            $prod = $this->makeProduct("Produk {$i}", 10000);
            $this->addItem($tx, $prod, $i);
        }

        $response = $this->actingAs($this->user)
            ->getJson('/api/dashboard/top-products?limit=3')
            ->assertOk();

        $this->assertCount(3, $response->json('data'));
    }

    public function test_top_products_does_not_leak_other_users_data(): void
    {
        $other = User::factory()->create();
        $today = now()->format('Y-m-d');

        $otherProd = Product::factory()->create(['user_id' => $other->id, 'name' => 'Produk Rival']);
        $otherTx = Transaction::create([
            'user_id' => $other->id,
            'transaction_date' => $today,
            'total_amount' => 99999,
            'payment_method' => 'Cash',
            'status' => 'success',
        ]);
        TransactionItem::create([
            'transaction_id' => $otherTx->id,
            'product_id' => $otherProd->id,
            'product_name' => $otherProd->name,
            'qty' => 999,
            'unit_price' => 1000,
            'subtotal' => 999000,
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/dashboard/top-products')
            ->assertOk();

        $this->assertEmpty($response->json('data'));
    }

    public function test_top_products_excludes_failed_transactions(): void
    {
        $today = now()->format('Y-m-d');
        $prod = $this->makeProduct('Produk Y');

        $tx = $this->makeTx($today, 100000, 'failed');
        $this->addItem($tx, $prod, 50);

        $this->actingAs($this->user)
            ->getJson('/api/dashboard/top-products')
            ->assertOk()
            ->assertJsonPath('data', []);
    }

    // =========================================================================
    // Conditions
    // =========================================================================

    public function test_conditions_requires_authentication(): void
    {
        $this->getJson('/api/dashboard/conditions')->assertUnauthorized();
    }

    public function test_conditions_returns_null_weather_with_no_business(): void
    {
        Http::fake([]); // no HTTP should fire

        $this->actingAs($this->user)
            ->getJson('/api/dashboard/conditions')
            ->assertOk()
            ->assertJsonPath('data.cuaca', null);
    }

    public function test_conditions_returns_weather_and_upcoming_holidays(): void
    {
        // Create business linked to user (no District row → WeatherService falls back to DB)
        Business::factory()->create([
            'user_id' => $this->user->id,
            'district' => 'Coblong',
        ]);

        // Seed weather for today in DB (bypasses HTTP)
        WeatherData::create([
            'district' => 'Coblong',
            'date' => now()->format('Y-m-d'),
            'condition' => 'clear',
            'temp_min' => 20.0,
            'temp_max' => 30.0,
            'precipitation' => 0.0,
            'weather_code' => 0,
        ]);

        // Seed a holiday in the next 7 days
        NationalHoliday::create([
            'holiday_date' => now()->addDays(2)->format('Y-m-d'),
            'holiday_name' => 'Hari Libur Test',
            'year' => now()->year,
        ]);

        Http::fake([]); // no HTTP should fire

        $response = $this->actingAs($this->user)
            ->getJson('/api/dashboard/conditions')
            ->assertOk();

        $this->assertEquals('clear', $response->json('data.cuaca.condition'));
        $this->assertCount(1, $response->json('data.events'));
        $this->assertEquals('Hari Libur Test', $response->json('data.events.0.name'));

        Http::assertNothingSent();
    }

    public function test_conditions_events_exclude_holidays_outside_7_day_window(): void
    {
        Http::fake([]);

        // Holiday tomorrow (in range)
        NationalHoliday::create([
            'holiday_date' => now()->addDay()->format('Y-m-d'),
            'holiday_name' => 'Libur Dalam Range',
            'year' => now()->year,
        ]);

        // Holiday 30 days later (out of range)
        NationalHoliday::create([
            'holiday_date' => now()->addDays(30)->format('Y-m-d'),
            'holiday_name' => 'Libur Luar Range',
            'year' => now()->year,
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/dashboard/conditions')
            ->assertOk();

        $events = $response->json('data.events');
        $this->assertCount(1, $events);
        $this->assertEquals('Libur Dalam Range', $events[0]['name']);
    }
}
