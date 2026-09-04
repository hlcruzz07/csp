<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\College;
use App\Models\User;
use App\Models\UserCollege;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DummyStudentCounselorSeeder extends Seeder
{
    public function run(): void
    {
        $colleges = College::query()->pluck('id', 'code');

        if ($colleges->isEmpty()) {
            throw new \RuntimeException('Seed colleges before seeding dummy users.');
        }

        $users = [
            ['name' => 'Dummy Counselor One', 'email' => 'dummy.counselor1@example.com', 'role' => UserRole::COUNSELOR, 'college' => 'CCS'],
            ['name' => 'Dummy Counselor Two', 'email' => 'dummy.counselor2@example.com', 'role' => UserRole::COUNSELOR, 'college' => 'COE'],
            ['name' => 'Dummy Counselor Three', 'email' => 'dummy.counselor3@example.com', 'role' => UserRole::COUNSELOR, 'college' => 'CENG'],
            ['name' => 'Dummy Student One', 'email' => 'dummy.student1@example.com', 'role' => UserRole::STUDENT, 'college' => 'CCS'],
            ['name' => 'Dummy Student Two', 'email' => 'dummy.student2@example.com', 'role' => UserRole::STUDENT, 'college' => 'COE'],
            ['name' => 'Dummy Student Three', 'email' => 'dummy.student3@example.com', 'role' => UserRole::STUDENT, 'college' => 'CENG'],
            ['name' => 'Dummy Student Four', 'email' => 'dummy.student4@example.com', 'role' => UserRole::STUDENT, 'college' => 'CAS'],
            ['name' => 'Dummy Student Five', 'email' => 'dummy.student5@example.com', 'role' => UserRole::STUDENT, 'college' => 'CBMA'],
            ['name' => 'Dummy Student Six', 'email' => 'dummy.student6@example.com', 'role' => UserRole::STUDENT, 'college' => 'CCJ'],
        ];

        foreach ($users as $userData) {
            $collegeId = $colleges->get($userData['college']);

            if ($collegeId === null) {
                throw new \RuntimeException("College [{$userData['college']}] does not exist.");
            }

            $user = User::updateOrCreate(
                ['email' => $userData['email']],
                [
                    'uuid' => (string) Str::uuid(),
                    'name' => $userData['name'],
                    'pseudonym' => Str::slug($userData['name']),
                    'password' => Hash::make('password123'),
                    'is_anonymous' => $userData['role'] === UserRole::COUNSELOR,
                    'role' => $userData['role'],
                ],
            );

            UserCollege::updateOrCreate(
                ['user_id' => $user->id],
                ['college_id' => $collegeId],
            );
        }
    }
}
