<?php

namespace App\Http\Controllers;

use App\Services\HolidayService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HolidayController extends Controller
{
    public function __construct(private readonly HolidayService $holidays) {}

    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'start' => ['required', 'date_format:Y-m-d'],
            'end' => ['required', 'date_format:Y-m-d', 'after_or_equal:start'],
        ]);

        $data = $this->holidays->getHolidaysInRange($validated['start'], $validated['end']);

        return response()->json(['data' => $data]);
    }
}
