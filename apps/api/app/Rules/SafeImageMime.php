<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Http\UploadedFile;

/**
 * Validates actual MIME type from file content (via finfo), not just the
 * client-supplied extension or Content-Type header. Prevents scripts disguised
 * as images from being accepted.
 */
class SafeImageMime implements ValidationRule
{
    private const ALLOWED_MIMES = [
        'image/jpeg',
        'image/png',
        'image/webp',
    ];

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! $value instanceof UploadedFile) {
            $fail('File tidak valid.');

            return;
        }

        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $value->getRealPath());
        finfo_close($finfo);

        if (! in_array($mimeType, self::ALLOWED_MIMES, true)) {
            $fail('File harus berupa gambar nyata (JPEG, PNG, atau WebP). Konten file tidak sesuai.');
        }
    }
}
