<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * Idempotent demo seeder.  Safe to run multiple times.
 *
 * php artisan db:seed --class=DemoSeeder
 */
class DemoSeeder extends Seeder
{
    private const EMAIL = 'demo@umkm.test';

    private const PASSWORD = 'password';

    // Products for Warung Kopi Nusantara (Kuliner)
    private const CATALOGUE = [
        ['name' => 'Kopi Hitam',           'category' => 'Minuman', 'price' => 8_000,  'stock' => 500],
        ['name' => 'Kopi Susu',             'category' => 'Minuman', 'price' => 15_000, 'stock' => 400],
        ['name' => 'Es Teh Manis',          'category' => 'Minuman', 'price' => 5_000,  'stock' => 600],
        ['name' => 'Jus Alpukat',           'category' => 'Minuman', 'price' => 18_000, 'stock' => 200],
        ['name' => 'Nasi Goreng Spesial',   'category' => 'Makanan', 'price' => 25_000, 'stock' => 150],
        ['name' => 'Mie Goreng',            'category' => 'Makanan', 'price' => 22_000, 'stock' => 150],
        ['name' => 'Ayam Bakar',            'category' => 'Makanan', 'price' => 35_000, 'stock' => 100],
        ['name' => 'Bakso Sapi',            'category' => 'Makanan', 'price' => 20_000, 'stock' => 200],
        ['name' => 'Pisang Goreng (5pcs)',  'category' => 'Snack',   'price' => 12_000, 'stock' => 300],
        ['name' => 'Nasi Uduk',             'category' => 'Makanan', 'price' => 18_000, 'stock' => 200],
    ];

    public function run(): void
    {
        $now = now();

        // ── 1. User ───────────────────────────────────────────────────────────

        $userId = DB::table('users')->where('email', self::EMAIL)->value('id');

        if (! $userId) {
            $userId = DB::table('users')->insertGetId([
                'name' => 'Warung Demo',
                'email' => self::EMAIL,
                'password' => Hash::make(self::PASSWORD),
                'email_verified_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
            $this->command->info("User created: id={$userId}");
        } else {
            $this->command->info("User already exists: id={$userId}");
        }

        // ── 2. Business ───────────────────────────────────────────────────────

        if (! DB::table('businesses')->where('user_id', $userId)->exists()) {
            DB::table('businesses')->insert([
                'user_id' => $userId,
                'name' => 'Warung Kopi Nusantara',
                'category' => 'Kuliner',
                'district' => 'Coblong',        // matches DistrictSeeder → coords exist
                'district_lat' => -6.8876,
                'district_lng' => 107.6179,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        // ── 3. Products ───────────────────────────────────────────────────────

        $products = [];   // [['id'=>, 'name'=>, 'price'=>], ...]

        foreach (self::CATALOGUE as $item) {
            $existing = DB::table('products')
                ->where('user_id', $userId)
                ->where('name', $item['name'])
                ->first(['id', 'name', 'price']);

            if ($existing) {
                $products[] = ['id' => $existing->id, 'name' => $existing->name, 'price' => (float) $existing->price];
            } else {
                $id = DB::table('products')->insertGetId([
                    'user_id' => $userId,
                    'name' => $item['name'],
                    'category' => $item['category'],
                    'price' => $item['price'],
                    'current_stock' => $item['stock'],
                    'status' => 'active',
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
                $products[] = ['id' => $id, 'name' => $item['name'], 'price' => (float) $item['price']];
            }
        }

        // ── 4. Transactions — 30 days of realistic data ───────────────────────

        if (DB::table('transactions')->where('user_id', $userId)->exists()) {
            $this->command->info('Transactions already exist — skipping.');
            $this->printCredentials();

            return;
        }

        $payments = ['Cash', 'Cash', 'Cash', 'QRIS', 'QRIS', 'Transfer'];
        $customers = ['Budi S.', 'Siti R.', 'Andi P.', 'Dewi L.', 'Reza K.', 'Ayu M.', 'Hendra T.', null, null, null];

        $totalTx = 0;

        for ($daysAgo = 29; $daysAgo >= 0; $daysAgo--) {
            $date = Carbon::today()->subDays($daysAgo);
            $isWeekend = $date->isWeekend();

            // Weekend traffic peaks; last week is denser for good trend data
            $txCount = match (true) {
                $isWeekend && $daysAgo <= 7 => rand(14, 22),
                $isWeekend => rand(10, 18),
                $daysAgo === 0 => rand(6, 12),   // today — partial day
                $daysAgo <= 7 => rand(6, 11),   // recent weekdays
                default => rand(4, 8),
            };

            for ($t = 0; $t < $txCount; $t++) {
                // 1–4 distinct products per transaction
                $itemCount = rand(1, min(4, count($products)));
                $picked = self::randomSlice($products, $itemCount);

                $total = 0;
                $rows = [];

                foreach ($picked as $p) {
                    $qty = rand(1, 3);
                    $subtotal = $p['price'] * $qty;
                    $total += $subtotal;
                    $rows[] = [
                        'product_id' => $p['id'],
                        'product_name' => $p['name'],
                        'qty' => $qty,
                        'unit_price' => $p['price'],
                        'subtotal' => $subtotal,
                    ];
                }

                $txId = DB::table('transactions')->insertGetId([
                    'user_id' => $userId,
                    'customer_name' => $customers[array_rand($customers)],
                    'transaction_date' => $date->format('Y-m-d'),
                    'payment_method' => $payments[array_rand($payments)],
                    'total_amount' => $total,
                    'status' => 'success',
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);

                DB::table('transaction_items')->insert(
                    array_map(fn ($row) => array_merge($row, [
                        'transaction_id' => $txId,
                        'created_at' => $now,
                    ]), $rows)
                );

                $totalTx++;
            }
        }

        $this->command->info("Done: {$totalTx} transactions seeded over 30 days.");
        $this->printCredentials();
    }

    /** Pick $n distinct random elements from $arr without using array_rand on value arrays. */
    private static function randomSlice(array $arr, int $n): array
    {
        shuffle($arr);

        return array_slice($arr, 0, $n);
    }

    private function printCredentials(): void
    {
        $this->command->newLine();
        $this->command->info('─────────────────────────────────');
        $this->command->info('  Login demo: '.self::EMAIL);
        $this->command->info('  Password  : '.self::PASSWORD);
        $this->command->info('─────────────────────────────────');
    }
}
