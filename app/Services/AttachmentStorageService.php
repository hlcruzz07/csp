<?php

namespace App\Services;

use Exception;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AttachmentStorageService
{
    protected int $quality;
    protected int $pngCompression;
    protected string $disk;
    protected string $folder;

    public function __construct(
        int $quality = 75,
        int $pngCompression = 6,
        string $disk = 'public',
        string $folder = 'attachments'
    ) {
        if (!extension_loaded('gd')) {
            throw new Exception('GD extension is required.');
        }

        $this->quality = max(0, min(100, $quality));
        $this->pngCompression = max(0, min(9, $pngCompression));
        $this->disk = $disk;
        $this->folder = trim($folder, '/');
    }

    /**
     * Store a single attachment.
     *
     * Images are compressed.
     * Everything else is stored normally.
     */
    public function store(UploadedFile $file, ?string $folder = null): array
    {
        if (!$file->isValid()) {
            throw new Exception($file->getErrorMessage());
        }

        $folder = $folder
            ? trim($folder, '/')
            : $this->folder;

        if ($this->isImage($file)) {
            return $this->compressImage($file, $folder);
        }

        return $this->storeFile($file, $folder);
    }

    /**
     * Store multiple attachments.
     */
    public function storeMany(array $files, ?string $folder = null): array
    {
        $results = [];

        foreach ($files as $file) {
            try {
                $results[] = $this->store($file, $folder);
            } catch (Exception $e) {
                Log::warning('Attachment upload failed.', [
                    'file' => $file->getClientOriginalName(),
                    'mime' => $file->getMimeType(),
                    'error' => $e->getMessage(),
                ]);

                $results[] = [
                    'error' => $e->getMessage(),
                    'original_name' => $file->getClientOriginalName(),
                ];
            }
        }

        return $results;
    }

    /**
     * Store non-image files.
     */
    protected function storeFile(UploadedFile $file, string $folder): array
    {
        $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();

        $path = $file->storeAs(
            $folder,
            $filename,
            $this->disk
        );

        return [
            'path' => $path,
            'url' => Storage::disk($this->disk)->url($path),
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'original_size' => $file->getSize(),
            'compressed_size' => $file->getSize(),
            'saved_percent' => 0,
        ];
    }

    /**
     * Compress and store an image.
     */
    protected function compressImage(UploadedFile $file, string $folder): array
    {
        $mime = $file->getMimeType();
        $originalSize = $file->getSize();

        $image = $this->createImage(
            $file->getRealPath(),
            $mime
        );

        imagesavealpha($image, true);

        $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();

        $relativePath = $folder . '/' . $filename;

        $destination = Storage::disk($this->disk)->path($relativePath);

        $this->ensureDirectoryExists(dirname($destination));

        $this->saveImage(
            $image,
            $destination,
            $mime
        );

        imagedestroy($image);

        $compressed = filesize($destination);

        return [
            'path' => $relativePath,
            'url' => Storage::disk($this->disk)->url($relativePath),
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $mime,
            'original_size' => $originalSize,
            'compressed_size' => $compressed,
            'saved_percent' => round(
                (($originalSize - $compressed) / $originalSize) * 100,
                2
            ),
        ];
    }

    protected function isImage(UploadedFile $file): bool
    {
        return str_starts_with(
            $file->getMimeType() ?? '',
            'image/'
        );
    }

    protected function createImage(string $path, string $mime)
    {
        $image = match ($mime) {
            'image/jpeg',
            'image/jpg' => imagecreatefromjpeg($path),

            'image/png' => imagecreatefrompng($path),

            'image/webp' => imagecreatefromwebp($path),

            'image/gif' => imagecreatefromgif($path),

            'image/bmp',
            'image/x-ms-bmp' => imagecreatefrombmp($path),

            default => throw new Exception(
                "Unsupported image type: {$mime}"
            ),
        };

        if (!$image) {
            throw new Exception('Unable to read image.');
        }

        return $image;
    }

    protected function saveImage(
        $image,
        string $destination,
        string $mime
    ): void {

        $saved = match ($mime) {
            'image/jpeg',
            'image/jpg' =>
            imagejpeg(
                $image,
                $destination,
                $this->quality
            ),

            'image/png' =>
            imagepng(
                $image,
                $destination,
                $this->pngCompression
            ),

            'image/webp' =>
            imagewebp(
                $image,
                $destination,
                $this->quality
            ),

            'image/gif' =>
            imagegif(
                $image,
                $destination
            ),

            'image/bmp',
            'image/x-ms-bmp' =>
            imagebmp(
                $image,
                $destination
            ),

            default => false,
        };

        if (!$saved) {
            throw new Exception(
                'Failed saving compressed image.'
            );
        }
    }

    protected function ensureDirectoryExists(string $directory): void
    {
        if (!is_dir($directory)) {
            mkdir($directory, 0755, true);
        }
    }
}