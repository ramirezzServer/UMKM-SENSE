<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PredictionLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $growthPct = null;

        if ($this->relationLoaded('items') && $this->items->isNotEmpty()) {
            $first = $this->items->first();
            $last = $this->items->last();
            $firstRev = (float) $first->predicted_revenue;

            if ($firstRev > 0) {
                $growthPct = round(
                    ((float) $last->predicted_revenue - $firstRev) / $firstRev * 100,
                    1
                );
            }
        }

        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'product_name' => $this->whenLoaded('product', fn () => $this->product->name),
            'status' => $this->status,
            'prediction_start' => $this->prediction_start->format('Y-m-d'),
            'prediction_end' => $this->prediction_end->format('Y-m-d'),
            'forecast_method' => $this->forecast_method,
            'mape' => $this->mape !== null ? round((float) $this->mape, 1) : null,
            'growth_pct' => $growthPct,
            'created_at' => $this->created_at->toISOString(),
        ];
    }
}
