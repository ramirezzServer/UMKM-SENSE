<?php

namespace App\Models;

use App\Enums\BusinessCategory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Business extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'category',
        'district',
        'district_lat',
        'district_lng',
    ];

    protected function casts(): array
    {
        return [
            'category' => BusinessCategory::class,
            'district_lat' => 'float',
            'district_lng' => 'float',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
