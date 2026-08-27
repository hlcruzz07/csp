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

        $adminEmail = 'haroldlyndon.cruz@chmsu.edu.ph';

        // User::where('role', UserRole::ADMIN)
        //     ->where('email', '!=', $adminEmail)
        //     ->delete();

        User::updateOrCreate(['email' => $adminEmail], [
            'uuid' => (string) Str::uuid(),
            'name' => 'Harold Cruz',
            'pseudonym' => 'Donny Pangilinan',
            'password' => Hash::make('password123'),
            'is_anonymous' => false,
            'role' => UserRole::ADMIN,
        ]);

        // $collegeIds = College::pluck('id');

        // if ($collegeIds->isEmpty()) {
        //     throw new \RuntimeException('Seed colleges before seeding users.');
        // }

        // for ($i = 1; $i <= 1; $i++) {
        //     $counselor = User::factory()->counselor()->create([
        //         'password' => Hash::make('password123'),
        //     ]);

        //     UserCollege::create([
        //         'user_id' => $counselor->id,
        //         'college_id' => $collegeIds->random(),
        //     ]);
        // }

        // User::where('role', UserRole::COUNSELOR)
        //     ->doesntHave('assignedCollege')
        //     ->get()
        //     ->each(fn(User $counselor) => UserCollege::create([
        //         'user_id' => $counselor->id,
        //         'college_id' => $collegeIds->random(),
        //     ]));

        // User::factory()
        //     ->student()
        //     ->count(15)
        //     ->create(['password' => Hash::make('password123')]);

        // $ako = User::updateOrCreate(['email' => 'harold.cruz0407@gmail.com'], [
        //     'uuid' => (string) Str::uuid(),
        //     'name' => 'Donnie',
        //     'pseudonym' => 'Donny Pangilinan',
        //     'password' => Hash::make('password123'),
        //     'is_anonymous' => false,
        //     'role' => UserRole::COUNSELOR,
        // ]);

        // $ako->userCollege()->create([
        //     'college_id' => $collegeIds->random(),
        // ]);
    }
}
