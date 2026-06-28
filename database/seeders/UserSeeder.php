<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\College;
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
        // for ($i = 0; $i < 200; $i++) {

        //     $role = fake()->randomElement([
        //         UserRole::STUDENT,
        //         UserRole::COUNSELOR,
        //     ]);

        //     $user = User::create([
        //         'uuid' => (string) Str::uuid(),
        //         'name' => fake()->name(),
        //         'pseudonym' => fake()->userName(),
        //         'email' => fake()->unique()->safeEmail(),
        //         'password' => Hash::make('password123'),
        //         'is_anonymous' => $role === UserRole::COUNSELOR,
        //         'role' => $role,
        //     ]);




        $admin =  User::create([
            'uuid' => (string) Str::uuid(),
            'name' => 'Harold Cruz',
            'pseudonym' => 'Donny Pangilinan',
            'email' => 'haroldlyndon.cruz@chmsu.edu.ph',
            'password' => Hash::make('password123'),
            'is_anonymous' => false,
            'role' => UserRole::ADMIN,
        ]);

        // Existing college ids to randomly assign to counselors via the
        // user_colleges pivot table. Falls back to skipping the pivot
        // row if no colleges have been seeded yet.
        $collegeIds = College::pluck('id');

        for ($i = 1; $i <= 5; $i++) {
            $counselor = User::create([
                'uuid' => (string) Str::uuid(),
                'name' => fake()->name(),
                'pseudonym' => fake()->userName(),
                'email' => "counselor{$i}@gmail.com",
                'password' => Hash::make('password123'),
                'is_anonymous' => true,
                'role' => UserRole::COUNSELOR,
            ]);

            if ($collegeIds->isNotEmpty()) {
                UserCollege::create([
                    'user_id' => $counselor->id,
                    'college_id' => $collegeIds->random(),
                ]);
            }
        }

        // Students with no assigned college — no UserCollege row created.
        for ($i = 1; $i <= 2; $i++) {
            User::create([
                'uuid' => (string) Str::uuid(),
                'name' => fake()->name(),
                'pseudonym' => fake()->userName(),
                'email' => "student{$i}@gmail.com",
                'password' => Hash::make('password123'),
                'is_anonymous' => false,
                'role' => UserRole::STUDENT,
            ]);
        }
    }
}
