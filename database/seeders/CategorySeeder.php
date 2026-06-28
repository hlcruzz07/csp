<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Academic',
                'slug' => 'academic',
                'description' => 'Concerns related to grades, coursework, examinations, attendance, and academic performance.',
            ],
            [
                'name' => 'Personal',
                'slug' => 'personal',
                'description' => 'Personal growth, self-esteem, decision-making, and life challenges.',
            ],
            [
                'name' => 'Emotional',
                'slug' => 'emotional',
                'description' => 'Stress, anxiety, sadness, emotional regulation, and mental well-being.',
            ],
            [
                'name' => 'Financial',
                'slug' => 'financial',
                'description' => 'Tuition, scholarships, allowances, employment, and financial difficulties.',
            ],
            [
                'name' => 'Family',
                'slug' => 'family',
                'description' => 'Family conflicts, parenting issues, separation, and household relationships.',
            ],
            [
                'name' => 'Home Issues',
                'slug' => 'home_issues',
                'description' => 'Problems within the home environment affecting student well-being.',
            ],
            [
                'name' => 'Relationship',
                'slug' => 'relationship',
                'description' => 'Romantic relationships, breakups, and interpersonal concerns.',
            ],
            [
                'name' => 'Peer & Social',
                'slug' => 'peer_social',
                'description' => 'Friendships, social interactions, bullying, and peer pressure.',
            ],
            [
                'name' => 'Career',
                'slug' => 'career',
                'description' => 'Career planning, internships, employment, and future goals.',
            ],
            [
                'name' => 'Behavioral',
                'slug' => 'behavioral',
                'description' => 'Behavioral concerns, habits, discipline, and conduct.',
            ],
            [
                'name' => 'Health & Wellness',
                'slug' => 'health_wellness',
                'description' => 'Physical health, lifestyle, sleep, and wellness concerns.',
            ],
            [
                'name' => 'Adjustment & Transition',
                'slug' => 'adjustment_transition',
                'description' => 'Adjusting to college life, new environments, or major life changes.',
            ],
            [
                'name' => 'Grief & Loss',
                'slug' => 'grief_loss',
                'description' => 'Bereavement, loss of loved ones, and coping with grief.',
            ],
            [
                'name' => 'Harassment & Abuse',
                'slug' => 'harassment_abuse',
                'description' => 'Reports or concerns involving harassment, abuse, or discrimination.',
            ],
            [
                'name' => 'Substance Use',
                'slug' => 'substance_use',
                'description' => 'Concerns related to alcohol, smoking, or substance misuse.',
            ],
            [
                'name' => 'Others',
                'slug' => 'others',
                'description' => 'Concerns that do not fit into any predefined category.',
            ],
        ];

        foreach ($categories as $item) {
            DB::table('categories')->insert([
                'name' => $item['name'],
                'slug' => $item['slug'],
                'description' => $item['description'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
