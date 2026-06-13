<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WeatherData extends Model
{
    protected $fillable = [
        'district',
        'date',
        'condition',
        'temp_min',
        'temp_max',
        'precipitation',
        'weather_code',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'temp_min' => 'float',
            'temp_max' => 'float',
            'precipitation' => 'float',
            'weather_code' => 'integer',
        ];
    }
}
