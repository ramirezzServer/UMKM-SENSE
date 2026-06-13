<?php

namespace App\Services;

use App\Models\NationalHoliday;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class HolidayService
{
    private const API_BASE = 'https://api-harilibur.vercel.app/api';

    private const HTTP_TIMEOUT = 5;

    private const CACHE_TTL_DAYS = 30;

    /**
     * Returns all national holidays for the given year.
     * Cache-first → DB-first → API → graceful empty on failure.
     */
    public function getHolidays(int $year): array
    {
        $cacheKey = "holidays:year:{$year}";

        if (Cache::has($cacheKey)) {
            return Cache::get($cacheKey);
        }

        // DB already has data for this year — skip API call
        if (NationalHoliday::where('year', $year)->exists()) {
            $holidays = $this->loadFromDb($year);
            Cache::put($cacheKey, $holidays, now()->addDays(self::CACHE_TTL_DAYS));

            return $holidays;
        }

        $fetched = $this->fetchFromApi($year);

        if ($fetched !== null) {
            $this->persistToDb($year, $fetched);
            $holidays = $this->loadFromDb($year);
            Cache::put($cacheKey, $holidays, now()->addDays(self::CACHE_TTL_DAYS));

            return $holidays;
        }

        // API failed — return whatever is in DB (may be empty)
        return $this->loadFromDb($year);
    }

    /**
     * Returns holidays that fall between $start and $end (inclusive, format Y-m-d).
     */
    public function getHolidaysInRange(string $start, string $end): array
    {
        $startYear = (int) Carbon::parse($start)->format('Y');
        $endYear = (int) Carbon::parse($end)->format('Y');

        $all = [];
        for ($year = $startYear; $year <= $endYear; $year++) {
            $all = array_merge($all, $this->getHolidays($year));
        }

        return array_values(array_filter($all, fn ($h) => $h['date'] >= $start && $h['date'] <= $end));
    }

    /**
     * Returns true if $date (Y-m-d) is a national holiday.
     */
    public function isHoliday(string $date): bool
    {
        $year = (int) Carbon::parse($date)->format('Y');

        foreach ($this->getHolidays($year) as $h) {
            if ($h['date'] === $date) {
                return true;
            }
        }

        return false;
    }

    // -------------------------------------------------------------------------
    // Internal helpers
    // -------------------------------------------------------------------------

    private function loadFromDb(int $year): array
    {
        return NationalHoliday::where('year', $year)
            ->orderBy('holiday_date')
            ->get()
            ->map(fn ($row) => $this->toArray($row))
            ->all();
    }

    /**
     * Calls the API and returns sanitized rows, or null on any failure.
     */
    private function fetchFromApi(int $year): ?array
    {
        try {
            $response = Http::timeout(self::HTTP_TIMEOUT)->get(self::API_BASE, ['year' => $year]);

            if (! $response->successful()) {
                Log::warning('HolidayService: API returned non-2xx', [
                    'year' => $year,
                    'status' => $response->status(),
                ]);

                return null;
            }

            $body = $response->json();

            if (! is_array($body)) {
                Log::warning('HolidayService: unexpected payload (not an array)', ['year' => $year]);

                return null;
            }

            return $this->sanitize($body, $year);

        } catch (Throwable $e) {
            Log::error('HolidayService: API fetch failed', ['year' => $year, 'error' => $e->getMessage()]);

            return null;
        }
    }

    /**
     * Validates and sanitizes raw API rows; returns only national holidays with clean fields.
     */
    private function sanitize(array $rows, int $year): array
    {
        $clean = [];

        foreach ($rows as $item) {
            if (! is_array($item)) {
                continue;
            }

            // Only keep official national holidays
            if (empty($item['is_national_holiday'])) {
                continue;
            }

            $dateStr = $item['holiday_date'] ?? null;
            $name = $item['holiday_name'] ?? null;

            // Validate date format
            if (! is_string($dateStr) || ! preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateStr)) {
                continue;
            }

            try {
                $date = Carbon::createFromFormat('Y-m-d', $dateStr);
                if (! $date || $date->format('Y-m-d') !== $dateStr) {
                    continue;
                }
            } catch (Throwable) {
                continue;
            }

            // Reject dates belonging to a different year (API safety)
            if ((int) $date->format('Y') !== $year) {
                continue;
            }

            if (! is_string($name) || trim($name) === '') {
                continue;
            }

            $clean[] = [
                'holiday_date' => $dateStr,
                'holiday_name' => mb_substr(trim($name), 0, 200),
                'year' => $year,
            ];
        }

        return $clean;
    }

    private function persistToDb(int $year, array $rows): void
    {
        foreach ($rows as $row) {
            NationalHoliday::updateOrCreate(
                ['holiday_date' => $row['holiday_date']],
                ['holiday_name' => $row['holiday_name'], 'year' => $row['year']]
            );
        }
    }

    private function toArray(NationalHoliday $row): array
    {
        $date = $row->holiday_date instanceof Carbon
            ? $row->holiday_date->format('Y-m-d')
            : (string) $row->holiday_date;

        return [
            'date' => $date,
            'name' => $row->holiday_name,
            'year' => $row->year,
        ];
    }
}
