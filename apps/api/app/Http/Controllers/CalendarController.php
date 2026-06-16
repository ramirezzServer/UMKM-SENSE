<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Services\HolidayService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class CalendarController extends Controller
{
    /**
     * GET /calendar?month=YYYY-MM
     * Returns the authenticated user's events + national holidays for the given month.
     */
    public function index(Request $request, HolidayService $holidayService): JsonResponse
    {
        $request->validate([
            'month' => ['nullable', 'regex:/^\d{4}-(0[1-9]|1[0-2])$/'],
        ]);

        $month = $request->input('month', now()->format('Y-m'));
        [$year, $monthNum] = explode('-', $month);

        $startOfMonth = Carbon::createFromDate((int) $year, (int) $monthNum, 1)
            ->startOfMonth()
            ->format('Y-m-d');

        $endOfMonth = Carbon::createFromDate((int) $year, (int) $monthNum, 1)
            ->endOfMonth()
            ->format('Y-m-d');

        // User events that overlap with this month
        $events = Event::where('user_id', $request->user()->id)
            ->where('start_date', '<=', $endOfMonth)
            ->where(function ($q) use ($startOfMonth) {
                $q->whereNull('end_date')
                    ->orWhere('end_date', '>=', $startOfMonth);
            })
            ->orderBy('start_date')
            ->get();

        $holidays = $holidayService->getHolidaysInRange($startOfMonth, $endOfMonth);

        return response()->json([
            'data' => [
                'month' => $month,
                'events' => $events->map(fn ($e) => [
                    'id' => $e->id,
                    'name' => $e->name,
                    'description' => $e->description,
                    'start_date' => $e->start_date->format('Y-m-d'),
                    'end_date' => $e->end_date?->format('Y-m-d'),
                    'type' => $e->type,
                    'created_at' => $e->created_at->toISOString(),
                    'updated_at' => $e->updated_at->toISOString(),
                ])->values(),
                'holidays' => collect($holidays)->map(fn ($h) => [
                    'date' => $h['date'],
                    'name' => $h['name'],
                ])->values(),
            ],
        ]);
    }
}
