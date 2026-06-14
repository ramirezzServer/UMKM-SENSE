<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CalendarEvent extends Model
{
    protected $fillable = ['event_date', 'name', 'impact', 'district'];

    protected $casts = ['event_date' => 'date'];
}
