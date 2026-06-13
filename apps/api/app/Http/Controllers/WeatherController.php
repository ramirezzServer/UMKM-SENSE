<?php

namespace App\Http\Controllers;

use App\Services\WeatherService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WeatherController extends Controller
{
    public function __construct(private readonly WeatherService $weather) {}

    public function today(Request $request): JsonResponse
    {
        $business = $request->user()->business;

        if (! $business) {
            return response()->json(['data' => null]);
        }

        $data = $this->weather->getWeather($business->district, now()->format('Y-m-d'));

        return response()->json(['data' => $data]);
    }
}
