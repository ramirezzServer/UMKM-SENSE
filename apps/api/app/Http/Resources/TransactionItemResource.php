<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TransactionItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'product_name' => $this->product_name,
            'qty' => $this->qty,
            'unit_price' => (float) $this->unit_price,
            'subtotal' => (float) $this->subtotal,
        ];
    }
}
