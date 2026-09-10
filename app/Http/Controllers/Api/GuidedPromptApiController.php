<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GuidedPrompt;
use Illuminate\Http\Request;

class GuidedPromptApiController extends Controller
{
    public function paginate(Request $request)
    {
        $perPage = min(max($request->integer('perPage', 10), 1), 100);
        $sort = in_array($request->input('sort', 'id'), ['id', 'name', 'created_at'], true)
            ? $request->input('sort', 'id')
            : 'id';
        $order = $request->input('order') === 'desc' ? 'desc' : 'asc';

        $query = GuidedPrompt::query();

        if ($search = trim((string) $request->input('search'))) {
            $query->where(function ($builder) use ($search) {
                $builder->where('name', 'like', "%{$search}%");
            });
        }

        return response()->json($query->orderBy($sort, $order)->paginate($perPage)->withQueryString());
    }
}
