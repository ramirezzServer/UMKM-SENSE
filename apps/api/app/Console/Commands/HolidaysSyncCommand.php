<?php

namespace App\Console\Commands;

use App\Models\NationalHoliday;
use App\Services\HolidayService;
use Illuminate\Console\Command;

class HolidaysSyncCommand extends Command
{
    protected $signature = 'holidays:sync {year? : Year to sync (defaults to current + next year)}';

    protected $description = 'Sync national holidays for the given year (default: current and next year)';

    public function handle(HolidayService $holidays): int
    {
        $yearArg = $this->argument('year');
        $currentYear = (int) now()->format('Y');

        if ($yearArg !== null) {
            $year = (int) $yearArg;

            if ($year < 2000 || $year > 2100) {
                $this->error("Invalid year: {$year}");

                return self::FAILURE;
            }

            $this->syncYear($holidays, $year);
        } else {
            $this->syncYear($holidays, $currentYear);
            $this->syncYear($holidays, $currentYear + 1);
        }

        return self::SUCCESS;
    }

    private function syncYear(HolidayService $holidays, int $year): void
    {
        // Clear cache so we actually attempt a fresh API fetch (not serve stale cache)
        $holidays->clearCache($year);

        $results = $holidays->getHolidays($year);

        $dbCount = NationalHoliday::where('year', $year)->count();
        $fromApi = count($results) > 0 && $dbCount > 0;

        if ($dbCount > 0) {
            $this->info("  ✓ {$year}: {$dbCount} holiday(s) available in DB.");
        } else {
            $this->warn("  ✗ {$year}: API unavailable and DB is empty.");
            $this->line('    Run: php artisan db:seed --class=NationalHolidaySeeder');
        }

        if ($fromApi && count($results) === $dbCount) {
            $this->line('    (data source: '.($results === [] ? 'none' : 'DB/seeder or API').')');
        }
    }
}
