<?php

namespace App\Console\Commands;

use App\Models\Business;
use App\Models\District;
use App\Services\WeatherService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Throwable;

class WeatherSyncCommand extends Command
{
    protected $signature = 'weather:sync';

    protected $description = 'Sync weather forecast for all active business districts';

    public function handle(WeatherService $weather): int
    {
        // Collect distinct district names from businesses belonging to active (non-deleted) users
        $districtNames = Business::whereHas('user')
            ->distinct()
            ->pluck('district')
            ->filter()
            ->values();

        if ($districtNames->isEmpty()) {
            $this->info('No active business districts found. Nothing to sync.');

            return self::SUCCESS;
        }

        // Build name → coordinates map from districts table
        $coordsMap = District::whereIn('name', $districtNames)
            ->get(['name', 'latitude', 'longitude'])
            ->keyBy('name');

        $synced = 0;
        $skipped = 0;

        foreach ($districtNames as $name) {
            $district = $coordsMap->get($name);

            if (! $district) {
                $this->warn("District coordinates not found for \"{$name}\", skipping.");
                $skipped++;

                continue;
            }

            try {
                $weather->syncDistrict($name, (float) $district->latitude, (float) $district->longitude);
                $synced++;
            } catch (Throwable $e) {
                // Error already logged inside WeatherService; keep sync running for other districts
                $this->warn("Failed to sync \"{$name}\": {$e->getMessage()}");
                $skipped++;
            }
        }

        $this->info("Weather sync complete. Synced: {$synced}, skipped: {$skipped}.");
        Log::info('weather:sync complete', ['synced' => $synced, 'skipped' => $skipped]);

        return self::SUCCESS;
    }
}
