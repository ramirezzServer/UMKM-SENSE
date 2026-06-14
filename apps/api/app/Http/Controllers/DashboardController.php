<?php

namespace App\Http\Controllers;

use App\Enums\TransactionStatus;
use App\Models\PredictionLog;
use App\Services\HolidayService;
use App\Services\WeatherService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function __construct(
        private readonly WeatherService $weather,
        private readonly HolidayService $holidays,
    ) {}

    // -------------------------------------------------------------------------
    // GET /dashboard/summary
    // -------------------------------------------------------------------------

    public function summary(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $today = now()->format('Y-m-d');
        $yesterday = now()->subDay()->format('Y-m-d');

        // Single query for both days — GROUP BY transaction_date
        // Note: whereDate() generates driver-correct SQL for both SQLite and PostgreSQL,
        // guarding against Eloquent's date cast storing 'Y-m-d H:i:s' in SQLite.
        $rows = DB::table('transactions')
            ->selectRaw('transaction_date, SUM(total_amount) as total, COUNT(*) as cnt')
            ->where('user_id', $userId)
            ->whereDate('transaction_date', '>=', $yesterday)
            ->whereDate('transaction_date', '<=', $today)
            ->where('status', TransactionStatus::Success->value)
            ->whereNull('deleted_at')
            ->groupBy('transaction_date')
            ->get()
            ->keyBy(fn ($r) => Carbon::parse($r->transaction_date)->format('Y-m-d'));

        $todayRow = $rows->get($today);
        $yestRow = $rows->get($yesterday);

        $todayTotal = (float) ($todayRow->total ?? 0);
        $todayCount = (int) ($todayRow->cnt ?? 0);
        $todayAvg = $todayCount > 0 ? $todayTotal / $todayCount : 0.0;

        $yestTotal = (float) ($yestRow->total ?? 0);
        $yestCount = (int) ($yestRow->cnt ?? 0);
        $yestAvg = $yestCount > 0 ? $yestTotal / $yestCount : 0.0;

        return response()->json([
            'data' => [
                'total_penjualan' => round($todayTotal, 2),
                'jumlah_transaksi' => $todayCount,
                'rata_rata_per_transaksi' => round($todayAvg, 2),
                'vs_kemarin' => [
                    'total_penjualan' => $this->comparison($todayTotal, $yestTotal),
                    'jumlah_transaksi' => $this->comparison($todayCount, $yestCount),
                    'rata_rata_per_transaksi' => $this->comparison($todayAvg, $yestAvg),
                ],
            ],
        ]);
    }

    // -------------------------------------------------------------------------
    // GET /dashboard/trend?days=7
    // -------------------------------------------------------------------------

    public function trend(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'days' => ['sometimes', 'integer', 'min:1', 'max:90'],
        ]);

        $days = (int) ($validated['days'] ?? 7);
        $userId = $request->user()->id;
        $today = now()->format('Y-m-d');
        $startDate = now()->subDays($days - 1)->format('Y-m-d');

        // Single query with GROUP BY — fill zeroes in PHP
        $rows = DB::table('transactions')
            ->selectRaw('transaction_date, SUM(total_amount) as total, COUNT(*) as cnt')
            ->where('user_id', $userId)
            ->whereDate('transaction_date', '>=', $startDate)
            ->whereDate('transaction_date', '<=', $today)
            ->where('status', TransactionStatus::Success->value)
            ->whereNull('deleted_at')
            ->groupBy('transaction_date')
            ->get()
            ->keyBy(fn ($r) => Carbon::parse($r->transaction_date)->format('Y-m-d'));

        // Indonesian short day labels: 0=Sun → MIN, 1=Mon → SEN, …
        $dayLabels = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'];

        $trend = [];
        for ($i = $days - 1; $i >= 0; $i--) {
            $date = now()->subDays($i)->format('Y-m-d');
            $row = $rows->get($date);

            $trend[] = [
                'date' => $date,
                'day_label' => $dayLabels[Carbon::parse($date)->dayOfWeek],
                'total' => (float) ($row->total ?? 0),
                'count' => (int) ($row->cnt ?? 0),
            ];
        }

        return response()->json(['data' => $trend]);
    }

    // -------------------------------------------------------------------------
    // GET /dashboard/top-products?days=7&limit=5
    // -------------------------------------------------------------------------

    public function topProducts(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'days' => ['sometimes', 'integer', 'min:1', 'max:90'],
            'limit' => ['sometimes', 'integer', 'min:1', 'max:20'],
        ]);

        $days = (int) ($validated['days'] ?? 7);
        $limit = (int) ($validated['limit'] ?? 5);
        $userId = $request->user()->id;
        $today = now()->format('Y-m-d');
        $currentStart = now()->subDays($days - 1)->format('Y-m-d');
        $prevStart = now()->subDays($days * 2 - 1)->format('Y-m-d');
        $prevEnd = now()->subDays($days)->format('Y-m-d');

        // Query 1: Top N products in the current period
        $current = DB::table('transaction_items as ti')
            ->join('transactions as t', 't.id', '=', 'ti.transaction_id')
            ->select('ti.product_id')
            ->selectRaw('MAX(ti.product_name) as product_name, SUM(ti.qty) as total_qty, SUM(ti.subtotal) as total_revenue')
            ->where('t.user_id', $userId)
            ->where('t.status', TransactionStatus::Success->value)
            ->whereNull('t.deleted_at')
            ->whereDate('t.transaction_date', '>=', $currentStart)
            ->whereDate('t.transaction_date', '<=', $today)
            ->groupBy('ti.product_id')
            ->orderByDesc('total_qty')
            ->limit($limit)
            ->get();

        if ($current->isEmpty()) {
            return response()->json(['data' => []]);
        }

        // Query 2: Previous period stats for the same product IDs
        $productIds = $current->pluck('product_id')->all();

        $prev = DB::table('transaction_items as ti')
            ->join('transactions as t', 't.id', '=', 'ti.transaction_id')
            ->select('ti.product_id')
            ->selectRaw('SUM(ti.qty) as prev_qty')
            ->where('t.user_id', $userId)
            ->where('t.status', TransactionStatus::Success->value)
            ->whereNull('t.deleted_at')
            ->whereDate('t.transaction_date', '>=', $prevStart)
            ->whereDate('t.transaction_date', '<=', $prevEnd)
            ->whereIn('ti.product_id', $productIds)
            ->groupBy('ti.product_id')
            ->get()
            ->keyBy('product_id');

        $data = $current->map(function ($row) use ($prev) {
            $currentQty = (int) $row->total_qty;
            $prevQty = (int) ($prev->get($row->product_id)?->prev_qty ?? 0);

            return [
                'product_id' => $row->product_id,
                'product_name' => $row->product_name,
                'total_qty' => $currentQty,
                'total_revenue' => round((float) $row->total_revenue, 2),
                'vs_sebelumnya' => $this->comparison($currentQty, $prevQty),
            ];
        });

        return response()->json(['data' => $data->values()]);
    }

    // -------------------------------------------------------------------------
    // GET /dashboard/conditions
    // -------------------------------------------------------------------------

    public function conditions(Request $request): JsonResponse
    {
        $business = $request->user()->business;
        $today = now()->format('Y-m-d');
        $nextWeekEnd = now()->addDays(6)->format('Y-m-d');

        $weather = $business
            ? $this->weather->getWeather($business->district, $today)
            : null;

        $events = $this->holidays->getHolidaysInRange($today, $nextWeekEnd);

        return response()->json([
            'data' => [
                'cuaca' => $weather,
                'events' => $events,
            ],
        ]);
    }

    // -------------------------------------------------------------------------
    // GET /dashboard/tomorrow-prediction
    // -------------------------------------------------------------------------

    public function tomorrowPrediction(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $tomorrow = now()->addDay()->format('Y-m-d');

        // Find the latest completed prediction that covers tomorrow's date.
        // We never run heavy forecasting here — only read what the job already stored.
        $log = PredictionLog::where('user_id', $userId)
            ->where('status', 'done')
            ->whereDate('prediction_start', '<=', $tomorrow)
            ->whereDate('prediction_end', '>=', $tomorrow)
            ->with(['items', 'recommendations'])
            ->latest('updated_at')
            ->first();

        if (! $log) {
            return response()->json(['data' => ['has_prediction' => false]]);
        }

        $item = $log->items->first(
            fn ($i) => Carbon::parse($i->date)->format('Y-m-d') === $tomorrow
        );

        if (! $item) {
            return response()->json(['data' => ['has_prediction' => false]]);
        }

        // Sort recommendations high → medium → low in PHP (avoids driver-specific SQL)
        $priorityOrder = ['high' => 0, 'medium' => 1, 'low' => 2];
        $topRec = $log->recommendations
            ->sortBy(fn ($r) => $priorityOrder[$r->priority] ?? 9)
            ->first();

        return response()->json([
            'data' => [
                'has_prediction' => true,
                'prediction_log_id' => $log->id,
                'product_id' => $log->product_id,
                'predicted_revenue' => round((float) $item->predicted_revenue, 2),
                'predicted_qty' => (int) $item->predicted_qty,
                'confidence' => (float) $item->confidence,
                'level' => $item->level,
                'forecast_method' => $log->forecast_method,
                'mape' => (float) $log->mape,
                'top_recommendation' => $topRec ? [
                    'priority' => $topRec->priority,
                    'title' => $topRec->title,
                ] : null,
            ],
        ]);
    }

    // -------------------------------------------------------------------------
    // Private helper
    // -------------------------------------------------------------------------

    private function comparison(float $current, float $previous): array
    {
        if ($previous == 0 && $current == 0) {
            return ['pct' => null, 'direction' => null];
        }

        if ($previous == 0) {
            return ['pct' => null, 'direction' => 'up'];
        }

        $pct = round(($current - $previous) / $previous * 100, 1);

        return [
            'pct' => $pct,
            'direction' => $pct >= 0 ? 'up' : 'down',
        ];
    }
}
