<?php

namespace App\Console\Commands;

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
        $results = $holidays->getHolidays($year);

        $count = count($results);
        $this->info("Holidays {$year}: {$count} record(s) available.");
    }
}
