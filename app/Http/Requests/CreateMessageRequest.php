<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class CreateMessageRequest extends FormRequest
{
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

            'attachments.*' => [
                'file',
                'max:5120', // 5 MB in KB
                'mimes:jpg,jpeg,png,webp,mp3,wav,m4a,ogg,pdf,doc,docx,txt,csv,xlsx',
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
            'attachments.*.mimes' => 'Only JPG, JPEG, PNG, WEBP, MP3, WAV, M4A, OGG, PDF, DOC, DOCX, TXT, CSV, and XLSX files are allowed.',
            'attachments.*.max' => 'Each attachment must not exceed 5 MB.',

        ];
    }
}
