<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class BusinessFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'name' => $this->faker->company(),
            'category' => $this->faker->randomElement(['Kuliner', 'Ritel', 'Jasa', 'Lainnya']),
            'district' => 'Coblong',
        ];
    }
}
