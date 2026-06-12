<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Http\UploadedFile;

/**
 * Validates actual MIME type of import files (CSV / XLSX) by reading file
 * content via finfo — not just trusting the client-supplied extension.
 */
class SafeImportMime implements ValidationRule
{
    private const CSV_MIMES = [
        'text/plain',
        'text/csv',
        'application/csv',
        'text/comma-separated-values',
    ];

    // xlsx is a ZIP archive internally; finfo reports one of these
    private const XLSX_MIMES = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/zip',
        'application/x-zip',
        'application/x-zip-compressed',
        'application/octet-stream',
    ];

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! $value instanceof UploadedFile) {
            $fail('File tidak valid.');

            return;
        }

        $ext = strtolower($value->getClientOriginalExtension());

        if (! in_array($ext, ['csv', 'xlsx'], true)) {
            $fail('Format file harus CSV (.csv) atau Excel (.xlsx).');

            return;
        }

        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $value->getRealPath());
        finfo_close($finfo);

        if ($ext === 'csv' && ! in_array($mimeType, self::CSV_MIMES, true)) {
            $fail('File CSV mengandung konten biner — pastikan file benar-benar berupa teks CSV.');

            return;
        }

        if ($ext === 'xlsx' && ! in_array($mimeType, self::XLSX_MIMES, true)) {
            $fail('File XLSX mengandung konten yang tidak valid.');
        }
    }
}
