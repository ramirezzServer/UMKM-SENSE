<?php

namespace App\Services;

use App\Models\Product;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use League\Csv\Reader;
use PhpOffice\PhpSpreadsheet\IOFactory;

class CsvImportService
{
    public const MAX_ROWS = 1000;

    private const REQUIRED_HEADERS = [
        'tanggal',
        'nama_produk',
        'qty',
        'harga_satuan',
        'metode_bayar',
        'nama_pelanggan',
    ];

    private const PAYMENT_MAP = [
        'transfer' => 'Transfer',
        'cash' => 'Cash',
        'qris' => 'QRIS',
    ];

    // ---------------------------------------------------------------------------
    // Parsing
    // ---------------------------------------------------------------------------

    public function parseFile(UploadedFile $file): array
    {
        $ext = strtolower($file->getClientOriginalExtension());

        return match ($ext) {
            'csv' => $this->parseCsv($file),
            'xlsx' => $this->parseXlsx($file),
            default => throw new \InvalidArgumentException('Format file tidak didukung.'),
        };
    }

    private function parseCsv(UploadedFile $file): array
    {
        $reader = Reader::createFromPath($file->getRealPath(), 'r');
        $reader->setHeaderOffset(0);

        $headers = array_map(fn ($h) => strtolower(trim($h)), $reader->getHeader());
        $missing = array_diff(self::REQUIRED_HEADERS, $headers);

        if (! empty($missing)) {
            throw new \RuntimeException('Header CSV tidak lengkap: '.implode(', ', $missing));
        }

        $rows = [];
        foreach ($reader->getRecords() as $record) {
            // Normalize keys to lowercase trimmed
            $normalized = [];
            foreach ($record as $key => $val) {
                $normalized[strtolower(trim($key))] = $val;
            }
            $rows[] = $normalized;
        }

        return $rows;
    }

    private function parseXlsx(UploadedFile $file): array
    {
        $spreadsheet = IOFactory::load($file->getRealPath());
        $sheet = $spreadsheet->getActiveSheet();
        $data = $sheet->toArray(null, true, true, false);

        if (empty($data)) {
            throw new \RuntimeException('File XLSX kosong.');
        }

        $rawHeaders = array_shift($data);
        $headers = array_map(fn ($h) => strtolower(trim((string) $h)), $rawHeaders);
        $missing = array_diff(self::REQUIRED_HEADERS, $headers);

        if (! empty($missing)) {
            throw new \RuntimeException('Header XLSX tidak lengkap: '.implode(', ', $missing));
        }

        $rows = [];
        foreach ($data as $row) {
            // Skip completely empty rows
            if (empty(array_filter(array_map('strval', $row)))) {
                continue;
            }

            $mapped = [];
            foreach ($headers as $i => $header) {
                $mapped[$header] = isset($row[$i]) ? trim((string) $row[$i]) : '';
            }
            $rows[] = $mapped;
        }

        return $rows;
    }

    // ---------------------------------------------------------------------------
    // Validation (no DB writes)
    // ---------------------------------------------------------------------------

    public function validateRows(array $rows, User $user): array
    {
        if (count($rows) > self::MAX_ROWS) {
            throw new \RuntimeException('File melebihi batas maksimum '.self::MAX_ROWS.' baris data.');
        }

        // Pre-load user products once (anti-N+1): lowercase name → Product
        $productMap = Product::ownedBy($user->id)
            ->whereNull('deleted_at')
            ->get()
            ->keyBy(fn ($p) => strtolower(trim($p->name)));

        // Pre-build existing duplicate set once
        $dupeSet = $this->buildDupeSet($user->id);

        $validRows = [];
        $errors = [];
        $warnings = [];

        foreach ($rows as $i => $row) {
            $rowNum = $i + 2;  // row 1 = header
            $rowErrors = $this->validateRow($row, $productMap);

            if (! empty($rowErrors)) {
                $errors[] = ['row' => $rowNum, 'errors' => $rowErrors];

                continue;
            }

            $nameProdukLower = strtolower(trim($row['nama_produk']));
            $qty = (int) $row['qty'];
            $date = trim($row['tanggal']);
            $paymentMethod = self::PAYMENT_MAP[strtolower(trim($row['metode_bayar']))] ?? $row['metode_bayar'];

            $validRow = [
                'row_number' => $rowNum,
                'transaction_date' => $date,
                'product_name_lower' => $nameProdukLower,
                'qty' => $qty,
                'payment_method' => $paymentMethod,
                'customer_name' => trim($row['nama_pelanggan'] ?? '') ?: null,
            ];

            $validRows[] = $validRow;

            // Duplicate detection
            $dupeKey = "{$date}|{$nameProdukLower}|{$qty}";
            if (isset($dupeSet[$dupeKey])) {
                $warnings[] = [
                    'row' => $rowNum,
                    'message' => 'Kemungkinan duplikat: transaksi serupa (tanggal, produk, qty) sudah ada.',
                ];
            }
        }

        return [
            'valid_rows' => $validRows,
            'errors' => $errors,
            'warnings' => $warnings,
        ];
    }

