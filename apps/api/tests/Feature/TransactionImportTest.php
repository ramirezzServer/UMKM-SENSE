<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class TransactionImportTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    // ---------------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------------

    private function makeProduct(string $name, float $price = 10000, int $stock = 100): Product
    {
        return Product::factory()->create([
            'user_id' => $this->user->id,
            'name' => $name,
            'price' => $price,
            'current_stock' => $stock,
            'status' => 'active',
        ]);
    }

    private function makeCsvFile(string $content, string $name = 'import.csv'): UploadedFile
    {
        $tmp = tempnam(sys_get_temp_dir(), 'test_import_');
        file_put_contents($tmp, $content);

        return new UploadedFile($tmp, $name, 'text/csv', null, true);
    }

    private function makeBinaryFileMasqueradingAsCsv(): UploadedFile
    {
        // PNG magic bytes — finfo will detect as image/png, not text
        $tmp = tempnam(sys_get_temp_dir(), 'test_evil_');
        file_put_contents($tmp, "\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR");

        return new UploadedFile($tmp, 'evil.csv', 'text/csv', null, true);
    }

    private function validCsvRow(string $product, int $qty = 1, ?string $date = null): string
    {
        $date = $date ?? now()->format('Y-m-d');

        return "{$date},{$product},{$qty},15000,Cash,Pelanggan\n";
    }

    private function csvWithRows(array $dataRows): string
    {
        $header = "tanggal,nama_produk,qty,harga_satuan,metode_bayar,nama_pelanggan\n";

        return $header.implode('', $dataRows);
    }

    // ---------------------------------------------------------------------------
    // Template
    // ---------------------------------------------------------------------------

    public function test_template_returns_csv_with_correct_headers(): void
    {
        $response = $this->actingAs($this->user)
            ->get('/api/transactions/import/template')
            ->assertStatus(200)
            ->assertHeader('Content-Type', 'text/csv; charset=UTF-8');

        $body = $response->getContent();
        $this->assertStringContainsString('tanggal', $body);
        $this->assertStringContainsString('nama_produk', $body);
        $this->assertStringContainsString('qty', $body);
        $this->assertStringContainsString('harga_satuan', $body);
        $this->assertStringContainsString('metode_bayar', $body);
        $this->assertStringContainsString('nama_pelanggan', $body);
    }

    public function test_template_requires_authentication(): void
    {
        $this->getJson('/api/transactions/import/template')->assertStatus(401);
    }

    // ---------------------------------------------------------------------------
    // Preview — auth & file validation
    // ---------------------------------------------------------------------------

    public function test_preview_requires_authentication(): void
    {
        $this->postJson('/api/transactions/import/preview')->assertStatus(401);
    }

    public function test_preview_rejects_missing_file(): void
    {
        $this->actingAs($this->user)
            ->postJson('/api/transactions/import/preview', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['file']);
    }

    public function test_preview_rejects_binary_file_disguised_as_csv(): void
    {
        $this->actingAs($this->user)
            ->postJson('/api/transactions/import/preview', [
                'file' => $this->makeBinaryFileMasqueradingAsCsv(),
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['file']);
    }

    // ---------------------------------------------------------------------------
    // Preview — row validation
    // ---------------------------------------------------------------------------

    public function test_preview_accepts_valid_rows_and_returns_summary(): void
    {
        $this->makeProduct('Kopi Susu', 15000);

        $csv = $this->csvWithRows([
            $this->validCsvRow('Kopi Susu', 2),
        ]);

        $response = $this->actingAs($this->user)
            ->postJson('/api/transactions/import/preview', [
                'file' => $this->makeCsvFile($csv),
            ])
            ->assertStatus(200);

        $this->assertEquals(1, $response->json('summary.total'));
        $this->assertEquals(1, $response->json('summary.valid'));
        $this->assertEquals(0, $response->json('summary.invalid'));
        $this->assertNotEmpty($response->json('preview_token'));
    }

    public function test_preview_marks_invalid_rows_with_errors(): void
    {
        $this->makeProduct('Kopi Susu');

        $csv = $this->csvWithRows([
            $this->validCsvRow('Kopi Susu', 1),                   // row 2: valid
            now()->addDay()->format('Y-m-d').",Kopi Susu,1,15000,Cash,\n",  // row 3: future date
            "2025-01-10,Produk Tidak Ada,1,15000,Cash,\n",                  // row 4: unknown product
            "2025-01-10,Kopi Susu,0,15000,Cash,\n",                         // row 5: qty=0
        ]);

        $response = $this->actingAs($this->user)
            ->postJson('/api/transactions/import/preview', [
                'file' => $this->makeCsvFile($csv),
            ])
            ->assertStatus(200);

        $this->assertEquals(4, $response->json('summary.total'));
        $this->assertEquals(1, $response->json('summary.valid'));
        $this->assertEquals(3, $response->json('summary.invalid'));

        $errors = collect($response->json('errors'));
        $this->assertTrue($errors->contains('row', 3));
        $this->assertTrue($errors->contains('row', 4));
        $this->assertTrue($errors->contains('row', 5));
    }

    public function test_preview_rejects_future_date(): void
    {
        $this->makeProduct('Kopi Susu');

        $futureDate = now()->addDays(2)->format('Y-m-d');
        $csv = $this->csvWithRows([
            "{$futureDate},Kopi Susu,1,15000,Cash,\n",
        ]);

        $response = $this->actingAs($this->user)
            ->postJson('/api/transactions/import/preview', [
                'file' => $this->makeCsvFile($csv),
            ])
            ->assertStatus(200);

        $this->assertEquals(0, $response->json('summary.valid'));
        $errorMessages = collect($response->json('errors.0.errors'));
        $this->assertTrue($errorMessages->contains(fn ($m) => str_contains($m, 'masa depan')));
    }

    public function test_preview_rejects_product_not_owned_by_user(): void
    {
        $other = User::factory()->create();
        Product::factory()->create(['user_id' => $other->id, 'name' => 'Produk Orang Lain']);

        $csv = $this->csvWithRows([
            "2025-01-10,Produk Orang Lain,1,5000,Cash,\n",
        ]);

        $response = $this->actingAs($this->user)
            ->postJson('/api/transactions/import/preview', [
                'file' => $this->makeCsvFile($csv),
            ])
            ->assertStatus(200);

        $this->assertEquals(0, $response->json('summary.valid'));
        $this->assertEquals(1, $response->json('summary.invalid'));
    }

    public function test_preview_rejects_invalid_payment_method(): void
    {
        $this->makeProduct('Kopi Susu');

        $csv = $this->csvWithRows([
            "2025-01-10,Kopi Susu,1,15000,Dompet,\n",
        ]);

        $response = $this->actingAs($this->user)
            ->postJson('/api/transactions/import/preview', [
                'file' => $this->makeCsvFile($csv),
            ])
            ->assertStatus(200);

        $this->assertEquals(0, $response->json('summary.valid'));
    }

    public function test_preview_detects_duplicates_as_warnings(): void
    {
        $product = $this->makeProduct('Kopi Susu', 10000);

        // Create an existing transaction for the same date+product+qty
        $transaction = Transaction::factory()->create([
            'user_id' => $this->user->id,
            'transaction_date' => '2025-01-10',
        ]);
        TransactionItem::create([
            'transaction_id' => $transaction->id,
            'product_id' => $product->id,
            'product_name' => 'Kopi Susu',
            'qty' => 3,
            'unit_price' => 10000,
            'subtotal' => 30000,
        ]);

        // Import CSV with exact same date+product+qty
        $csv = $this->csvWithRows([
            "2025-01-10,Kopi Susu,3,10000,Cash,\n",
        ]);

        $response = $this->actingAs($this->user)
            ->postJson('/api/transactions/import/preview', [
                'file' => $this->makeCsvFile($csv),
            ])
            ->assertStatus(200);

        // Row is still valid (warning, not error)
        $this->assertEquals(1, $response->json('summary.valid'));
        $this->assertEquals(0, $response->json('summary.invalid'));
        $this->assertCount(1, $response->json('warnings'));
        $this->assertStringContainsString('duplikat', $response->json('warnings.0.message'));
    }

    public function test_preview_rejects_file_exceeding_1000_rows(): void
    {
        $this->makeProduct('Kopi Susu');

        $rows = array_fill(0, 1001, "2025-01-10,Kopi Susu,1,10000,Cash,\n");
        $csv = $this->csvWithRows($rows);

        $this->actingAs($this->user)
            ->postJson('/api/transactions/import/preview', [
                'file' => $this->makeCsvFile($csv),
            ])
            ->assertStatus(422)
            ->assertJsonPath('message', fn ($m) => str_contains($m, '1000'));
    }

    public function test_preview_returns_at_most_5_rows_in_preview_field(): void
    {
        $this->makeProduct('Kopi Susu');

        $rows = array_fill(0, 8, "2025-01-10,Kopi Susu,1,10000,Cash,\n");
        $csv = $this->csvWithRows($rows);

        $response = $this->actingAs($this->user)
            ->postJson('/api/transactions/import/preview', [
                'file' => $this->makeCsvFile($csv),
            ])
            ->assertStatus(200);

        $this->assertEquals(8, $response->json('summary.valid'));
        $this->assertCount(5, $response->json('preview'));
    }

    // ---------------------------------------------------------------------------
    // Confirm
    // ---------------------------------------------------------------------------

    public function test_confirm_requires_authentication(): void
    {
        $this->postJson('/api/transactions/import/confirm', ['preview_token' => 'abc'])
            ->assertStatus(401);
    }

    public function test_confirm_rejects_invalid_token(): void
    {
        $this->actingAs($this->user)
            ->postJson('/api/transactions/import/confirm', ['preview_token' => 'nonexistent_token'])
            ->assertStatus(422)
            ->assertJsonPath('message', fn ($m) => str_contains($m, 'Token'));
    }

    public function test_confirm_imports_only_valid_rows(): void
    {
        $product = $this->makeProduct('Kopi Susu', 10000, 50);

        $csv = $this->csvWithRows([
            $this->validCsvRow('Kopi Susu', 3, '2025-01-10'),
        ]);

        // Step 1: preview
        $previewResp = $this->actingAs($this->user)
            ->postJson('/api/transactions/import/preview', [
                'file' => $this->makeCsvFile($csv),
            ])
            ->assertStatus(200);

        $token = $previewResp->json('preview_token');

        // Step 2: confirm
        $confirmResp = $this->actingAs($this->user)
            ->postJson('/api/transactions/import/confirm', ['preview_token' => $token])
            ->assertStatus(200);

        $this->assertEquals(1, $confirmResp->json('imported'));
        $this->assertEmpty($confirmResp->json('skipped'));

        // Transaction persisted
        $this->assertDatabaseHas('transactions', ['user_id' => $this->user->id]);
        $count = Transaction::where('user_id', $this->user->id)
            ->whereDate('transaction_date', '2025-01-10')
            ->count();
        $this->assertEquals(1, $count);

        // Stock deducted
        $this->assertEquals(47, $product->fresh()->current_stock);
    }

    public function test_confirm_uses_database_price_not_csv_price(): void
    {
        $product = $this->makeProduct('Teh Manis', 8000, 100);

        // CSV says harga_satuan = 1, but DB price is 8000
        $csv = $this->csvWithRows([
            "2025-01-10,Teh Manis,2,1,Cash,\n",
        ]);

        // Invalid because harga_satuan = 1 fails min:0.01... wait, 1 is valid (>0 and ≤10M).
        // Hmm the CSV row would be valid. Let me use 9999999 which is valid too.
        // Actually 1 is valid. The point is DB price (8000) is used, not CSV price (1).
        $previewResp = $this->actingAs($this->user)
            ->postJson('/api/transactions/import/preview', [
                'file' => $this->makeCsvFile($csv),
            ])
            ->assertStatus(200);

        $this->assertEquals(1, $previewResp->json('summary.valid'));

        $token = $previewResp->json('preview_token');

        $this->actingAs($this->user)
            ->postJson('/api/transactions/import/confirm', ['preview_token' => $token])
            ->assertStatus(200);

        // Check that the imported transaction uses DB price (8000), not CSV price (1)
        $transaction = Transaction::where('user_id', $this->user->id)->latest()->first();
        $this->assertEquals(16000, (float) $transaction->total_amount); // 2 × 8000

        $item = $transaction->items->first();
        $this->assertEquals(8000, (float) $item->unit_price);
    }

    public function test_confirm_token_is_consumed_after_use(): void
    {
        $this->makeProduct('Kopi Susu', 10000, 50);

        $csv = $this->csvWithRows([
            $this->validCsvRow('Kopi Susu', 1),
        ]);

        $previewResp = $this->actingAs($this->user)
            ->postJson('/api/transactions/import/preview', [
                'file' => $this->makeCsvFile($csv),
            ])
            ->assertStatus(200);

        $token = $previewResp->json('preview_token');

        // First confirm → success
        $this->actingAs($this->user)
            ->postJson('/api/transactions/import/confirm', ['preview_token' => $token])
            ->assertStatus(200);

        // Second confirm with same token → invalid
        $this->actingAs($this->user)
            ->postJson('/api/transactions/import/confirm', ['preview_token' => $token])
            ->assertStatus(422);
    }

    public function test_confirm_skips_rows_where_product_was_deleted_since_preview(): void
    {
        $product = $this->makeProduct('Produk Sementara', 5000, 20);

        $csv = $this->csvWithRows([
            $this->validCsvRow('Produk Sementara', 1),
        ]);

        $previewResp = $this->actingAs($this->user)
            ->postJson('/api/transactions/import/preview', [
                'file' => $this->makeCsvFile($csv),
            ])
            ->assertStatus(200);

        $token = $previewResp->json('preview_token');

        // Delete product between preview and confirm
        $product->delete();

        $confirmResp = $this->actingAs($this->user)
            ->postJson('/api/transactions/import/confirm', ['preview_token' => $token])
            ->assertStatus(200);

        $this->assertEquals(0, $confirmResp->json('imported'));
        $this->assertCount(1, $confirmResp->json('skipped'));
    }
}
