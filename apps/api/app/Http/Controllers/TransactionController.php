<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTransactionRequest;
use App\Http\Requests\UpdateTransactionRequest;
use App\Http\Resources\TransactionResource;
use App\Models\Product;
use App\Models\Transaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class TransactionController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $transactions = Transaction::where('user_id', $request->user()->id)
            ->with('items')
            ->when($request->input('status'), fn ($q, $s) => $q->where('status', $s))
            ->when($request->input('date_from'), fn ($q, $d) => $q->whereDate('transaction_date', '>=', $d))
            ->when($request->input('date_to'), fn ($q, $d) => $q->whereDate('transaction_date', '<=', $d))
            ->orderByDesc('transaction_date')
            ->orderByDesc('created_at')
            ->paginate(15)
            ->withQueryString();

        return TransactionResource::collection($transactions);
    }

    public function store(StoreTransactionRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $user = $request->user();

        $transaction = DB::transaction(function () use ($validated, $user) {
            $productIds = collect($validated['items'])->pluck('product_id')->unique();

            // Fetch all products in one query and lock rows to prevent race conditions
            $products = Product::whereIn('id', $productIds)
                ->where('user_id', $user->id)
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            $itemData = [];
            $totalAmount = 0;

            foreach ($validated['items'] as $item) {
                $product = $products[$item['product_id']];
                $unitPrice = (float) $product->price;         // price from DB, not frontend
                $subtotal = round($item['qty'] * $unitPrice, 2);
                $totalAmount += $subtotal;

                $itemData[] = [
                    'product_id' => $product->id,
                    'product_name' => $product->name,           // snapshot
                    'qty' => $item['qty'],
                    'unit_price' => $unitPrice,
                    'subtotal' => $subtotal,
                ];
            }

            $transaction = $user->transactions()->create([
                'customer_name' => $validated['customer_name'] ?? null,
                'transaction_date' => $validated['transaction_date'],
                'payment_method' => $validated['payment_method'],
                'status' => $validated['status'] ?? 'success',
                'total_amount' => round($totalAmount, 2),
            ]);

            $transaction->items()->createMany($itemData);

            // Deduct stock per product (sum qty in case same product appears multiple times)
            foreach (collect($itemData)->groupBy('product_id') as $productId => $group) {
                Product::where('id', $productId)->decrement('current_stock', $group->sum('qty'));
            }

            return $transaction->load('items');
        });

        return TransactionResource::make($transaction)->response()->setStatusCode(201);
    }

    public function show(Request $request, Transaction $transaction): JsonResponse
    {
        $this->authorize('view', $transaction);

        return TransactionResource::make($transaction->load('items'))->response();
    }

    public function update(UpdateTransactionRequest $request, Transaction $transaction): JsonResponse
    {
        $this->authorize('update', $transaction);

        $validated = $request->validated();
        $user = $request->user();

        $transaction = DB::transaction(function () use ($validated, $user, $transaction) {
            $updateData = collect($validated)->except('items')->toArray();

            if (isset($validated['items'])) {
                // Restore stock for old items before replacing them
                foreach ($transaction->items()->get() as $oldItem) {
                    Product::where('id', $oldItem->product_id)
                        ->increment('current_stock', $oldItem->qty);
                }

                $transaction->items()->delete();

                $productIds = collect($validated['items'])->pluck('product_id')->unique();
                $products = Product::whereIn('id', $productIds)
                    ->where('user_id', $user->id)
                    ->lockForUpdate()
                    ->get()
                    ->keyBy('id');

                $itemData = [];
                $totalAmount = 0;

                foreach ($validated['items'] as $item) {
                    $product = $products[$item['product_id']];
                    $unitPrice = (float) $product->price;
                    $subtotal = round($item['qty'] * $unitPrice, 2);
                    $totalAmount += $subtotal;

                    $itemData[] = [
                        'product_id' => $product->id,
                        'product_name' => $product->name,
                        'qty' => $item['qty'],
                        'unit_price' => $unitPrice,
                        'subtotal' => $subtotal,
                    ];
                }

                $transaction->items()->createMany($itemData);
                $updateData['total_amount'] = round($totalAmount, 2);

                foreach (collect($itemData)->groupBy('product_id') as $productId => $group) {
                    Product::where('id', $productId)->decrement('current_stock', $group->sum('qty'));
                }
            }

            $transaction->update($updateData);

            return $transaction->load('items');
        });

        return TransactionResource::make($transaction)->response();
    }

    public function destroy(Request $request, Transaction $transaction): JsonResponse
    {
        $this->authorize('delete', $transaction);

        $transaction->delete();

        return response()->json(['message' => 'Transaksi berhasil dihapus.']);
    }
}
