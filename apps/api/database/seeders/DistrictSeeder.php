<?php

namespace Database\Seeders;

use App\Models\District;
use Illuminate\Database\Seeder;

class DistrictSeeder extends Seeder
{
    public function run(): void
    {
        $districts = [
            // ── Kota Bandung ─────────────────────────────────────────────────
            [
                'name' => 'Coblong',
                'city' => 'Kota Bandung',
                'province' => 'Jawa Barat',
                'latitude' => -6.8876,
                'longitude' => 107.6179,
            ],
            [
                'name' => 'Cibeunying Kidul',
                'city' => 'Kota Bandung',
                'province' => 'Jawa Barat',
                'latitude' => -6.9056,
                'longitude' => 107.6362,
            ],
            [
                'name' => 'Cibeunying Kaler',
                'city' => 'Kota Bandung',
                'province' => 'Jawa Barat',
                'latitude' => -6.8842,
                'longitude' => 107.6294,
            ],
            [
                'name' => 'Buahbatu',
                'city' => 'Kota Bandung',
                'province' => 'Jawa Barat',
                'latitude' => -6.9422,
                'longitude' => 107.6478,
            ],
            [
                'name' => 'Bandung Wetan',
                'city' => 'Kota Bandung',
                'province' => 'Jawa Barat',
                'latitude' => -6.9052,
                'longitude' => 107.6177,
            ],
            [
                'name' => 'Ujung Berung',
                'city' => 'Kota Bandung',
                'province' => 'Jawa Barat',
                'latitude' => -6.9096,
                'longitude' => 107.7045,
            ],
            [
                'name' => 'Bojongloa Kaler',
                'city' => 'Kota Bandung',
                'province' => 'Jawa Barat',
                'latitude' => -6.9274,
                'longitude' => 107.5961,
            ],
            // ── Kabupaten Bandung ─────────────────────────────────────────────
            [
                'name' => 'Dayeuhkolot',
                'city' => 'Kabupaten Bandung',
                'province' => 'Jawa Barat',
                'latitude' => -6.9997,
                'longitude' => 107.6337,
            ],
            [
                'name' => 'Margahayu',
                'city' => 'Kabupaten Bandung',
                'province' => 'Jawa Barat',
                'latitude' => -6.9670,
                'longitude' => 107.5952,
            ],
            [
                'name' => 'Cileunyi',
                'city' => 'Kabupaten Bandung',
                'province' => 'Jawa Barat',
                'latitude' => -6.9218,
                'longitude' => 107.7197,
            ],
            // ── Kota Cimahi ───────────────────────────────────────────────────
            [
                'name' => 'Cimahi Tengah',
                'city' => 'Kota Cimahi',
                'province' => 'Jawa Barat',
                'latitude' => -6.8847,
                'longitude' => 107.5417,
            ],
            // ── Kabupaten Bandung Barat ───────────────────────────────────────
            [
                'name' => 'Ngamprah',
                'city' => 'Kabupaten Bandung Barat',
                'province' => 'Jawa Barat',
                'latitude' => -6.8716,
                'longitude' => 107.5232,
            ],
            [
                'name' => 'Padalarang',
                'city' => 'Kabupaten Bandung Barat',
                'province' => 'Jawa Barat',
                'latitude' => -6.8448,
                'longitude' => 107.5003,
            ],
        ];

        District::insert($districts);
    }
}
