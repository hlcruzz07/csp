<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Enums\UserRole;
use App\Models\College;
use App\Models\Conversation;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CounselorApiController extends Controller
{
    public function paginate(Request $request)
    {
        $perPage = min(max($request->integer('perPage', 10), 1), 100);
        $sort = in_array($request->input('sort', 'name'), ['name', 'email', 'student_count', 'created_at'], true)
            ? $request->input('sort', 'name')
            : 'name';
        $order = $request->input('order') === 'desc' ? 'desc' : 'asc';

        $query = User::query()
            ->where('role', UserRole::COUNSELOR)
            ->withCount([
                'counselorConversations as student_count' => fn($conversationQuery) => $conversationQuery
                    ->select(DB::raw('count(distinct student_id)')),
            ])
            ->with([
                'assignedCollege' => fn($collegeQuery) => $collegeQuery->select(
                    'colleges.id',
                    'colleges.name',
                    'colleges.code',
                    'colleges.created_at',
                    'colleges.updated_at',
                ),
            ]);

        if ($search = trim((string) $request->input('search'))) {
            $query->where(function ($builder) use ($search) {
                $builder->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($college = $request->input('college')) {
            $query->whereHas('assignedCollege', function ($builder) use ($college) {
                $builder->where('name', $college)->orWhere('code', $college);
            });
        }

        $counselors = $query->orderBy($sort, $order)->paginate($perPage)->withQueryString();
        $counselors->through(fn(User $counselor) => [
            'id' => $counselor->id,
            'uuid' => $counselor->uuid,
            'name' => $counselor->name,
            'pseudonym' => $counselor->pseudonym,
            'email' => $counselor->email,
            'avatar' => $counselor->avatar,
            'role' => $counselor->role->value,
            'is_anonymous' => $counselor->is_anonymous,
            'email_verified_at' => $counselor->email_verified_at,
            'two_factor_confirmed_at' => $counselor->two_factor_confirmed_at,
            'created_at' => $counselor->created_at,
            'updated_at' => $counselor->updated_at,
            'assigned_college' => $counselor->assignedCollege,
            'student_count' => (int) $counselor->student_count,
        ]);

        $statsQuery = User::where('role', UserRole::COUNSELOR);
        $totalCounselors = (clone $statsQuery)->count();
        $totalColleges = College::count();
        $totalStudentsAssigned = Conversation::whereNotNull('counselor_id')->count();
        $avgStudentsPerCounselor = $totalCounselors > 0
            ? round($totalStudentsAssigned / $totalCounselors, 1)
            : 0;
        $newThisMonth = (clone $statsQuery)
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();

        return response()->json([
            ...$counselors->toArray(),
            'stats' => [
                'total' => $totalCounselors,
                'totalColleges' => $totalColleges,
                'avgStudentsPerCounselor' => $avgStudentsPerCounselor,
                'newThisMonth' => $newThisMonth,
            ],
            'colleges' => User::query()
                ->where('role', UserRole::COUNSELOR)
                ->join('user_colleges', 'users.id', '=', 'user_colleges.user_id')
                ->join('colleges', 'user_colleges.college_id', '=', 'colleges.id')
                ->select('colleges.name', 'colleges.code')
                ->distinct()
                ->orderBy('colleges.name')
                ->get()
                ->map(fn($college) => [
                    'label' => $college->name,
                    'value' => $college->name,
                ])
                ->values(),
        ]);
    }
}