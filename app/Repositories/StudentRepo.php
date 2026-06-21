<?php

namespace App\Repositories;

use App\Models\Consent;
use App\Models\Conversation;
use App\Models\User;
use App\Models\UserCollege;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class StudentRepo
{
    /**
     * Create a new class instance.
     */
    public function __construct(protected User $model, protected Consent $consent, protected UserCollege $userCollege, protected Conversation $conversation)
    {
        //
    }

    public function isCompleted(): bool
    {
        return $this->consent
            ->where('user_id', auth()->id())
            ->exists()
            &&
            $this->userCollege
            ->where('user_id', auth()->id())
            ->exists();
    }

    public function setCollege(int $college_id)
    {
        return $this->userCollege->create([
            'user_id' => auth()->id(),
            'college_id' => $college_id
        ]);
    }

    public function setConsent()
    {
        return $this->consent->create([
            'user_id' => auth()->id(),
        ]);
    }

    public function setIsAnonymous(bool $is_anonymous = true)
    {
        return $this->model->update([
            'is_anonymous' => $is_anonymous
        ]);
    }

    public function hasConversation(): bool
    {
        return $this->conversation->where('student_id', auth()->id())->exists();
    }

    public function getConversation()
    {
        return $this->model->with('');
    }

    public function updateProfile(array $data, int $id)
    {
        $student = $this->model->findOrFail($id);

        $payload = [
            'pseudonym' => $data['pseudonym'],
            'name' => $data['name'],
            'email' => $data['email'],
            'is_anonymous' => (bool) $data['is_anonymous'],
        ];

        if (!empty($data['avatar'])) {
            // Delete old avatar if it exists
            if ($student->avatar) {
                Storage::disk('public')->delete($student->avatar);
            }

            $payload['avatar'] = $data['avatar']->store(
                'avatars',
                'public'
            );
        }

        if (!empty($data['new_password'])) {
            $payload['password'] = Hash::make($data['new_password']);
        }

        return $student->update($payload);
    }
}
