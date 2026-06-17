<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\District;
use App\Models\User;
use App\Models\WeatherData;
use App\Services\WeatherService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class WeatherTest extends TestCase
{
    use RefreshDatabase;

    private function makeDistrict(): District
    {
        return District::create([
            'name' => 'Coblong',
            'city' => 'Bandung',
            'province' => 'Jawa Barat',
            'latitude' => -6.8942,
            'longitude' => 107.6108,
        ]);
    }

    // Fake Open-Meteo daily response for today + N days (WMO 61 = rainy)
    private function openMeteoPayload(int $days = 7): array
    {
        $times = [];
        $codes = [];
        $tmins = [];
        $tmaxs = [];
        $precips = [];

        for ($i = 0; $i < $days; $i++) {
            $times[] = now()->addDays($i)->format('Y-m-d');
            $codes[] = 61;
            $tmins[] = 22.5;
            $tmaxs[] = 30.1;
            $precips[] = 3.2;
        }

        return [
            'daily' => [
                'time' => $times,
                'weather_code' => $codes,
                'temperature_2m_min' => $tmins,
                'temperature_2m_max' => $tmaxs,
                'precipitation_sum' => $precips,
            ],
        ];
    }

    // -------------------------------------------------------------------------
    // Cache hit: second call must NOT re-hit the API
    // -------------------------------------------------------------------------

    public function test_second_call_returns_from_cache_without_hitting_api(): void
    {
        $today = now()->format('Y-m-d');
        $this->makeDistrict();

        // syncDistrict is the only code path that calls the external API; it also primes the
        // per-day cache entries used by getWeather(). One API call expected here.
        Http::fake([
            'api.open-meteo.com/*' => Http::response($this->openMeteoPayload(), 200),
        ]);

        $service = app(WeatherService::class);
        $service->syncDistrict('Coblong', -6.8942, 107.6108);
        Http::assertSentCount(1);

        // Replace the fake with a 500 — any further API call would surface as an error,
        // proving that both getWeather() calls are served entirely from cache.
        Http::fake(['api.open-meteo.com/*' => Http::response(null, 500)]);

        $first = $service->getWeather('Coblong', $today);
        $second = $service->getWeather('Coblong', $today);

        Http::assertNothingSent();
        $this->assertNotNull($first);
        $this->assertEquals('rainy', $first['condition']);
        $this->assertEquals($first, $second);
    }

    // -------------------------------------------------------------------------
    // DB persistence: syncDistrict writes rows to weather_data
    // -------------------------------------------------------------------------

    public function test_api_response_is_persisted_to_weather_data_table(): void
    {
        $today = now()->format('Y-m-d');
        $this->makeDistrict();

        Http::fake([
            'api.open-meteo.com/*' => Http::response($this->openMeteoPayload(), 200),
        ]);

        // getWeather() is now cache/DB-read-only; syncDistrict() is the writer.
        app(WeatherService::class)->syncDistrict('Coblong', -6.8942, 107.6108);

        $this->assertTrue(
            WeatherData::where('district', 'Coblong')
                ->whereDate('date', $today)
                ->where('condition', 'rainy')
                ->exists()
        );
    }

    // -------------------------------------------------------------------------
    // Fallback: graceful null when district unknown (no coordinates)
    // -------------------------------------------------------------------------

    public function test_returns_null_gracefully_when_district_coordinates_unknown(): void
    {
        Http::fake([]);

        $result = app(WeatherService::class)->getWeather('Unknown District', now()->format('Y-m-d'));

        $this->assertNull($result);
        Http::assertNothingSent();
    }

    // -------------------------------------------------------------------------
    // Fallback: returns last DB row on API HTTP failure
    // -------------------------------------------------------------------------

    public function test_falls_back_to_db_on_api_failure(): void
    {
        $today = now()->format('Y-m-d');
        $yesterday = now()->subDay()->format('Y-m-d');
        $this->makeDistrict();

        WeatherData::create([
            'district' => 'Coblong',
            'date' => $yesterday,
            'condition' => 'clear',
            'temp_min' => 20.0,
            'temp_max' => 28.0,
            'precipitation' => 0.0,
            'weather_code' => 0,
        ]);

        Http::fake([
            'api.open-meteo.com/*' => Http::response(null, 500),
        ]);

        $result = app(WeatherService::class)->getWeather('Coblong', $today);

        $this->assertNotNull($result);
        $this->assertEquals('clear', $result['condition']);
    }

    // -------------------------------------------------------------------------
    // Fallback: returns null (not an error) when API fails AND no DB record exists
    // -------------------------------------------------------------------------

    public function test_returns_null_when_api_fails_and_no_db_record(): void
    {
        $this->makeDistrict();

        Http::fake([
            'api.open-meteo.com/*' => Http::response(null, 503),
        ]);

        $result = app(WeatherService::class)->getWeather('Coblong', now()->format('Y-m-d'));

        $this->assertNull($result);
    }

    // -------------------------------------------------------------------------
    // weather:sync command populates DB rows and primes cache
    // -------------------------------------------------------------------------

    public function test_sync_command_populates_weather_data_and_cache(): void
    {
        $today = now()->format('Y-m-d');
        $this->makeDistrict();

        $user = User::factory()->create();
        Business::factory()->create(['user_id' => $user->id, 'district' => 'Coblong']);

        Http::fake([
            'api.open-meteo.com/*' => Http::response($this->openMeteoPayload(7), 200),
        ]);

        $this->artisan('weather:sync')->assertSuccessful();

        // DB must have today's row
        $this->assertTrue(
            WeatherData::where('district', 'Coblong')
                ->whereDate('date', $today)
                ->exists()
        );

        // Cache must be primed — proven by the key being present in the array store
        $this->assertTrue(Cache::has("weather:Coblong:{$today}"));
    }

    // -------------------------------------------------------------------------
    // GET /api/weather/today — requires auth
    // -------------------------------------------------------------------------

    public function test_weather_today_requires_authentication(): void
    {
        $this->getJson('/api/weather/today')->assertUnauthorized();
    }

    // -------------------------------------------------------------------------
    // GET /api/weather/today — returns data for user's district
    // -------------------------------------------------------------------------

    public function test_weather_today_returns_weather_for_user_district(): void
    {
        $this->makeDistrict();

        $user = User::factory()->create();
        Business::factory()->create(['user_id' => $user->id, 'district' => 'Coblong']);

        Http::fake([
            'api.open-meteo.com/*' => Http::response($this->openMeteoPayload(), 200),
        ]);

        // Populate DB and prime cache via syncDistrict; the endpoint calls getWeather()
        // which reads from cache/DB only — it will not make any API call itself.
        app(WeatherService::class)->syncDistrict('Coblong', -6.8942, 107.6108);

        $this->actingAs($user)
            ->getJson('/api/weather/today')
            ->assertOk()
            ->assertJsonPath('data.district', 'Coblong')
            ->assertJsonPath('data.condition', 'rainy');
    }

    // -------------------------------------------------------------------------
    // GET /api/weather/today — user without business returns null data
    // -------------------------------------------------------------------------

    public function test_weather_today_returns_null_data_when_no_business(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->getJson('/api/weather/today')
            ->assertOk()
            ->assertJsonPath('data', null);
    }
}
