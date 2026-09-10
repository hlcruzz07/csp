<?php

namespace App\Jobs;

use App\Enums\NotificationType;
use App\Enums\UserRole;
use App\Models\Conversation;
use App\Models\User;
use App\Models\UserCollege;
use App\Notifications\SendNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class FindStudentCounselorJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        protected int $studentId
    ) {
    }

    public function handle(): void
    {
        $student = User::find($this->studentId);

        Log::info('FindStudentCounselorJob: looking up student', ['student_id' => $this->studentId]);

        if (!$student) {
            Log::info('FindStudentCounselorJob: student not found', ['student_id' => $this->studentId]);
            return;
        }

        if ($student->role !== UserRole::STUDENT) {
            Log::info('FindStudentCounselorJob: user is not a student', ['student_id' => $student->id, 'role' => $student->role]);
            return;
        }

        // Student already assigned
        if (Conversation::where('student_id', $student->id)->exists()) {
            return;
        }

        // Order explicitly in case a student ever has more than one college record.
        $studentCollege = UserCollege::where('user_id', $student->id)
            ->latest('id')
            ->first();

        if (!$studentCollege) {
            Log::info('FindStudentCounselorJob: student has no college', ['student_id' => $student->id]);
            return;
        }

        $collegeId = $studentCollege->college_id;

        // Balance load among counselors, but ONLY within the student's selected college.
        // The frontend already guarantees this college has at least one counselor
        // before the student can submit, so no cross-college fallback here by design.
        $loads = DB::table('conversations')
            ->join('user_colleges as uc_students', 'uc_students.user_id', '=', 'conversations.student_id')
            ->where('uc_students.college_id', $collegeId)
            ->selectRaw('conversations.counselor_id, COUNT(conversations.id) as load_count')
            ->groupBy('conversations.counselor_id');

        $counselor = User::query()
            ->select('users.*')
            ->join('user_colleges', 'user_colleges.user_id', '=', 'users.id')
            ->leftJoinSub($loads, 'loads', function ($join) {
                $join->on('loads.counselor_id', '=', 'users.id');
            })
            ->where('users.role', UserRole::COUNSELOR->value)
            ->where('user_colleges.college_id', $collegeId)
            ->orderByRaw('COALESCE(loads.load_count, 0) ASC')
            ->orderBy('users.id')
            ->first();

        if (!$counselor) {
            // Should not normally happen given the frontend guard — if it does,
            // it likely means a data mismatch (e.g. counselor's user_colleges
            // row was removed after the student submitted).
            Log::error('FindStudentCounselorJob: no counselor found for student college despite frontend guard', [
                'student_id' => $student->id,
                'college_id' => $collegeId,
            ]);
            return;
        }

        try {
            $conversation = Conversation::create([
                'uuid' => Str::uuid(),
                'student_id' => $student->id,
                'counselor_id' => $counselor->id,
            ]);

            $counselor->notify(new SendNotification(
                NotificationType::NEW_CHAT_ASSIGNED,
                ['name' => $student->name],
            ));

            Log::info('FindStudentCounselorJob: conversation created', [
                'conversation_id' => $conversation->id,
                'student_id' => $student->id,
                'counselor_id' => $counselor->id,
            ]);
        } catch (\Throwable $e) {
            Log::error('FindStudentCounselorJob: failed to create conversation', ['error' => $e->getMessage()]);
            throw $e;
        }
    }
}