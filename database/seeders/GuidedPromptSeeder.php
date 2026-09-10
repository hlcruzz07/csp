<?php

namespace Database\Seeders;

use App\Models\GuidedPrompt;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class GuidedPromptSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $prompts = [
            // Opening / Context
            'Can you walk me through what happened?',
            'When did this start?',
            'Where did this take place?',
            'Was anyone else there with you?',

            // Emotional expression
            'How are you feeling right now?',
            "What's the strongest emotion you're feeling?",
            'Have you felt this way before?',
            'How would you rate how intense this feels, 1 to 10?',

            // Thoughts & interpretation
            'What thoughts have been going through your mind?',
            'Why do you think this happened?',
            "Is there something you keep thinking about that won't go away?",

            // Impact
            'How has this been affecting your daily life?',
            "Has this affected how you're eating or sleeping?",
            'Has this changed things with the people around you?',

            // Coping & support
            'What have you done so far to cope with this?',
            'What has helped you before in similar situations?',
            'Is there someone you usually talk to about things like this?',

            // Needs / next steps
            'What do you feel would help you right now?',
            "Is there anything you'd like me to know first?",
            'Is there anything on your mind that feels hard to say?',
        ];

        foreach ($prompts as $prompt) {
            GuidedPrompt::insert([
                'name' => $prompt,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}