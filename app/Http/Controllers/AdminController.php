<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\College;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
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

            'collegeDistribution' => College::query()
                ->withCount('userColleges')
                ->orderByDesc('user_colleges_count')
                ->take(6)
                ->get()
                ->map(fn(College $college) => [
                    'college' => $college->code ?: $college->name,
                    'students' => $college->user_colleges_count,
                ])
                ->values(),

            // Message activity for the last 14 days. Swap ->count() logic
            // if you'd rather pull this with a single grouped query.
            'messageActivity' => collect(range(13, 0))
                ->map(function (int $daysAgo) {
                    $date = CarbonImmutable::today()->subDays($daysAgo);

                    return [
                        'date' => $date->format('M j'),
                        'messages' => Message::whereDate('created_at', $date)->count(),
                    ];
                })
                ->values(),

            'recentConversations' => Conversation::query()
                ->with([
                    'student:id,name,pseudonym,is_anonymous',
                    'counselor:id,name',
                    'latestMessage:messages.id,messages.conversation_id,messages.content,messages.created_at',
                ])
                ->latest('updated_at')
                ->take(5)
                ->get()
                ->map(fn(Conversation $conversation) => [
                    'id' => $conversation->id,
                    'student' => $conversation->student?->is_anonymous
                        ? $conversation->student?->pseudonym
                        : $conversation->student?->name,
                    'counselor' => $conversation->counselor?->name,
                    'preview' => str($conversation->latestMessage?->content ?? 'No messages yet')
                        ->limit(64)
                        ->toString(),
                    'updatedAt' => $conversation->updated_at?->diffForHumans(),
                ])
                ->values(),
        ]);
    }

    public function counselors()
    {
        return Inertia::render('admin/counselors/index');
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
