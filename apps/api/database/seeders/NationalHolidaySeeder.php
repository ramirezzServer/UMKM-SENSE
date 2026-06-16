<?php

namespace Database\Seeders;

use App\Models\NationalHoliday;
use Illuminate\Database\Seeder;

/**
 * Seeds official Indonesian national holidays for 2026–2027.
 *
 * Fixed dates (Gregorian): exact.
 * Lunar/lunisolar dates (Islamic, Hindu, Buddhist): best-estimate based on
 * standard astronomical hisab calculations. Actual government declaration
 * (SKB 3 Menteri) may differ by ±1–2 days for moon-sighting holidays.
 *
 * Safe to re-run: uses updateOrCreate on holiday_date.
 */
class NationalHolidaySeeder extends Seeder
{
    public function run(): void
    {
        $holidays = [
            // ──────────────────────────────────────────────────────────────
            // 2026
            // ──────────────────────────────────────────────────────────────

            // Fixed
            ['date' => '2026-01-01', 'name' => 'Tahun Baru Masehi'],

            // 27 Rajab 1447 H — estimate; moon-sighting may shift ±1 day
            ['date' => '2026-01-15', 'name' => 'Isra Miraj Nabi Muhammad SAW'],

            // Chinese New Year 2577 (Year of the Horse) — fixed astronomical
            ['date' => '2026-02-17', 'name' => 'Tahun Baru Imlek 2577 (Tahun Kuda)'],

            // Saka New Year 1948 — lunisolar estimate; official decree may vary
            ['date' => '2026-03-18', 'name' => 'Hari Raya Nyepi (Tahun Baru Saka 1948)'],

            // 1 Syawal 1447 H — estimate; moon-sighting may shift ±1 day
            ['date' => '2026-03-19', 'name' => 'Hari Raya Idul Fitri 1447 H'],
            ['date' => '2026-03-20', 'name' => 'Hari Raya Idul Fitri 1447 H (Hari Kedua)'],

            // Good Friday — Easter 5 April 2026 (Gregorian computus, exact)
            ['date' => '2026-04-03', 'name' => 'Wafat Isa Almasih'],

            // Fixed
            ['date' => '2026-05-01', 'name' => 'Hari Buruh Internasional'],

            // Ascension — 39 days after Easter 5 April 2026 (exact)
            ['date' => '2026-05-14', 'name' => 'Kenaikan Isa Almasih'],

            // 10 Dzulhijjah 1447 H — estimate
            ['date' => '2026-05-26', 'name' => 'Hari Raya Idul Adha 1447 H'],

            // Waisak full-moon 2570 BE — lunisolar estimate
            ['date' => '2026-05-31', 'name' => 'Hari Raya Waisak 2570 BE'],

            // Fixed
            ['date' => '2026-06-01', 'name' => 'Hari Lahir Pancasila'],

            // 1 Muharram 1448 H — estimate
            ['date' => '2026-06-15', 'name' => 'Tahun Baru Islam 1 Muharram 1448 H'],

            // Fixed
            ['date' => '2026-08-17', 'name' => 'Hari Kemerdekaan Republik Indonesia'],

            // 12 Rabiul Awwal 1448 H — estimate
            ['date' => '2026-08-24', 'name' => 'Maulid Nabi Muhammad SAW'],

            // Fixed
            ['date' => '2026-12-25', 'name' => 'Hari Raya Natal'],

            // ──────────────────────────────────────────────────────────────
            // 2027
            // ──────────────────────────────────────────────────────────────

            // Fixed
            ['date' => '2027-01-01', 'name' => 'Tahun Baru Masehi'],

            // 27 Rajab 1448 H — estimate
            ['date' => '2027-01-04', 'name' => 'Isra Miraj Nabi Muhammad SAW'],

            // Chinese New Year 2578 (Year of the Goat/Ram) — fixed astronomical
            ['date' => '2027-02-06', 'name' => 'Tahun Baru Imlek 2578 (Tahun Kambing)'],

            // 1 Syawal 1448 H — estimate
            ['date' => '2027-03-08', 'name' => 'Hari Raya Idul Fitri 1448 H'],
            ['date' => '2027-03-09', 'name' => 'Hari Raya Idul Fitri 1448 H (Hari Kedua)'],

            // Good Friday — Easter 28 Maret 2027 (exact)
            ['date' => '2027-03-26', 'name' => 'Wafat Isa Almasih'],

            // Saka New Year 1949 — lunisolar estimate (Saka leap month in 2026–27)
            ['date' => '2027-04-06', 'name' => 'Hari Raya Nyepi (Tahun Baru Saka 1949)'],

            // Fixed
            ['date' => '2027-05-01', 'name' => 'Hari Buruh Internasional'],

            // Ascension — 39 days after Easter 28 Maret 2027 (exact)
            ['date' => '2027-05-06', 'name' => 'Kenaikan Isa Almasih'],

            // 10 Dzulhijjah 1448 H — estimate
            ['date' => '2027-05-15', 'name' => 'Hari Raya Idul Adha 1448 H'],

            // Waisak full-moon 2571 BE — lunisolar estimate
            ['date' => '2027-05-20', 'name' => 'Hari Raya Waisak 2571 BE'],

            // Fixed
            ['date' => '2027-06-01', 'name' => 'Hari Lahir Pancasila'],

            // 1 Muharram 1449 H — estimate
            ['date' => '2027-06-05', 'name' => 'Tahun Baru Islam 1 Muharram 1449 H'],

            // 12 Rabiul Awwal 1449 H — estimate
            ['date' => '2027-08-14', 'name' => 'Maulid Nabi Muhammad SAW'],

            // Fixed
            ['date' => '2027-08-17', 'name' => 'Hari Kemerdekaan Republik Indonesia'],

            // Fixed
            ['date' => '2027-12-25', 'name' => 'Hari Raya Natal'],
        ];

        foreach ($holidays as $h) {
            $year = (int) substr($h['date'], 0, 4);

            NationalHoliday::updateOrCreate(
                ['holiday_date' => $h['date']],
                ['holiday_name' => $h['name'], 'year' => $year],
            );
        }

        $count = count($holidays);
        $this->command->info("NationalHolidaySeeder: {$count} holiday(s) upserted for 2026–2027.");
    }
}
