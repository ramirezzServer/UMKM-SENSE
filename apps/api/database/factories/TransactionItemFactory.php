<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\Transaction;
use Illuminate\Database\Eloquent\Factories\Factory;

class TransactionItemFactory extends Factory
{
    public function definition(): array
    {
        $product = Product::factory()->create();
        $qty = $this->faker->numberBetween(1, 10);
        $unitPrice = $product->price;

        return [
            'transaction_id' => Transaction::factory(),
            'product_id' => $product->id,
            'product_name' => $product->name,
            'qty' => $qty,
            'unit_price' => $unitPrice,
            'subtotal' => round($qty * $unitPrice, 2),
        ];
    }
}
