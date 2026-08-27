<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules, ProfileValidationRules;

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        Validator::make($input, [
            ...$this->profileRules(),
            'password' => $this->passwordRules(),
        ])->validate();

        $pseudonym = class_exists(\Faker\Factory::class)
            ? fake()->userName()
            : 'student_' . Str::lower(Str::random(8));

        return User::create([
            'uuid' => (string) Str::uuid(),
            'name' => $input['name'],
            'pseudonym' => $pseudonym,
            'email' => $input['email'],
            'password' => $input['password'],
            'role' => UserRole::STUDENT,
        ]);
    }
}
