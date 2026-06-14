<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PredictionLog extends Model
{
    protected $fillable = [
        'user_id',
        'product_id',
        'status',
        'prediction_start',
        'prediction_end',
        'forecast_method',
        'mae',
        'mape',
        'ai_summary',
        'error_message',
    ];

    protected $casts = [
        'prediction_start' => 'date',
        'prediction_end' => 'date',
        'mae' => 'float',
        'mape' => 'float',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(PredictionItem::class)->orderBy('date');
    }

    public function recommendations(): HasMany
    {
        return $this->hasMany(PredictionRecommendation::class)->orderBy('sort_order');
    }

    public function warnings(): HasMany
    {
        return $this->hasMany(PredictionWarning::class);
    }
}
