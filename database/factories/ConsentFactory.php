<?php

namespace Database\Factories;

use App\Models\Consent;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Consent>
 */
class ConsentFactory extends Factory
{
    protected $model = Consent::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'consent_given' => true,
        ];
    }

    public function declined(): static
    {
        return $this->state(fn(array $attributes) => [
            'consent_given' => false,
        ]);
    }
}
