<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use App\Models\UserCollege;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        for ($i = 0; $i < 200; $i++) {

            $role = fake()->randomElement([
                UserRole::STUDENT,
                UserRole::COUNSELOR,
            ]);

            $user = User::create([
                'uuid' => (string) Str::uuid(),
                'name' => fake()->name(),
                'pseudonym' => fake()->userName(),
                'email' => fake()->unique()->safeEmail(),
                'password' => Hash::make('password123'),
                'is_anonymous' => $role === UserRole::COUNSELOR,
                'role' => $role,
            ]);

            UserCollege::create([
                'user_id' => $user->id,
                'college_id' => fake()->numberBetween(1, 8),
            ]);
        }

        User::create([
            'uuid' => (string) Str::uuid(),
            'name' => 'Harold Cruz',
            'pseudonym' => 'Donny Pangilinan',
            'email' => 'haroldlyndon.cruz@chmsu.edu.ph',
            'password' => Hash::make('password123'),
            'is_anonymous' => false,
            'role' => UserRole::ADMIN,
        ]);
    }
}
