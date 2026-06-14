<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PredictionRecommendation extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'prediction_log_id',
        'priority',
        'title',
        'description',
        'sort_order',
    ];

    public function predictionLog(): BelongsTo
    {
        return $this->belongsTo(PredictionLog::class);
    }
}
