<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class CreateMessageRequest extends FormRequest
{
    protected const VIDEO_EXTENSIONS = ['mp4', 'mov', 'webm', 'mkv', 'avi', 'm4v'];

    protected const ALLOWED_EXTENSIONS = [
        'jpg',
        'jpeg',
        'png',
        'webp',
        'mp4',
        'mov',
        'webm',
        'mkv',
        'avi',
        'm4v',
        'mp3',
        'wav',
        'm4a',
        'ogg',
        'pdf',
        'doc',
        'docx',
        'txt',
        'csv',
        'xlsx',
    ];

    protected const DEFAULT_MAX_KB = 5120;   // 5 MB
    protected const VIDEO_MAX_KB = 51200;    // 50 MB

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {

        return [
            'content' => [
                'required_without:attachments',
                'nullable',
                'string',
                'max:5000',
            ],

            'category_id' => [
                'nullable',
                'exists:categories,id',
            ],

            'conversation_uuid' => 'required|uuid|exists:conversations,uuid',
            'is_structured' => [
                'nullable',
                'boolean',
            ],

            'attachments' => [
                'nullable',
                'array',
                'max:5',
            ],

            /**
             * Video files (especially .mp4/.mov from phones, screen recorders,
             * or re-muxed sources) are frequently mis-sniffed by PHP's fileinfo
             * as application/octet-stream or other generic binary types, which
             * makes Laravel's `mimes` rule unreliable for video specifically.
             * So we validate by file extension here instead of mime content,
             * same as most apps handle video uploads in practice.
             */
            'attachments.*' => [
                'file',
                function ($attribute, $value, $fail) {
                    $extension = strtolower($value->getClientOriginalExtension());

                    if (!in_array($extension, self::ALLOWED_EXTENSIONS, true)) {
                        $fail("The {$attribute} must be a file of type: " . implode(', ', self::ALLOWED_EXTENSIONS) . '.');
                        return;
                    }

                    $isVideo = in_array($extension, self::VIDEO_EXTENSIONS, true);
                    $maxKb = $isVideo ? self::VIDEO_MAX_KB : self::DEFAULT_MAX_KB;

                    if ($value->getSize() > $maxKb * 1024) {
                        $fail("The {$attribute} must not be greater than " . ($maxKb / 1024) . ' MB.');
                    }
                },
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'content.required_without' => 'Message content is required when no attachments are provided.',
            'content.string' => 'Message content must be valid text.',
            'content.max' => 'Message content must not exceed 5,000 characters.',
            'category_id.exists' => 'The selected category is invalid.',
            'is_structured.boolean' => 'Invalid value for the structured flag.',
            'attachments.array' => 'Attachments must be a valid array of files.',
            'attachments.max' => 'You may upload a maximum of 5 attachments.',
            'attachments.*.file' => 'Each attachment must be a valid file.',
        ];
    }
}