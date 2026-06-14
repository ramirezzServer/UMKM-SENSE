<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PredictionWarning extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'prediction_log_id',
        'level',
        'message',
    ];

    public function predictionLog(): BelongsTo
    {
        return $this->belongsTo(PredictionLog::class);
    }
}
