<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePredictionRequest;
use App\Jobs\RunPrediction;
use App\Models\PredictionLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PredictionController extends Controller
{
    /**
     * POST /predictions
     * Validates, creates a pending log, dispatches background job, returns 202 instantly.
     */
    public function store(StorePredictionRequest $request): JsonResponse
    {
        $log = PredictionLog::create([
            'user_id' => $request->user()->id,
            'product_id' => $request->validated('product_id'),
            'status' => 'pending',
            'prediction_start' => $request->validated('prediction_start'),
            'prediction_end' => $request->validated('prediction_end'),
        ]);

        RunPrediction::dispatch($log->id);

        return response()->json([
            'prediction_id' => $log->id,
            'status' => 'pending',
            'message' => 'Prediksi sedang diproses. Cek status dengan GET /predictions/{id}/status.',
        ], 202);
    }

    /**
     * GET /predictions/{id}/status
     * Returns current status; if done, includes full prediction data.
     */
    public function status(Request $request, int $id): JsonResponse
    {
        $log = PredictionLog::where('user_id', $request->user()->id)
            ->findOrFail($id);

        if ($log->status !== 'done') {
            return response()->json([
                'prediction_id' => $log->id,
                'status' => $log->status,
                'error' => $log->error_message,
            ]);
        }

        $log->load(['items', 'recommendations', 'warnings']);

        return response()->json([
            'prediction_id' => $log->id,
            'status' => 'done',
            'prediction' => [
                'product_id' => $log->product_id,
                'prediction_start' => $log->prediction_start->format('Y-m-d'),
                'prediction_end' => $log->prediction_end->format('Y-m-d'),
                'forecast_method' => $log->forecast_method,
                'mae' => $log->mae,
                'mape' => $log->mape,
                'ai_summary' => $log->ai_summary,
                'items' => $log->items,
                'recommendations' => $log->recommendations,
                'warnings' => $log->warnings,
            ],
        ]);
    }
}
