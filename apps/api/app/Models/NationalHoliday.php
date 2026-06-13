<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NationalHoliday extends Model
{
    protected $fillable = [
        'holiday_date',
        'holiday_name',
        'year',
    ];

    protected function casts(): array
    {
        return [
            'holiday_date' => 'date',
            'year' => 'integer',
        ];
    }
}
