<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Weather forecast — runs every 6 hours to match the WeatherService cache TTL (6h).
// runInBackground() keeps the scheduler process free; withoutOverlapping() prevents stacking
// if a run takes longer than expected (e.g. slow API response during syncDistrict).
Schedule::command('weather:sync')
    ->everySixHours()
    ->withoutOverlapping()
    ->runInBackground();

// Holiday data is stable — daily re-sync is enough to catch any corrections.
// The command degrades gracefully when the external API is down (falls back to DB/seeder).
Schedule::command('holidays:sync')
    ->daily()
    ->withoutOverlapping();
