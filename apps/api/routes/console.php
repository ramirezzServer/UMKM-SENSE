<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// 06:00 WIB = 23:00 UTC (previous day); runs daily to warm the weather cache before users arrive
Schedule::command('weather:sync')->dailyAt('23:00')->timezone('UTC');
