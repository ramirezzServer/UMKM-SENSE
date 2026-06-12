<?php

namespace App\Http\Controllers;

use App\Http\Requests\ImportPreviewRequest;
use App\Services\CsvImportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class TransactionImportController extends Controller
{
    public function __construct(private readonly CsvImportService $importService) {}

    /**
     * Download CSV template.
     */
    public function template(): Response
    {
        $csv = "tanggal,nama_produk,qty,harga_satuan,metode_bayar,nama_pelanggan\n"
             ."2025-01-15,Kopi Susu,2,15000,Cash,Budi Santoso\n"
             ."2025-01-15,Nasi Goreng,1,25000,QRIS,\n";

        return response($csv, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="template_transaksi.csv"',
        ]);
    }

    /**
     * Parse + validate file, return report without saving anything.
     */
    public function preview(ImportPreviewRequest $request): JsonResponse
    {
        try {
            $rows = $this->importService->parseFile($request->file('file'));
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        try {
            $result = $this->importService->validateRows($rows, $request->user());
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        $token = Str::random(40);
        Cache::put("import_preview:{$token}", $result['valid_rows'], now()->addHour());

        return response()->json([
            'preview_token' => $token,
            'summary' => [
                'total' => count($rows),
                'valid' => count($result['valid_rows']),
                'invalid' => count($result['errors']),
            ],
            'errors' => $result['errors'],
            'warnings' => $result['warnings'],
            'preview' => array_slice($result['valid_rows'], 0, 5),
        ]);
    }

    /**
     * Commit previously previewed rows to the database.
     */
    public function confirm(Request $request): JsonResponse
    {
        $request->validate([
            'preview_token' => ['required', 'string'],
        ]);

        $token = $request->input('preview_token');
        $validRows = Cache::get("import_preview:{$token}");

        if ($validRows === null) {
            return response()->json([
                'message' => 'Token preview tidak valid atau sudah kedaluwarsa. Lakukan preview ulang.',
            ], 422);
        }

        $result = $this->importService->import($validRows, $request->user());

        Cache::forget("import_preview:{$token}");

        return response()->json([
            'message' => "Berhasil mengimpor {$result['imported']} transaksi.",
            'imported' => $result['imported'],
            'skipped' => $result['skipped'],
        ]);
    }
}
