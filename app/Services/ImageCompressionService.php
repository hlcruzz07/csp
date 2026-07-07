<?php

namespace App\Services;

use Exception;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * ImageCompressionService
 *
 * Compresses uploaded image files using PHP's built-in GD extension
 * (no third-party packages required) and saves them to local disk
 * storage (storage/app/public/... by default).
 */
class ImageCompressionService
{
    /**
     * JPEG/WEBP quality (0-100). Lower = smaller file, more compression.
     */
    protected int $quality;

    /**
     * PNG compression level (0-9). Higher = smaller file, more compression.
     */
    protected int $pngCompression;

    /**
     * Disk to save compressed images to (config/filesystems.php).
     */
    protected string $disk;

    /**
     * Default subfolder inside the disk to store compressed images.
     * Can be overridden per-call via compress()/compressMany().
     */
    protected string $folder;

    public function __construct(
        int $quality = 75,
        int $pngCompression = 6,
        string $disk = 'public',
        string $folder = 'attachments'
    ) {
        if (!extension_loaded('gd')) {
            throw new Exception('The GD extension is required but is not enabled on this server.');
        }

        $this->quality = max(0, min(100, $quality));
        $this->pngCompression = max(0, min(9, $pngCompression));
        $this->disk = $disk;
        $this->folder = trim($folder, '/');
    }

    /**
     * Compress a single uploaded file and save it to disk.
     *
     * @param  UploadedFile  $file
     * @param  string|null   $folder  Optional override for the destination folder.
     *                                 Falls back to the constructor's default folder if null.
     * @return array{
     *     path: string,
     *     full_path: string,
     *     url: string,
     *     original_size: int,
     *     compressed_size: int,
     *     saved_percent: float
     * }
     *
     * @throws Exception
     */
    public function compress(UploadedFile $file, ?string $folder = null): array
    {
        if (!$file->isValid() || !$file->getRealPath() || !is_readable($file->getRealPath())) {
            throw new Exception(
                'Uploaded file is invalid or unreadable: ' . ($file->getErrorMessage() ?: 'unknown upload error')
            );
        }

        $mimeType = $file->getMimeType();
        $mimeType = $file->getMimeType();
        $originalSize = $file->getSize();
        $sourcePath = $file->getRealPath();

        $image = $this->createImageFromFile($sourcePath, $mimeType);

        // Preserve transparency for PNG/WEBP
        imagesavealpha($image, true);

        $targetFolder = $folder !== null ? trim($folder, '/') : $this->folder;

        $filename = $this->generateFilename($file, $mimeType);
        $relativePath = $targetFolder . '/' . $filename;

        $diskPath = storage_path('app/public/' . $relativePath);
        $this->ensureDirectoryExists(dirname($diskPath));

        $this->saveImage($image, $diskPath, $mimeType);

        imagedestroy($image);

        $compressedSize = filesize($diskPath);

        return [
            'path' => $relativePath,
            'full_path' => $diskPath,
            'url' => asset('storage/' . $relativePath),
            'original_size' => $originalSize,
            'compressed_size' => $compressedSize,
            'saved_percent' => $originalSize > 0
                ? round((($originalSize - $compressedSize) / $originalSize) * 100, 2)
                : 0.0,
        ];
    }

    /**
     * Compress multiple uploaded files at once.
     *
     * Use this directly with $request->file('attachments').
     *
     * @param  UploadedFile[]  $files
     * @param  string|null     $folder  Optional override for the destination folder,
     *                                    applied to every file in this batch.
     * @return array[] List of result arrays, one per file (see compress()).
     */
    public function compressMany(array $files, ?string $folder = null): array
    {
        $results = [];

        foreach ($files as $file) {
            try {
                $results[] = $this->compress($file, $folder);
            } catch (Exception $e) {
                Log::warning('Image compression failed for one file: ' . $e->getMessage());
                $results[] = [
                    'error' => $e->getMessage(),
                    'original_name' => $file->getClientOriginalName(),
                ];
            }
        }

        return $results;
    }

    /**
     * Create a GD image resource from the uploaded file based on mime type.
     */
    protected function createImageFromFile(string $path, ?string $mimeType)
    {
        $image = match ($mimeType) {
            'image/jpeg', 'image/jpg' => imagecreatefromjpeg($path),
            'image/png' => imagecreatefrompng($path),
            'image/webp' => imagecreatefromwebp($path),
            'image/gif' => imagecreatefromgif($path),
            'image/bmp', 'image/x-ms-bmp' => imagecreatefrombmp($path),
            default => throw new Exception("Unsupported image type: {$mimeType}"),
        };

        if ($image === false) {
            throw new Exception("Failed to read image data for type: {$mimeType}");
        }

        return $image;
    }

    /**
     * Save the GD image resource to disk using the right compression
     * function/level for its mime type.
     */
    protected function saveImage($image, string $destinationPath, ?string $mimeType): void
    {
        $saved = match ($mimeType) {
            'image/jpeg', 'image/jpg' => imagejpeg($image, $destinationPath, $this->quality),
            'image/png' => imagepng($image, $destinationPath, $this->pngCompression),
            'image/webp' => imagewebp($image, $destinationPath, $this->quality),
            'image/gif' => imagegif($image, $destinationPath),
            'image/bmp', 'image/x-ms-bmp' => imagebmp($image, $destinationPath),
            default => throw new Exception("Unsupported image type: {$mimeType}"),
        };

        if ($saved === false) {
            throw new Exception("Failed to save compressed image to: {$destinationPath}");
        }
    }

    /**
     * Build a unique, safe filename that keeps the original extension.
     */
    protected function generateFilename(UploadedFile $file, ?string $mimeType): string
    {
        $extension = $file->getClientOriginalExtension() ?: $this->extensionFromMime($mimeType);
        return Str::uuid()->toString() . '.' . $extension;
    }

    protected function extensionFromMime(?string $mimeType): string
    {
        return match ($mimeType) {
            'image/jpeg', 'image/jpg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
            'image/gif' => 'gif',
            'image/bmp', 'image/x-ms-bmp' => 'bmp',
            default => 'jpg',
        };
    }

    protected function ensureDirectoryExists(string $directory): void
    {
        if (!is_dir($directory)) {
            mkdir($directory, 0755, true);
        }
    }
}