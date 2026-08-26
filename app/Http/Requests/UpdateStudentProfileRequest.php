<?php

namespace App\Http\Requests;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
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
        $userId = $this->route('id');

        $isStudent = User::where('id', $userId)
            ->where('role', UserRole::STUDENT->value)
            ->exists();

        return [
            'avatar' => [
                'nullable',
                'image',
                'mimetypes:image/jpeg,image/png',
                'max:2048',
            ],

            'pseudonym' => [
                $isStudent ? 'required' : 'nullable',
                'string',
                'max:255',
                Rule::unique('users', 'pseudonym')->ignore($userId ?? auth()->id()),
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
                Rule::unique('users', 'email')->ignore($userId ?? auth()->id()),
            ],

            'is_anonymous' => [
                'required',
                'boolean',
            ],

            'new_password' => [
                'nullable',
                'string',
                'min:8',
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

            'new_password.min' =>
                'Your new password must be at least 8 characters long.',
        ];
    }

    public function attributes(): array
    {
        return [
            'pseudonym' => 'pseudonym',
            'name' => 'full name',
            'email' => 'email address',
            'new_password' => 'new password',
        ];
    }
}
