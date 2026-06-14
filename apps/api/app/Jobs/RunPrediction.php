<?php

namespace App\Jobs;

use App\Models\CalendarEvent;
use App\Models\PredictionLog;
use App\Services\HolidayService;
use App\Services\PredictionClient;
use App\Services\WeatherService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class RunPrediction implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /** Maximum attempts including the first try. */
    public int $tries = 3;

    /** Seconds to wait before each retry. */
    public array $backoff = [30, 60];

    /** Hard timeout for the job in seconds. */
    public int $timeout = 90;

    public function __construct(private readonly int $predictionLogId) {}

    public function handle(
        PredictionClient $client,
        WeatherService $weatherService,
        HolidayService $holidayService,
    ): void {
        $log = PredictionLog::with('product.user')->findOrFail($this->predictionLogId);
        $log->update(['status' => 'processing']);

        $payload = $this->buildPayload($log, $weatherService, $holidayService);

        if (empty($payload['historical_data'])) {
            $log->update([
                'status' => 'failed',
                'error_message' => 'Tidak ada data transaksi historis yang tersedia untuk produk ini.',
            ]);

            return; // No point retrying — a data issue, not a service issue.
        }

        // RuntimeException from PredictionClient will trigger retry automatically.
        $result = $client->predict($payload);

        $this->saveResult($log, $result);
        $log->update(['status' => 'done']);
    }

    /**
     * Called by Laravel after all retries are exhausted.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('RunPrediction job failed permanently', [
            'prediction_log_id' => $this->predictionLogId,
            'error' => $exception->getMessage(),
        ]);

        PredictionLog::find($this->predictionLogId)?->update([
            'status' => 'failed',
            'error_message' => 'Layanan prediksi tidak tersedia setelah beberapa percobaan. Silakan coba lagi nanti.',
        ]);
    }

    // -------------------------------------------------------------------------

    private function buildPayload(
        PredictionLog $log,
        WeatherService $weatherService,
        HolidayService $holidayService,
    ): array {
        $product = $log->product;
        $user = $product->user;
        $start = $log->prediction_start->format('Y-m-d');
        $end = $log->prediction_end->format('Y-m-d');

        // Historical daily sales — last 90 days, successful transactions only.
        $historicalData = DB::table('transaction_items')
            ->select([
                DB::raw('DATE(transactions.transaction_date) as date'),
                DB::raw('CAST(SUM(transaction_items.qty) AS INTEGER) as qty_sold'),
                DB::raw('SUM(transaction_items.subtotal) as revenue'),
            ])
            ->join('transactions', 'transaction_items.transaction_id', '=', 'transactions.id')
            ->where('transaction_items.product_id', $product->id)
            ->whereNull('transactions.deleted_at')
            ->where('transactions.status', 'success')
            ->where('transactions.transaction_date', '>=', now()->subDays(90)->toDateString())
            ->groupBy(DB::raw('DATE(transactions.transaction_date)'))
            ->orderBy(DB::raw('DATE(transactions.transaction_date)'))
            ->get()
            ->map(fn ($row) => [
                'date' => $row->date,
                'qty_sold' => (int) $row->qty_sold,
                'revenue' => number_format((float) $row->revenue, 2, '.', ''),
            ])
            ->toArray();

        // Weather for prediction window — requires the business district.
        $district = $user->business?->district;
        $weatherData = [];
        if ($district) {
            $daysAhead = (int) now()->diffInDays($log->prediction_end) + 2;
            $forecast = $weatherService->getForecast($district, min($daysAhead, 16));
            $weatherData = collect($forecast)
                ->filter(fn ($w) => isset($w['date']) && $w['date'] >= $start && $w['date'] <= $end)
                ->map(fn ($w) => [
                    'date' => $w['date'],
                    'condition' => $w['condition'],
                    'temp' => round(((float) ($w['temp_min'] ?? 0) + (float) ($w['temp_max'] ?? 30)) / 2, 1),
                ])
                ->values()
                ->toArray();
        }

        // National holidays in prediction window.
        $holidays = $holidayService->getHolidaysInRange($start, $end);
        $holidayData = array_map(fn ($h) => [
            'date' => $h['date'],
            'name' => $h['name'],
        ], $holidays);

        // Local calendar events in prediction window.
        $events = CalendarEvent::whereBetween('event_date', [$start, $end])
            ->get()
            ->map(fn ($e) => [
                'date' => $e->event_date->format('Y-m-d'),
                'name' => $e->name,
                'impact' => $e->impact,
            ])
            ->toArray();

        return [
            'product_id' => (string) $product->id,
            'historical_data' => $historicalData,
            'prediction_start' => $start,
            'prediction_end' => $end,
            'external_factors' => [
                'holidays' => $holidayData,
                'events' => $events,
                'weather' => $weatherData,
            ],
        ];
    }

    private function saveResult(PredictionLog $log, array $result): void
    {
        DB::transaction(function () use ($log, $result) {
            $log->update([
                'forecast_method' => $result['accuracy_metrics']['method'] ?? null,
                'mae' => $result['accuracy_metrics']['mae'] ?? null,
                'mape' => $result['accuracy_metrics']['mape'] ?? null,
                'ai_summary' => $result['ai_summary'] ?? null,
            ]);

            foreach ($result['predictions'] ?? [] as $pred) {
                $log->items()->create([
                    'date' => $pred['date'],
                    'predicted_qty' => (int) $pred['predicted_qty'],
                    'predicted_revenue' => $pred['predicted_revenue'],
                    'confidence' => (float) $pred['confidence'],
                    'level' => $pred['level'],
                ]);
            }

            foreach ($result['recommendations'] ?? [] as $i => $rec) {
                $log->recommendations()->create([
                    'priority' => $rec['priority'],
                    'title' => $rec['title'],
                    'description' => $rec['description'],
                    'sort_order' => $i,
                ]);
            }

            foreach ($result['warnings'] ?? [] as $warning) {
                $log->warnings()->create([
                    'level' => $warning['level'],
                    'message' => $warning['message'],
                ]);
            }
        });
    }
}
