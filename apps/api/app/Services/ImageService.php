<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ImageService
{
    private const MAX_WIDTH = 800;

    private const WEBP_QUALITY = 85;

    private const DISK = 'public';

    /**
     * Converts uploaded image to WebP, resizes to max 800px wide, stores it,
     * and returns the storage-relative path (e.g. "products/abc123.webp").
     */
    public function store(UploadedFile $file, int $userId): string
    {
        $src = imagecreatefromstring(file_get_contents($file->getRealPath()));

        if ($src === false) {
            abort(422, 'File gambar tidak dapat diproses.');
        }

        [$origWidth, $origHeight] = getimagesize($file->getRealPath());

        if ($origWidth > self::MAX_WIDTH) {
            $newHeight = (int) round($origHeight * self::MAX_WIDTH / $origWidth);
            $dst = imagescale($src, self::MAX_WIDTH, $newHeight, IMG_BILINEAR_FIXED);
        } else {
            $dst = $src;
        }

        $tmp = tempnam(sys_get_temp_dir(), 'umkm_img_');
        imagewebp($dst, $tmp, self::WEBP_QUALITY);

        if ($dst !== $src) {
            imagedestroy($dst);
        }
        imagedestroy($src);

        $filename = $userId.'_'.Str::random(20).'.webp';
        $storagePath = "products/{$filename}";

        Storage::disk(self::DISK)->put($storagePath, file_get_contents($tmp));
        unlink($tmp);

        return $storagePath;
    }

    public function delete(?string $storagePath): void
    {
        if ($storagePath) {
            Storage::disk(self::DISK)->delete($storagePath);
        }
    }
}
