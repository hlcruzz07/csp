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
            'content'       => ['required_without:attachments', 'nullable', 'string', 'max:5000'],
            'category_id'   => ['nullable', 'exists:categories,id'],
            'is_structured' => ['nullable', 'boolean'],
            'attachments'   => ['nullable', 'array'],
            'attachments.*' => ['image', 'mimes:jpg,jpeg,png'],
        ];
    }

    public function messages(): array
    {
        return [
            'content.required_without' => 'Message content is required when no attachments are provided.',
            'content.string'           => 'Message content must be a valid text.',
            'content.max'              => 'Message content must not exceed 5000 characters.',
            'category_id.exists'       => 'The selected category is invalid.',
            'is_structured.boolean'    => 'Invalid value for structured flag.',
            'attachments.array'        => 'Attachments must be a valid array of files.',
        ];
    }
}
