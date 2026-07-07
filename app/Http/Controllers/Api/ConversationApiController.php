<?php

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Message;
use Illuminate\Http\Request;

class ConversationApiController extends Controller
{

    public function messages(Request $request)
    {
        $user = auth()->user();

        $conversation = $user->role === UserRole::COUNSELOR->value
            ? $user->counselorConversation()->first()
            : $user->studentConversation()->first();

        if (!$conversation) {
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
            ->orderBy('created_at', 'desc')
            ->orderBy('id', 'desc')
            ->paginate($perPage);

        return response()->json($paginated);
    }
}
