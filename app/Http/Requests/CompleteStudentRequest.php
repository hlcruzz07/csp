<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class CompleteStudentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'college_id' => 'required|numeric',
            'consent_given' => ['accepted'],
            'crisis_given' => ['accepted'],
            'is_anonymous' => 'required',
        ];
    }

    public function messages(): array
    {
        return [
            'college_id.required' => 'Please select a college.',
            'college_id.numeric' => 'The selected college is invalid.',
            'consent_given.accepted' => 'You must agree to the Privacy Policy and Data Usage Guidelines.',
            'crisis_given.accepted' => 'You must acknowledge that this platform is not an emergency or crisis intervention service.',
            'is_anonymous.required' => 'Please specify whether you want to remain anonymous.',
        ];
    }
}
