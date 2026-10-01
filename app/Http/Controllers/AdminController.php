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
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
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
    public function accounts()
    {
        return Inertia::render('admin/accounts/index');
    }

    public function storeAccount(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'name' => 'required|string|max:50',
            'avatar' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        $avatarPath = $request->hasFile('avatar')
            ? $request->file('avatar')->store('avatars', 'public')
            : null;

        User::create([
            'uuid' => Str::uuid(),
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => UserRole::ADMIN,
            'name' => $validated['name'],
            'avatar' => $avatarPath,
            'pseudonym' => 'Admin',
            'is_anonymous' => false,
            'email_verified_at' => now(),
        ]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Account Created Successfully',
        ]);

        return redirect()->back();
    }

    public function updateUser(Request $request, User $user)
    {
        $role = $user->role instanceof UserRole ? $user->role : UserRole::tryFrom((string) $user->role);
        $isAdmin = $role === UserRole::ADMIN;

        // Validation stays outside the try so errors reach the form fields
        $validated = $request->validate([
            'name' => [$isAdmin ? 'nullable' : 'required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => ['nullable', 'string', 'min:8'],
            'avatar' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp', 'max:2048'],
        ]);

        try {
            $attributes = ['email' => $validated['email']];

            if (array_key_exists('name', $validated)) {
                $attributes['name'] = $validated['name'];
            }

            if (!empty($validated['password'])) {
                $attributes['password'] = Hash::make($validated['password']);
            }

            if ($request->hasFile('avatar')) {
                if ($user->avatar) {
                    Storage::disk('public')->delete($user->avatar);
                }

                $attributes['avatar'] = $request->file('avatar')->store('avatars', 'public');
            }

            $user->update($attributes);

            Inertia::flash('toast', [
                'type' => 'success',
                'message' => 'User Updated',
            ]);
        } catch (\Throwable $th) {
            Log::error('Error updating user ' . $th->getMessage());

            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Something went wrong updating the user.',
            ]);
        }

        return redirect()->back();
    }
}
