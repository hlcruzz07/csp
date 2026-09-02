<?php

namespace App\Http\Controllers;

use App\Enums\NotificationType;
use App\Enums\UserRole;
use App\Enums\MessageStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateStudentProfileRequest;
use App\Models\Attachment;
use App\Models\College;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use App\Notifications\SendNotification;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class AdminController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {

        $studentCount = User::where('role', UserRole::STUDENT)->count();
        $counselorCount = User::where('role', UserRole::COUNSELOR)->count();

        return Inertia::render('admin/dashboard', [
            'stats' => [
                'students' => $studentCount,
                'counselors' => $counselorCount,
                'colleges' => College::count(),
                'conversations' => Conversation::count(),

            ],

            'roleDistribution' => [
                ['role' => 'students', 'label' => 'Students', 'value' => $studentCount],
                ['role' => 'counselors', 'label' => 'Counselors', 'value' => $counselorCount],
            ],

            'messageActivity' => collect(range(13, 0))
                ->map(function (int $daysAgo) {
                    $date = CarbonImmutable::today()->subDays($daysAgo);

                    return [
                        'date' => $date->format('M j'),
                        'messages' => Message::whereDate('created_at', $date)->count(),
                    ];
                })
                ->values(),

            'conversationActivity' => collect(range(13, 0))
                ->map(function (int $daysAgo) {
                    $date = CarbonImmutable::today()->subDays($daysAgo);

                    return [
                        'date' => $date->format('M j'),
                        'conversations' => Conversation::whereDate('created_at', $date)->count(),
                    ];
                })
                ->values(),
        ]);
    }

    public function counselors()
    {
        $colleges = College::query()
            ->withCount([
                'userColleges as counselor_count' => function ($query) {
                    $query->whereHas('user', function ($q) {
                        $q->where('role', UserRole::COUNSELOR->value);
                    });
                }
            ])
            ->get();

        return Inertia::render('admin/counselors/index', [
            'colleges' => $colleges,
        ]);
    }

    public function createCounselor(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:100',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'assigned_college_id' => 'exists:colleges,id|string'
        ]);

        $pseudonym = class_exists(\Faker\Factory::class)
            ? fake()->userName()
            : 'counselor_' . Str::lower(Str::random(8));

        $counselor = User::create([
            'avatar' => null,
            'email' => $data['email'],
            'pseudonym' => $pseudonym,
            'name' => $data['name'],
            'is_anonymous' => false,
            'password' => Hash::make($data['password']),
            'email_verified_at' => now(),
            'uuid' => Str::uuid(),
            'role' => UserRole::COUNSELOR
        ]);


        $counselor->userCollege()->create([
            'college_id' => (int) $data['assigned_college_id']
        ]);

        $counselor->notify(new SendNotification(
            NotificationType::WELCOME,
            ['name' => $counselor->name],
        ));

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Counselor Added Successfully',
        ]);

        return redirect()->back();
    }

    public function updateCounselor(UpdateStudentProfileRequest $request, int $id)
    {
        $data = $request->all();
        $counselor = User::findOrFail($id);

        $payload = [
            'name' => $data['name'],
            'email' => $data['email'],
        ];

        if (!empty($data['new_password'])) {
            $payload['password'] = Hash::make($data['new_password']);
        }
        $counselor->update($payload);

        $counselor->userCollege()->update([
            'college_id' => (int) $data['assigned_college_id']
        ]);

        $counselor->notify(new SendNotification(
            NotificationType::ACCOUNT_UPDATED,
            ['name' => $counselor->name],
        ));

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Counselor Profile Updated',
        ]);

        return redirect()->back();
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
