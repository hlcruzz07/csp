<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CollegeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $colleges = [
            ['code' => 'CAS', 'name' => 'College of Arts and Sciences'],
            ['code' => 'CBMA', 'name' => 'College of Business Management and Accountancy'],
            ['code' => 'CCS', 'name' => 'College of Computer Studies'],
            ['code' => 'CCJ', 'name' => 'College of Criminal Justice'],
            ['code' => 'COE', 'name' => 'College of Education'],
            ['code' => 'CENG', 'name' => 'College of Engineering'],
            ['code' => 'COF', 'name' => 'College of Fisheries'],
            ['code' => 'CIT', 'name' => 'College of Industrial Technology'],
        ];

        foreach ($colleges as $college) {
            DB::table('colleges')->updateOrInsert(
                ['code' => $college['code']],
                [
                    'name' => $college['name'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }
    }
}
