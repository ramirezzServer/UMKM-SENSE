<?php

namespace Database\Factories;

use App\Enums\PaymentMethod;
use App\Enums\TransactionStatus;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class TransactionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'customer_name' => $this->faker->optional(0.7)->name(),
            'transaction_date' => $this->faker->dateTimeBetween('-6 months', 'now')->format('Y-m-d'),
            'payment_method' => $this->faker->randomElement(PaymentMethod::cases())->value,
            'total_amount' => $this->faker->randomFloat(2, 5000, 2000000),
            'status' => TransactionStatus::Success->value,
        ];
    }

    public function pending(): static
    {
        return $this->state(['status' => TransactionStatus::Pending->value]);
    }

    public function failed(): static
    {
        return $this->state(['status' => TransactionStatus::Failed->value]);
    }
}
