<?php

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\College;
use Illuminate\Http\Request;

class CollegeApiController extends Controller
{
    public function paginate(Request $request)
    {
        $perPage = min(max($request->integer('perPage', 10), 1), 100);
        $sort = in_array($request->input('sort', 'name'), ['name', 'code', 'student_count', 'counselor_count', 'created_at'], true)
            ? $request->input('sort', 'name')
            : 'name';
        $order = $request->input('order') === 'desc' ? 'desc' : 'asc';

        $query = College::query()
            ->with('userColleges.user')
            ->withCount([
                'userColleges as student_count' => fn($query) => $query->whereHas(
                    'user',
                    fn($userQuery) => $userQuery->where('role', UserRole::STUDENT),
                ),
                'userColleges as counselor_count' => fn($query) => $query->whereHas(
                    'user',
                    fn($userQuery) => $userQuery->where('role', UserRole::COUNSELOR),
                ),
            ]);

        if ($search = trim((string) $request->input('search'))) {
            $query->where(function ($builder) use ($search) {
                $builder->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            });
        }

        return response()->json($query->orderBy($sort, $order)->paginate($perPage)->withQueryString());
    }
}