    private function validateRow(array $row, $productMap): array
    {
        $errors = [];

        // tanggal
        $tanggal = trim($row['tanggal'] ?? '');
        if (empty($tanggal) || ! preg_match('/^\d{4}-\d{2}-\d{2}$/', $tanggal)) {
            $errors[] = 'Format tanggal harus YYYY-MM-DD.';
        } elseif (strtotime($tanggal) > strtotime('today')) {
            $errors[] = 'Tanggal tidak boleh di masa depan.';
        }

        // nama_produk
        $namaProduk = strtolower(trim($row['nama_produk'] ?? ''));
        if (empty($namaProduk)) {
            $errors[] = 'nama_produk wajib diisi.';
        } elseif (! isset($productMap[$namaProduk])) {
            $errors[] = "Produk '".trim($row['nama_produk'])."' tidak ditemukan dalam daftar produk Anda.";
        }

        // qty
        $qty = $row['qty'] ?? '';
        if (! ctype_digit((string) ltrim((string) $qty, '0') ?: '0')
            || (int) $qty < 1
            || (int) $qty > 9999
        ) {
            $errors[] = 'qty harus bilangan bulat positif (1–9999).';
        }

        // harga_satuan (validated but DB price used on import)
        $harga = $row['harga_satuan'] ?? '';
        if (! is_numeric($harga) || (float) $harga <= 0 || (float) $harga > 10000000) {
            $errors[] = 'harga_satuan harus angka positif, maksimal 10.000.000.';
        }

        // metode_bayar
        $metode = strtolower(trim($row['metode_bayar'] ?? ''));
        if (! isset(self::PAYMENT_MAP[$metode])) {
            $errors[] = 'metode_bayar harus salah satu: Transfer, Cash, QRIS.';
        }

        // nama_pelanggan (optional, max 100)
        if (strlen(trim($row['nama_pelanggan'] ?? '')) > 100) {
            $errors[] = 'nama_pelanggan maksimal 100 karakter.';
        }

        return $errors;
    }

    // ---------------------------------------------------------------------------
    // Import (persists valid rows)
    // ---------------------------------------------------------------------------

    public function import(array $validRows, User $user): array
    {
        // Re-load products — might have changed since preview
        $productMap = Product::ownedBy($user->id)
            ->whereNull('deleted_at')
            ->get()
            ->keyBy(fn ($p) => strtolower(trim($p->name)));

        $imported = 0;
        $skipped = [];

        DB::transaction(function () use ($validRows, $user, $productMap, &$imported, &$skipped) {
            foreach ($validRows as $row) {
                $product = $productMap[$row['product_name_lower']] ?? null;

                if (! $product) {
                    $skipped[] = [
                        'row' => $row['row_number'],
                        'reason' => 'Produk tidak ditemukan (mungkin sudah dihapus sejak preview).',
                    ];

                    continue;
                }

                $unitPrice = (float) $product->price;  // snapshot from DB, not CSV
                $subtotal = round($row['qty'] * $unitPrice, 2);

                $transaction = $user->transactions()->create([
                    'customer_name' => $row['customer_name'],
                    'transaction_date' => $row['transaction_date'],
                    'payment_method' => $row['payment_method'],
                    'status' => 'success',
                    'total_amount' => $subtotal,
                ]);

                $transaction->items()->create([
                    'product_id' => $product->id,
                    'product_name' => $product->name,  // snapshot
                    'qty' => $row['qty'],
                    'unit_price' => $unitPrice,
                    'subtotal' => $subtotal,
                ]);

                $product->decrement('current_stock', $row['qty']);

                $imported++;
            }
        });

        return ['imported' => $imported, 'skipped' => $skipped];
    }

    // ---------------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------------

    private function buildDupeSet(int $userId): array
    {
        return DB::table('transaction_items')
            ->join('transactions', 'transactions.id', '=', 'transaction_items.transaction_id')
            ->where('transactions.user_id', $userId)
            ->whereNull('transactions.deleted_at')
            ->select(
                DB::raw('DATE(transactions.transaction_date) as txn_date'),
                DB::raw('LOWER(transaction_items.product_name) as product_name'),
                'transaction_items.qty'
            )
            ->get()
            ->mapWithKeys(fn ($r) => ["{$r->txn_date}|{$r->product_name}|{$r->qty}" => true])
            ->toArray();
    }
}
