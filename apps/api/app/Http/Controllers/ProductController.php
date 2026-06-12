<?php

namespace App\Http\Controllers;

use App\Enums\ProductStatus;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Services\ImageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProductController extends Controller
{
    public function __construct(private readonly ImageService $imageService) {}

    public function select(Request $request): JsonResponse
    {
        $products = Product::ownedBy($request->user()->id)
            ->active()
            ->orderBy('name')
            ->get(['id', 'name', 'price', 'current_stock']);

        return response()->json([
            'data' => $products->map(fn ($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'price' => (float) $p->price,
                'current_stock' => $p->current_stock,
            ]),
        ]);
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $products = Product::ownedBy($request->user()->id)
            ->when($request->input('status'), fn ($q, $s) => $q->where('status', $s))
            ->when($request->input('search'), fn ($q, $s) => $q->where('name', 'like', "%{$s}%"))
            ->orderByDesc('created_at')
            ->paginate(15)
            ->withQueryString();

        return ProductResource::collection($products);
    }

    public function store(StoreProductRequest $request): JsonResponse
    {
        $data = $request->validated();

        if ($request->hasFile('image')) {
            $data['image_path'] = $this->imageService->store($request->file('image'), $request->user()->id);
        }

        $product = $request->user()->products()->create($data);

        return ProductResource::make($product)->response()->setStatusCode(201);
    }

    public function show(Request $request, Product $product): JsonResponse
    {
        $this->authorize('view', $product);

        return ProductResource::make($product)->response();
    }

    public function update(UpdateProductRequest $request, Product $product): JsonResponse
    {
        $this->authorize('update', $product);

        $data = $request->validated();

        if ($request->hasFile('image')) {
            $this->imageService->delete($product->image_path);
            $data['image_path'] = $this->imageService->store($request->file('image'), $request->user()->id);
        }

        $product->update($data);

        return ProductResource::make($product->fresh())->response();
    }

    public function destroy(Request $request, Product $product): JsonResponse
    {
        $this->authorize('delete', $product);

        if ($product->transactionItems()->exists()) {
            $product->update(['status' => ProductStatus::Inactive]);
            $product->delete();

            return response()->json([
                'message' => 'Produk dinonaktifkan dan dihapus karena memiliki riwayat transaksi.',
            ]);
        }

        $this->imageService->delete($product->image_path);
        $product->delete();

        return response()->json(['message' => 'Produk berhasil dihapus.']);
    }
}
