<?php

namespace App\Services;

use App\Models\WeatherData;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class WeatherService
{
    private const API_BASE = 'https://api.open-meteo.com/v1/forecast';

    private const HTTP_TIMEOUT = 5;

    private const CACHE_TTL_HOURS = 6;

    // WMO weather interpretation codes → simple condition labels
    private const CODE_MAP = [
        0 => 'clear',
        1 => 'cloudy', 2 => 'cloudy', 3 => 'cloudy',
        45 => 'cloudy', 48 => 'cloudy',
        51 => 'rainy', 53 => 'rainy', 55 => 'rainy',
        56 => 'rainy', 57 => 'rainy',
        61 => 'rainy', 63 => 'rainy', 65 => 'rainy',
        66 => 'rainy', 67 => 'rainy',
        71 => 'rainy', 73 => 'rainy', 75 => 'rainy', 77 => 'rainy',
        80 => 'rainy', 81 => 'rainy', 82 => 'rainy',
        85 => 'rainy', 86 => 'rainy',
        95 => 'stormy', 96 => 'stormy', 99 => 'stormy',
    ];

    /**
     * Get weather for a specific district and date.
     * Reads from cache first, then DB. Never calls the external API — that is
     * the responsibility of syncDistrict() (weather:sync command / scheduler).
     */
    public function getWeather(string $district, string $date): ?array
    {
        $cacheKey = "weather:{$district}:{$date}";

        if (Cache::has($cacheKey)) {
            return Cache::get($cacheKey);
        }

        $row = WeatherData::where('district', $district)
            ->where('date', $date)
            ->first();

        if (! $row) {
            return $this->fallbackFromDb($district);
        }

        $data = $this->toArray($row);
        Cache::put($cacheKey, $data, now()->addHours(self::CACHE_TTL_HOURS));

        return $data;
    }

    /**
     * Get multi-day forecast for a district.
     * Reads from cache first, then DB for the requested date range.
     * Never calls the external API on the request path.
     */
    public function getForecast(string $district, int $days = 7): array
    {
        $today = Carbon::today()->format('Y-m-d');
        $cacheKey = "weather:{$district}:{$today}:forecast:{$days}";

        if (Cache::has($cacheKey)) {
            return Cache::get($cacheKey);
        }

        $dates = collect(range(0, $days - 1))
            ->map(fn ($i) => Carbon::today()->addDays($i)->format('Y-m-d'))
            ->all();

        $rows = WeatherData::where('district', $district)
            ->whereIn('date', $dates)
            ->orderBy('date')
            ->get()
            ->map(fn ($row) => $this->toArray($row))
            ->values()
            ->all();

        if (! empty($rows)) {
            Cache::put($cacheKey, $rows, now()->addHours(self::CACHE_TTL_HOURS));
        }

        return $rows;
    }

    /**
     * Pull forecast from Open-Meteo for $days ahead, persist every day row,
     * and prime individual day caches. Used by weather:sync command.
     */
    public function syncDistrict(string $district, float $lat, float $lng, int $days = 7): void
    {
        $rows = $this->fetchMultiDay($district, $lat, $lng, $days);

        foreach ($rows as $row) {
            Cache::put("weather:{$district}:{$row['date']}", $row, now()->addHours(self::CACHE_TTL_HOURS));
        }
    }

    // -------------------------------------------------------------------------
    // Internal helpers
    // -------------------------------------------------------------------------

    /**
     * Fetch multiple forecast days, persist each to DB, return array of weather arrays.
     */
    private function fetchMultiDay(string $district, float $lat, float $lng, int $days): array
    {
        try {
            $response = Http::timeout(self::HTTP_TIMEOUT)->get(self::API_BASE, [
                'latitude' => $lat,
                'longitude' => $lng,
                'daily' => 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum',
                'timezone' => 'Asia/Jakarta',
                'forecast_days' => min($days, 16),
            ]);

            if (! $response->successful()) {
                Log::warning('WeatherService: Open-Meteo returned non-2xx', [
                    'status' => $response->status(),
                    'district' => $district,
                ]);

                return [];
            }

            $body = $response->json();

            if (! $this->isValidForecastPayload($body)) {
                Log::warning('WeatherService: unexpected payload structure', ['district' => $district]);

                return [];
            }

            $daily = $body['daily'];
            $result = [];

            foreach ($daily['time'] as $i => $date) {
                $code = isset($daily['weather_code'][$i]) ? (int) $daily['weather_code'][$i] : null;
                $tempMin = isset($daily['temperature_2m_min'][$i]) ? (float) $daily['temperature_2m_min'][$i] : null;
                $tempMax = isset($daily['temperature_2m_max'][$i]) ? (float) $daily['temperature_2m_max'][$i] : null;
                $precip = isset($daily['precipitation_sum'][$i]) ? (float) $daily['precipitation_sum'][$i] : null;

                // Sanity-check individual values
                if (! $this->areValuesPlausible($tempMin, $tempMax, $precip)) {
                    Log::warning('WeatherService: implausible values skipped', [
                        'district' => $district,
                        'date' => $date,
                    ]);

                    continue;
                }

                $condition = self::CODE_MAP[$code] ?? 'cloudy';

                $row = WeatherData::updateOrCreate(
                    ['district' => $district, 'date' => $date],
                    [
                        'condition' => $condition,
                        'temp_min' => $tempMin,
                        'temp_max' => $tempMax,
                        'precipitation' => $precip,
                        'weather_code' => $code,
                    ]
                );

                $result[] = $this->toArray($row);
            }

            return $result;

        } catch (Throwable $e) {
            Log::error('WeatherService: fetch failed', ['district' => $district, 'error' => $e->getMessage()]);

            return [];
        }
    }

    private function fallbackFromDb(string $district): ?array
    {
        $row = WeatherData::where('district', $district)
            ->orderByDesc('date')
            ->first();

        return $row ? $this->toArray($row) : null;
    }

    private function isValidForecastPayload(mixed $body): bool
    {
        if (! is_array($body) || ! isset($body['daily'])) {
            return false;
        }

        $daily = $body['daily'];

        foreach (['time', 'weather_code', 'temperature_2m_max', 'temperature_2m_min', 'precipitation_sum'] as $key) {
            if (! isset($daily[$key]) || ! is_array($daily[$key])) {
                return false;
            }
        }

        return true;
    }

    private function areValuesPlausible(?float $tempMin, ?float $tempMax, ?float $precip): bool
    {
        if ($tempMin !== null && ($tempMin < -90 || $tempMin > 60)) {
            return false;
        }
        if ($tempMax !== null && ($tempMax < -90 || $tempMax > 60)) {
            return false;
        }
        if ($precip !== null && ($precip < 0 || $precip > 2000)) {
            return false;
        }

        return true;
    }

    private function toArray(WeatherData $row): array
    {
        return [
            'district' => $row->district,
            'date' => $row->date instanceof Carbon ? $row->date->format('Y-m-d') : (string) $row->date,
            'condition' => $row->condition,
            'temp_min' => $row->temp_min,
            'temp_max' => $row->temp_max,
            'precipitation' => $row->precipitation,
            'weather_code' => $row->weather_code,
        ];
    }
}
