<?php

namespace Database\Seeders;

use App\Models\Attachment;
use App\Models\College;
use App\Models\Consent;
use App\Models\Conversation;
use App\Models\User;
use App\Models\UserCollege;
use Illuminate\Database\Seeder;

class FakeDataSeeder extends Seeder
{
    public function run(): void
    {
        $collegeIds = College::pluck('id');

        if ($collegeIds->isEmpty()) {
            throw new \RuntimeException('Seed colleges before generating fake data.');
        }

        $counselors = User::factory()->counselor()->count(10)->create();
        $students = User::factory()->student()->count(40)->create();

        $this->assignCollegesToCounselors($collegeIds);

        Consent::factory()->count($students->count())->sequence(
            ...$students->map(fn(User $student) => ['user_id' => $student->id])->all(),
        )->create();

        $students->each(function (User $student) use ($counselors): void {
            $counselor = $counselors->random();
            $conversation = Conversation::factory()
                ->for($student, 'student')
                ->for($counselor, 'counselor')
                ->create();

            $messageCount = fake()->numberBetween(2, 8);

            for ($messageIndex = 0; $messageIndex < $messageCount; $messageIndex++) {
                $sender = $messageIndex % 2 === 0 ? $student : $counselor;
                $message = $conversation->messages()->create(
                    \Database\Factories\MessageFactory::new()->make([
                        'sender_id' => $sender->id,
                    ])->getAttributes(),
                );

                if (fake()->boolean(20)) {
                    Attachment::factory()->for($message, 'message')->create();
                }
            }
        });
    }

    /**
     * Guarantee every counselor in the database has exactly one valid
     * college assignment, regardless of which seeder created them or
     * what leftover data exists from a previous run.
     */
    private function assignCollegesToCounselors($collegeIds): void
    {
        // Drop any assignment rows pointing at colleges that no longer
        // exist (stale data from a prior run with different college IDs).
        UserCollege::query()
            ->whereNotIn('college_id', $collegeIds)
            ->delete();

        // Drop duplicate assignment rows, keeping only the first per user,
        // in case a counselor somehow ended up with more than one row.
        // Done in PHP rather than a correlated subquery since MariaDB
        // requires OFFSET to be paired with LIMIT, and this runs at
        // seeder scale anyway (tens of rows).
        $seen = [];
        $toDelete = [];
        UserCollege::query()->orderBy('id')->get(['id', 'user_id'])->each(function ($row) use (&$seen, &$toDelete) {
            if (isset($seen[$row->user_id])) {
                $toDelete[] = $row->id;
            } else {
                $seen[$row->user_id] = true;
            }
        });

        if ($toDelete !== []) {
            UserCollege::query()->whereIn('id', $toDelete)->delete();
        }

        // Now backfill: every counselor without a (valid, unique) row
        // gets assigned to a random college.
        $assignedCounselorIds = UserCollege::query()->pluck('user_id');

        $missingAssignments = User::query()
            ->where('role', 'counselor')
            ->whereNotIn('id', $assignedCounselorIds)
            ->get(['id'])
            ->map(fn(User $counselor) => [
                'user_id' => $counselor->id,
                'college_id' => $collegeIds->random(),
                'created_at' => now(),
                'updated_at' => now(),
            ])
            ->all();

        if ($missingAssignments !== []) {
            UserCollege::insert($missingAssignments);
        }
    }
}