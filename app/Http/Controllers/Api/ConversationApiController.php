<?php

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Message;
use Illuminate\Http\Request;

class ConversationApiController extends Controller
{
    public function messages(Request $request, string $uuid)
    {
        $user = auth()->user();
        $perPage = (int) $request->query('per_page', 20);

        $roleValue = $user->role instanceof UserRole ? $user->role->value : $user->role;

        $conversation = $roleValue === UserRole::STUDENT->value
            ? $user->studentConversation()->where('uuid', $uuid)->first()
            : $user->counselorConversations()->where('uuid', $uuid)->first();

        if (!$conversation) {
            return response()->json([
                'data' => [],
                'current_page' => 1,
                'last_page' => 1,
                'per_page' => $perPage,
                'total' => 0,
            ]);
        }

        $paginated = Message::with(['sender', 'attachments', 'category'])
            ->where('conversation_id', $conversation->id)
            ->orderBy('created_at', 'desc')
            ->orderBy('id', 'desc')
            ->paginate($perPage);

        return response()->json($paginated);
    }
}