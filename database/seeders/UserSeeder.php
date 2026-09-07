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

        $admin1 = 'haroldlyndon.cruz@chmsu.edu.ph';
        $admin2 = 'admin@gmail.com';

        $admins = [
            [
                'uuid' => Str::uuid(),
                'pseudonym' => 'Admin',
                'name' => 'Harold Lyndon Cruz',
                'email' => $admin1,
                'password' => Hash::make('password123'),
                'role' => UserRole::ADMIN,
            ],
            [
                'uuid' => Str::uuid(),
                'pseudonym' => 'Admin',
                'name' => 'Admin',
                'email' => $admin2,
                'password' => Hash::make('password123'),
                'role' => UserRole::ADMIN,
            ],
        ];

        foreach ($admins as $admin) {
            User::create($admin);
        }


    }
}
