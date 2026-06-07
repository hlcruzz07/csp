<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
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
        $users = [];

        for ($i = 0; $i < 200; $i++) {
            $users[] = [
                'uuid' => (string) Str::uuid(),
                'name' => fake()->name(),
                'pseudonym' => fake()->userName(),
                'email' => fake()->unique()->safeEmail(),
                'password' => Hash::make('password123'),
                'is_anonymous' => fake()->boolean(),
                'role' => fake()->randomElement([
                    UserRole::STUDENT,
                    UserRole::COUNSELOR
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        $users[] = [
            'uuid' => (string) Str::uuid(),
            'name' => 'Harold Cruz',
            'pseudonym' => 'Donny Pangilinan',
            'email' => 'haroldlyndon.cruz@chmsu.edu.ph',
            'password' => Hash::make('password123'),
            'is_anonymous' => false,
            'role' => UserRole::ADMIN,
            'created_at' => now(),
            'updated_at' => now(),
        ];

        User::insert($users);
    }
}
