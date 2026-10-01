<?php

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class AdminApiController extends Controller
{
    public function paginate(Request $request)
    {
        $perPage = min(max($request->integer('perPage', 10), 1), 100);

        $sort = in_array($request->input('sort'), ['id', 'name', 'email', 'role', 'created_at'], true)
            ? $request->input('sort')
            : 'name';
        $order = $request->input('order') === 'desc' ? 'desc' : 'asc';

        $query = User::query()->select([
            'id',
            'uuid',
            'name',
            'pseudonym',
            'email',
            'avatar',
            'role',
            'is_anonymous',
            'created_at',
        ]);

        $query->where('role', UserRole::ADMIN);

        if ($search = trim((string) $request->input('search'))) {
            $query->where(function ($builder) use ($search) {
                $builder->where('name', 'like', "%{$search}%")
                    ->orWhere('pseudonym', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        return response()->json(
            $query->orderBy($sort, $order)->orderBy('id')->paginate($perPage)->withQueryString()
        );
    }
}
