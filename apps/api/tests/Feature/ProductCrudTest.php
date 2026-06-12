<?php

namespace Tests\Feature;

use App\Enums\ProductStatus;
use App\Models\Product;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProductCrudTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
        $this->user = User::factory()->create();
    }

    // ---------------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------------

    private function makeRealJpeg(string $name = 'product.jpg'): UploadedFile
    {
        $img = \imagecreatetruecolor(100, 100);
        \imagecolorallocate($img, 255, 0, 0);

        $tmp = tempnam(sys_get_temp_dir(), 'umkm_test_');
        \imagejpeg($img, $tmp, 90);
        \imagedestroy($img);

        return new UploadedFile($tmp, $name, 'image/jpeg', null, true);
    }

    private function makeNonImageFile(string $name = 'evil.jpg'): UploadedFile
    {
        $tmp = tempnam(sys_get_temp_dir(), 'umkm_evil_');
        file_put_contents($tmp, '<?php echo "hacked"; ?>');

        return new UploadedFile($tmp, $name, 'image/jpeg', null, true);
    }

    private function validPayload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Produk Test Satu',
            'price' => 15000,
            'current_stock' => 10,
            'category' => 'Makanan',
            'status' => 'active',
        ], $overrides);
    }

    // ---------------------------------------------------------------------------
    // Auth guard
    // ---------------------------------------------------------------------------

    public function test_unauthenticated_cannot_access_products(): void
    {
        $this->getJson('/api/products')->assertStatus(401);
        $this->postJson('/api/products', [])->assertStatus(401);
    }

    // ---------------------------------------------------------------------------
    // Index
    // ---------------------------------------------------------------------------

    public function test_index_returns_only_own_products(): void
    {
        $otherUser = User::factory()->create();

        Product::factory()->create(['user_id' => $this->user->id, 'name' => 'Milik Saya']);
        Product::factory()->create(['user_id' => $otherUser->id, 'name' => 'Milik Orang Lain']);

        $this->actingAs($this->user)
            ->getJson('/api/products')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Milik Saya');
    }

    public function test_index_can_filter_by_status(): void
    {
        Product::factory()->create(['user_id' => $this->user->id, 'name' => 'Aktif', 'status' => 'active']);
        Product::factory()->create(['user_id' => $this->user->id, 'name' => 'Nonaktif', 'status' => 'inactive']);

        $this->actingAs($this->user)
            ->getJson('/api/products?status=active')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Aktif');
    }

    public function test_index_can_search_by_name(): void
    {
        Product::factory()->create(['user_id' => $this->user->id, 'name' => 'Kopi Susu']);
        Product::factory()->create(['user_id' => $this->user->id, 'name' => 'Teh Manis']);

        $this->actingAs($this->user)
            ->getJson('/api/products?search=Kopi')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Kopi Susu');
    }

    // ---------------------------------------------------------------------------
    // Store
    // ---------------------------------------------------------------------------

    public function test_user_can_create_product(): void
    {
        $this->actingAs($this->user)
            ->postJson('/api/products', $this->validPayload())
            ->assertStatus(201)
            ->assertJsonPath('data.name', 'Produk Test Satu')
            ->assertJsonPath('data.status', 'active');

        $this->assertDatabaseHas('products', [
            'user_id' => $this->user->id,
            'name' => 'Produk Test Satu',
        ]);
    }

    public function test_store_rejects_duplicate_name_for_same_user(): void
    {
        Product::factory()->create(['user_id' => $this->user->id, 'name' => 'Produk Duplikat']);

        $this->actingAs($this->user)
            ->postJson('/api/products', $this->validPayload(['name' => 'Produk Duplikat']))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    }

    public function test_different_users_can_have_same_product_name(): void
    {
        $otherUser = User::factory()->create();
        Product::factory()->create(['user_id' => $otherUser->id, 'name' => 'Nama Sama']);

        $this->actingAs($this->user)
            ->postJson('/api/products', $this->validPayload(['name' => 'Nama Sama']))
            ->assertStatus(201);
    }

    public function test_store_rejects_invalid_price(): void
    {
        $this->actingAs($this->user)
            ->postJson('/api/products', $this->validPayload(['price' => 0]))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['price']);
    }

    public function test_store_rejects_negative_stock(): void
    {
        $this->actingAs($this->user)
            ->postJson('/api/products', $this->validPayload(['current_stock' => -1]))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['current_stock']);
    }

    // ---------------------------------------------------------------------------
    // Image upload
    // ---------------------------------------------------------------------------

    public function test_store_accepts_valid_jpeg_image(): void
    {
        $payload = $this->validPayload();
        $payload['image'] = $this->makeRealJpeg();

        $response = $this->actingAs($this->user)
            ->postJson('/api/products', $payload)
            ->assertStatus(201);

        $imageUrl = $response->json('data.image_url');
        $this->assertNotNull($imageUrl);

        // The converted WebP must exist in the fake disk
        $product = Product::where('user_id', $this->user->id)->first();
        $this->assertNotNull($product->image_path);
        Storage::disk('public')->assertExists($product->image_path);
    }

    public function test_store_rejects_non_image_file_disguised_as_jpg(): void
    {
        $payload = $this->validPayload(['name' => 'Produk Evil']);
        $payload['image'] = $this->makeNonImageFile('evil.jpg');

        $this->actingAs($this->user)
            ->postJson('/api/products', $payload)
            ->assertStatus(422)
            ->assertJsonValidationErrors(['image']);
    }

    // ---------------------------------------------------------------------------
    // Show
    // ---------------------------------------------------------------------------

    public function test_user_can_view_own_product(): void
    {
        $product = Product::factory()->create(['user_id' => $this->user->id]);

        $this->actingAs($this->user)
            ->getJson("/api/products/{$product->id}")
            ->assertStatus(200)
            ->assertJsonPath('data.id', $product->id);
    }

    public function test_user_cannot_view_others_product(): void
    {
        $other = User::factory()->create();
        $product = Product::factory()->create(['user_id' => $other->id]);

        $this->actingAs($this->user)
            ->getJson("/api/products/{$product->id}")
            ->assertStatus(403);
    }

    // ---------------------------------------------------------------------------
    // Update
    // ---------------------------------------------------------------------------

    public function test_user_can_update_own_product(): void
    {
        $product = Product::factory()->create(['user_id' => $this->user->id, 'name' => 'Lama']);

        $this->actingAs($this->user)
            ->putJson("/api/products/{$product->id}", ['name' => 'Baru', 'price' => 9999, 'current_stock' => 5])
            ->assertStatus(200)
            ->assertJsonPath('data.name', 'Baru');
    }

    public function test_update_allows_same_name_on_self(): void
    {
        $product = Product::factory()->create(['user_id' => $this->user->id, 'name' => 'Nama Sama']);

        $this->actingAs($this->user)
            ->putJson("/api/products/{$product->id}", ['name' => 'Nama Sama', 'price' => 5000, 'current_stock' => 1])
            ->assertStatus(200);
    }

    public function test_user_cannot_update_others_product(): void
    {
        $other = User::factory()->create();
        $product = Product::factory()->create(['user_id' => $other->id]);

        $this->actingAs($this->user)
            ->putJson("/api/products/{$product->id}", ['name' => 'Dicuri', 'price' => 1, 'current_stock' => 0])
            ->assertStatus(403);
    }

    public function test_update_replaces_old_image_file(): void
    {
        // Create product with initial image
        $payload = $this->validPayload();
        $payload['image'] = $this->makeRealJpeg('first.jpg');

        $createResp = $this->actingAs($this->user)
            ->postJson('/api/products', $payload)
            ->assertStatus(201);

        $product = Product::find($createResp->json('data.id'));
        $oldPath = $product->image_path;

        // Update with new image
        $this->actingAs($this->user)
            ->putJson("/api/products/{$product->id}", [
                'name' => $product->name,
                'price' => $product->price,
                'current_stock' => $product->current_stock,
                'image' => $this->makeRealJpeg('second.jpg'),
            ])
            ->assertStatus(200);

        $product->refresh();
        $this->assertNotEquals($oldPath, $product->image_path);
        Storage::disk('public')->assertMissing($oldPath);
        Storage::disk('public')->assertExists($product->image_path);
    }

    // ---------------------------------------------------------------------------
    // Destroy
    // ---------------------------------------------------------------------------

    public function test_user_can_delete_own_product(): void
    {
        $product = Product::factory()->create(['user_id' => $this->user->id]);

        $this->actingAs($this->user)
            ->deleteJson("/api/products/{$product->id}")
            ->assertStatus(200)
            ->assertJsonPath('message', 'Produk berhasil dihapus.');

        $this->assertSoftDeleted('products', ['id' => $product->id]);
    }

    public function test_user_cannot_delete_others_product(): void
    {
        $other = User::factory()->create();
        $product = Product::factory()->create(['user_id' => $other->id]);

        $this->actingAs($this->user)
            ->deleteJson("/api/products/{$product->id}")
            ->assertStatus(403);
    }

    public function test_product_with_transactions_is_soft_deleted_and_set_inactive(): void
    {
        $product = Product::factory()->create([
            'user_id' => $this->user->id,
            'status' => 'active',
        ]);
        $transaction = Transaction::factory()->create(['user_id' => $this->user->id]);

        TransactionItem::create([
            'transaction_id' => $transaction->id,
            'product_id' => $product->id,
            'product_name' => $product->name,
            'qty' => 2,
            'unit_price' => $product->price,
            'subtotal' => $product->price * 2,
        ]);

        $this->actingAs($this->user)
            ->deleteJson("/api/products/{$product->id}")
            ->assertStatus(200)
            ->assertJsonPath('message', 'Produk dinonaktifkan dan dihapus karena memiliki riwayat transaksi.');

        $product->refresh();
        $this->assertEquals(ProductStatus::Inactive, $product->status);
        $this->assertSoftDeleted('products', ['id' => $product->id]);
    }
}
