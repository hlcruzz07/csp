<?php

namespace Database\Factories;

use App\Models\College;
use App\Models\User;
use App\Models\UserCollege;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<UserCollege>
 */
class UserCollegeFactory extends Factory
{
    protected $model = UserCollege::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'college_id' => fn() => College::query()->inRandomOrder()->value('id'),
        ];
    }
}
