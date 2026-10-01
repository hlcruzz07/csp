<?php

namespace App\Http\Controllers;

use App\Enums\NotificationType;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\CompleteStudentRequest;
use App\Http\Requests\UpdateStudentProfileRequest;
use App\Jobs\FindStudentCounselorJob;
use App\Models\Category;
use App\Models\College;
use App\Models\GuidedPrompt;
use App\Models\User;
use App\Notifications\SendNotification;
use App\Repositories\StudentRepo;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class StudentController extends Controller
{
    public function __construct(protected StudentRepo $studentRepo)
    {
    }
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $colleges = College::query()
            ->withExists([
                'userColleges as has_counselor' => function ($query) {
                    $query->whereHas('user', function ($q) {
                        $q->where('role', UserRole::COUNSELOR->value);
                    });
                },
            ])
            ->get();

        $isCompleted = $this->studentRepo->isCompleted();

        return Inertia::render('student/dashboard', [
            'colleges' => $colleges,
            'isCompleted' => $isCompleted,
            'categories' => Category::all(),
            'guided_prompts' => GuidedPrompt::pluck('name')->toArray()
        ]);
    }

    public function complete(CompleteStudentRequest $request)
    {
        $data = $request->all();

        try {
            DB::transaction(function () use ($data) {
                $this->studentRepo->setConsent();
                $this->studentRepo->setCollege($data['college_id']);
                $this->studentRepo->setIsAnonymous((bool) $data['is_anonymous']);

                FindStudentCounselorJob::dispatch(auth()->id())->afterCommit();
            });


            Inertia::flash('toast', [
                'type' => 'success',
                'message' => 'Student Profile Completed',
            ]);

            return redirect()->back();
        } catch (\Throwable $th) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Something went wrong completing info. Please try again',
            ]);

            Log::error('Error completing student ' . $th->getMessage());

            return redirect()->back();
        }
    }
    public function updateProfile(UpdateStudentProfileRequest $request)
    {
        try {
            // Snapshot BEFORE the update so we can tell what actually changed
            $before = auth()->user()->only(['name', 'pseudonym', 'is_anonymous', 'email', 'password']);

            $student = $this->studentRepo->updateProfile(
                $request->all(),
                auth()->user()->id
            );
            $student->refresh();

            $changes = $this->describeProfileChanges($before, $student);
            $conversation = $student->studentConversation;

            if ($changes !== null && $conversation) {
                $extra = [
                    'conversation_id' => $conversation->id,
                    'conversation_uuid' => $conversation->uuid,
                ];

                // Student: stored only, so it shows in their own chat with no
                // extra toast or push for something they just did themselves.
                $student->notify(new SendNotification(
                    NotificationType::CHAT_UPDATED,
                    [],
                    $extra + ['description' => "You updated your {$changes}."],
                    ['database'],
                ));

                // Counselor: all channels. Use the pseudonym for anonymous students.
                if ($counselor = $conversation->counselor) {
                    $displayName = $student->is_anonymous ? $student->pseudonym : $student->name;

                    $counselor->notify(new SendNotification(
                        NotificationType::CHAT_UPDATED,
                        [],
                        $extra + ['description' => "{$displayName} updated their {$changes}."],
                    ));
                }
            }

            Inertia::flash('toast', [
                'type' => 'success',
                'message' => 'Profile Updated',
            ]);

            return redirect()->back();
        } catch (\Throwable $th) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Something went wrong updating profile.',
            ]);

            Log::error('Error updating profile ' . $th->getMessage());

            return redirect()->back();
        }
    }

    /**
     * Human-readable list of what changed, or null when nothing relevant did.
     * email / password → "account details"; name, pseudonym and
     * is_anonymous are named individually.
     */
    protected function describeProfileChanges(array $before, User $after): ?string
    {
        $parts = [];

        if ($before['name'] !== $after->name) {
            $parts[] = 'name';
        }

        if ($before['pseudonym'] !== $after->pseudonym) {
            $parts[] = 'pseudonym';
        }

        if ((bool) $before['is_anonymous'] !== (bool) $after->is_anonymous) {
            $parts[] = $after->is_anonymous
                ? 'anonymous mode (now on)'
                : 'anonymous mode (now off)';
        }

        if ($before['email'] !== $after->email || $before['password'] !== $after->password) {
            $parts[] = 'account details';
        }

        return $parts === [] ? null : Arr::join($parts, ', ', ' and ');
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
