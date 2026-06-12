<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TransactionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'customer_name' => $this->customer_name,
            'transaction_date' => $this->transaction_date?->format('Y-m-d'),
            'payment_method' => $this->payment_method->value,
            'total_amount' => (float) $this->total_amount,
            'status' => $this->status->value,
            'items' => TransactionItemResource::collection($this->whenLoaded('items')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
