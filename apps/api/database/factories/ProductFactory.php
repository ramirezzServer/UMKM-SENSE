<?php

namespace Database\Factories;

use App\Enums\ProductStatus;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProductFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'name' => $this->faker->unique()->words(3, true),
            'category' => $this->faker->randomElement(['Makanan', 'Minuman', 'Elektronik', 'Pakaian', null]),
            'price' => $this->faker->randomFloat(2, 1000, 500000),
            'current_stock' => $this->faker->numberBetween(0, 200),
            'image_path' => null,
            'status' => ProductStatus::Active->value,
        ];
    }

    public function inactive(): static
    {
        return $this->state(['status' => ProductStatus::Inactive->value]);
    }
}
