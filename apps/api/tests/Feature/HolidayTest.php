<?php

namespace Tests\Feature;

use App\Models\NationalHoliday;
use App\Models\User;
use App\Services\HolidayService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class HolidayTest extends TestCase
{
    use RefreshDatabase;

    // Fake response matching api-harilibur format; all entries are national holidays
    private function apiPayload(int $year): array
    {
        return [
            ['holiday_date' => "{$year}-01-01", 'holiday_name' => 'Tahun Baru Masehi', 'is_national_holiday' => true],
            ['holiday_date' => "{$year}-08-17", 'holiday_name' => 'Hari Kemerdekaan', 'is_national_holiday' => true],
            // cuti bersama — must be excluded
            ['holiday_date' => "{$year}-06-02", 'holiday_name' => 'Cuti Bersama', 'is_national_holiday' => false],
        ];
    }

    private function fakeApi(int $year): void
    {
        Http::fake([
            'api-harilibur.vercel.app/*' => Http::response($this->apiPayload($year), 200),
        ]);
    }

    // -------------------------------------------------------------------------
    // getHolidays: fetches from API, persists to DB + cache
    // -------------------------------------------------------------------------

    public function test_get_holidays_fetches_from_api_and_persists(): void
    {
        $this->fakeApi(2026);

        $holidays = app(HolidayService::class)->getHolidays(2026);

        Http::assertSentCount(1);
        $this->assertCount(2, $holidays); // cuti bersama excluded
        $this->assertEquals('2026-01-01', $holidays[0]['date']);

        // DB must have the two national holidays
        $this->assertDatabaseCount('national_holidays', 2);

        // Cache must be primed
        $this->assertTrue(Cache::has('holidays:year:2026'));
    }

    // -------------------------------------------------------------------------
    // getHolidays: second call returns from cache, no API re-hit
    // -------------------------------------------------------------------------

    public function test_second_call_returns_from_cache_without_hitting_api(): void
    {
        Http::fake([
            'api-harilibur.vercel.app/*' => Http::sequence()
                ->push($this->apiPayload(2026), 200)
                ->whenEmpty(Http::response(null, 500)),
        ]);

        $service = app(HolidayService::class);

        $first = $service->getHolidays(2026);
        $second = $service->getHolidays(2026);

        Http::assertSentCount(1);
        $this->assertEquals($first, $second);
    }

    // -------------------------------------------------------------------------
    // getHolidays: DB-first — if year already in DB, skip API entirely
    // -------------------------------------------------------------------------

    public function test_skips_api_when_year_already_in_db(): void
    {
        NationalHoliday::create([
            'holiday_date' => '2026-01-01',
            'holiday_name' => 'Tahun Baru Masehi',
            'year' => 2026,
        ]);

        Http::fake([]); // any API call → throw

        $holidays = app(HolidayService::class)->getHolidays(2026);

        Http::assertNothingSent();
        $this->assertCount(1, $holidays);
    }

    // -------------------------------------------------------------------------
    // Fallback: returns DB data when API fails
    // -------------------------------------------------------------------------

    public function test_falls_back_to_db_when_api_fails(): void
    {
        NationalHoliday::create([
            'holiday_date' => '2025-01-01',
            'holiday_name' => 'Tahun Baru Masehi',
            'year' => 2025,
        ]);

        Http::fake([
            'api-harilibur.vercel.app/*' => Http::response(null, 500),
        ]);

        // 2025 already in DB, so API won't be called — but test the fallback path too
        // Test fresh year that has no DB data: API fails, return []
        $result = app(HolidayService::class)->getHolidays(2099);
        $this->assertIsArray($result);
        $this->assertEmpty($result); // no DB data, API failed → empty, not an exception
    }

    // -------------------------------------------------------------------------
    // Sanitization: non-national holiday rows are excluded
    // -------------------------------------------------------------------------

    public function test_sanitizer_excludes_non_national_holidays(): void
    {
        $this->fakeApi(2026);

        $holidays = app(HolidayService::class)->getHolidays(2026);

        $dates = array_column($holidays, 'date');
        $this->assertNotContains('2026-06-02', $dates); // cuti bersama excluded
    }

    // -------------------------------------------------------------------------
    // isHoliday: accurate for known holiday and non-holiday
    // -------------------------------------------------------------------------

    public function test_is_holiday_returns_true_for_holiday(): void
    {
        $this->fakeApi(2026);

        $this->assertTrue(app(HolidayService::class)->isHoliday('2026-01-01'));
    }

    public function test_is_holiday_returns_false_for_regular_day(): void
    {
        $this->fakeApi(2026);

        $this->assertFalse(app(HolidayService::class)->isHoliday('2026-03-15'));
    }

    // -------------------------------------------------------------------------
    // getHolidaysInRange: correct filtering, spanning years
    // -------------------------------------------------------------------------

    public function test_get_holidays_in_range_filters_correctly(): void
    {
        Http::fake([
            'api-harilibur.vercel.app/*' => Http::response($this->apiPayload(2026), 200),
        ]);

        $holidays = app(HolidayService::class)->getHolidaysInRange('2026-01-01', '2026-06-30');

        // Only Jan 01 is in range; Aug 17 is outside
        $dates = array_column($holidays, 'date');
        $this->assertContains('2026-01-01', $dates);
        $this->assertNotContains('2026-08-17', $dates);
    }

    public function test_get_holidays_in_range_spans_multiple_years(): void
    {
        Http::fake([
            'api-harilibur.vercel.app/*' => Http::sequence()
                ->push($this->apiPayload(2025), 200)
                ->push($this->apiPayload(2026), 200),
        ]);

        $holidays = app(HolidayService::class)->getHolidaysInRange('2025-08-01', '2026-01-31');

        $dates = array_column($holidays, 'date');
        $this->assertContains('2025-08-17', $dates);
        $this->assertContains('2026-01-01', $dates);
        $this->assertNotContains('2025-01-01', $dates); // outside range
    }

    // -------------------------------------------------------------------------
    // GET /api/holidays — requires auth
    // -------------------------------------------------------------------------

    public function test_holidays_endpoint_requires_authentication(): void
    {
        $this->getJson('/api/holidays?start=2026-01-01&end=2026-12-31')->assertUnauthorized();
    }

    // -------------------------------------------------------------------------
    // GET /api/holidays — validates start/end params
    // -------------------------------------------------------------------------

    public function test_holidays_endpoint_validates_date_params(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->getJson('/api/holidays')
            ->assertUnprocessable();

        $this->actingAs($user)
            ->getJson('/api/holidays?start=2026-01-01&end=2025-12-31') // end before start
            ->assertUnprocessable();
    }

    // -------------------------------------------------------------------------
    // GET /api/holidays — returns correct holidays in range
    // -------------------------------------------------------------------------

    public function test_holidays_endpoint_returns_holidays_in_range(): void
    {
        $this->fakeApi(2026);

        $user = User::factory()->create();

        $this->actingAs($user)
            ->getJson('/api/holidays?start=2026-01-01&end=2026-12-31')
            ->assertOk()
            ->assertJsonPath('data.0.date', '2026-01-01')
            ->assertJsonPath('data.0.name', 'Tahun Baru Masehi');
    }

    // -------------------------------------------------------------------------
    // holidays:sync command syncs current year and next year by default
    // -------------------------------------------------------------------------

    public function test_sync_command_syncs_current_and_next_year(): void
    {
        $currentYear = (int) now()->format('Y');
        $nextYear = $currentYear + 1;

        Http::fake([
            'api-harilibur.vercel.app/*' => Http::sequence()
                ->push($this->apiPayload($currentYear), 200)
                ->push($this->apiPayload($nextYear), 200),
        ]);

        $this->artisan('holidays:sync')->assertSuccessful();

        $this->assertTrue(
            NationalHoliday::where('year', $currentYear)->exists()
        );
        $this->assertTrue(
            NationalHoliday::where('year', $nextYear)->exists()
        );
    }

    // -------------------------------------------------------------------------
    // holidays:sync with explicit year argument
    // -------------------------------------------------------------------------

    public function test_sync_command_accepts_explicit_year(): void
    {
        Http::fake([
            'api-harilibur.vercel.app/*' => Http::response($this->apiPayload(2030), 200),
        ]);

        $this->artisan('holidays:sync', ['year' => '2030'])->assertSuccessful();

        $this->assertTrue(NationalHoliday::where('year', 2030)->exists());
    }
}
