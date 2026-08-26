<?php

namespace Database\Factories;

use App\Enums\MessageStatus;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Message>
 */
class MessageFactory extends Factory
{
    protected $model = Message::class;

    public function definition(): array
    {
        return [
            'conversation_id' => Conversation::factory(),
            'sender_id' => User::factory()->student(),
            'category_id' => null,
            'content' => fake()->paragraph(),
            'is_structured' => false,
            'status' => fake()->randomElement(MessageStatus::cases()),
        ];
    }

    public function structured(): static
    {
        return $this->state(fn(array $attributes) => [
            'is_structured' => true,
        ]);
    }

    public function sent(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => MessageStatus::SENT,
        ]);
    }

    public function seen(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => MessageStatus::SEEN,
        ]);
    }

    public function responded(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => MessageStatus::RESPONDED,
        ]);
    }
}
