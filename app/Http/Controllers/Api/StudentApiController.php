<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Repositories\StudentRepo;
use Illuminate\Http\Request;

class StudentApiController extends Controller
{
    public function __construct(protected StudentRepo $studentRepo) {}

    public function checkConversation()
    {
        return response()->json([
            'hasConversation' => $this->studentRepo->hasConversation(),
        ], 200);
    }

    public function messages(Request $request)
    {
        $conversation = auth()->user()->studentConversation;

        if (! $conversation) {
            return response()->json([
                'data' => [],
                'current_page' => 1,
                'last_page' => 1,
                'per_page' => (int) $request->query('per_page', 20),
                'total' => 0,
            ]);
        }

        $perPage = (int) $request->query('per_page', 20);

        $paginated = Message::with(['sender', 'attachments', 'category'])
            ->where('conversation_id', $conversation->id)
            // Tie-breaker on id avoids unstable ordering / possible
            // duplicate or skipped rows across pages when multiple
            // messages share the same created_at timestamp.
            ->orderBy('created_at', 'desc')
            ->orderBy('id', 'desc')
            ->paginate($perPage);

        return response()->json($paginated);
    }
}
