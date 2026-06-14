<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PredictionItem extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'prediction_log_id',
        'date',
        'predicted_qty',
        'predicted_revenue',
        'confidence',
        'level',
    ];

    protected $casts = [
        'date' => 'date',
        'predicted_revenue' => 'decimal:2',
        'confidence' => 'float',
    ];

    public function predictionLog(): BelongsTo
    {
        return $this->belongsTo(PredictionLog::class);
    }
}
