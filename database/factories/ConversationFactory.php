<?php

namespace Database\Factories;

use App\Models\Conversation;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Conversation>
 */
class ConversationFactory extends Factory
{
    protected $model = Conversation::class;

    public function definition(): array
    {
        return [
            'uuid' => (string) Str::uuid(),
            'student_id' => User::factory()->student(),
            'counselor_id' => User::factory()->counselor(),
        ];
    }
}
