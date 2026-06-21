<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UpdateStudentProfileRequest extends FormRequest
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
        $userId = auth()->user()->id;

        return [
            'avatar' => [
                'nullable',
                'image',
                'mimetypes:image/jpeg,image/png',
                'max:2048',
            ],

            'pseudonym' => [
                'required',
                'string',
                'max:255',
                Rule::unique('users', 'pseudonym')->ignore($userId),
            ],

            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($userId),
            ],

            'is_anonymous' => [
                'required',
                'boolean',
            ],

            'current_password' => [
                'nullable',
                'required_with:new_password',
                function ($attribute, $value, $fail) {
                    if (! Hash::check($value, auth()->user()->password)) {
                        $fail('The current password you entered is incorrect.');
                    }
                },
            ],
            'new_password' => [
                'nullable',
                'required_with:current_password',
                'string',
                'min:8',
                'different:current_password',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'avatar.image' =>
            'Please upload a valid image file.',
            'avatar.mimes' =>
            'The profile picture must be a JPG, JPEG or PNG image.',
            'avatar.max' =>
            'The profile picture must not exceed 2MB.',

            'pseudonym.required' =>
            'Please enter a pseudonym.',
            'pseudonym.max' =>
            'The pseudonym may not exceed 255 characters.',
            'pseudonym.unique' =>
            'This pseudonym is already being used by another user.',

            'name.required' =>
            'Please enter your full name.',
            'name.max' =>
            'Your name may not exceed 255 characters.',

            'email.required' =>
            'Please enter your email address.',
            'email.email' =>
            'Please enter a valid email address.',
            'email.unique' =>
            'This email address is already registered.',

            'current_password.required_with' =>
            'Please enter your current password to change your password.',
            'current_password.current_password' =>
            'The current password you entered is incorrect.',

            'new_password.required_with' =>
            'Please enter a new password.',
            'new_password.min' =>
            'Your new password must be at least 8 characters long.',
            'new_password.different' =>
            'Your new password must be different from your current password.',
        ];
    }

    public function attributes(): array
    {
        return [
            'pseudonym' => 'pseudonym',
            'name' => 'full name',
            'email' => 'email address',
            'current_password' => 'current password',
            'new_password' => 'new password',
        ];
    }
}
