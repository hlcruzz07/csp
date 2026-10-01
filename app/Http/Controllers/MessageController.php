<?php

namespace App\Http\Controllers;

use App\Ai\Agents\CounselingAssistant;
use App\Ai\Agents\CounselorResponse;
use App\Ai\Agents\CounselorSummarize;
use App\Enums\NotificationType;
use App\Enums\UserRole;
use App\Events\MessageSeen;
use App\Events\MessageSent;
use App\Models\Conversation;
use App\Models\Message;
use App\Http\Controllers\Controller;
use App\Http\Requests\CreateMessageRequest;
use App\Models\User;
use App\Notifications\SendNotification;
use App\Repositories\MessageRepo;
use App\Services\AttachmentStorageService;
use App\Services\ImageCompressionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;


class MessageController extends Controller
{
    public function __construct(protected MessageRepo $messageRepo)
    {
    }

    public function suggest(Request $request)
    {
        set_time_limit(120);

        $request->validate([
            'message' => ['required', 'string', 'max:1000'],
            'category' => ['nullable', 'string'],
            'category_description' => ['nullable', 'string'],
        ]);

        $categoryContext = '';
        if ($request->filled('category')) {
            $categoryContext = "The student has categorized this message under: \"{$request->category}\".";
            if ($request->filled('category_description')) {
                $categoryContext .= " Category description: \"{$request->category_description}\".";
            }
            $categoryContext .= " Make sure the suggestions are relevant to this category.";
        }

        $lastError = null;

        for ($attempt = 1; $attempt <= 3; $attempt++) {
            try {
                $response = (new CounselingAssistant($categoryContext))->prompt($request->message);
                $content = is_string($response) ? $response : json_encode($response);

                $wrapper = json_decode($content, true);
                $text = $wrapper['messages'][0]['content'] ?? $wrapper['text'] ?? $content;

                $text = preg_replace('/^```json\s*/i', '', $text);
                $text = preg_replace('/^```\s*/i', '', $text);
                $text = preg_replace('/```$/i', '', $text);
                $text = trim($text);

                $decoded = json_decode($text, true);

                if (json_last_error() !== JSON_ERROR_NONE || !isset($decoded['suggestions'])) {
                    throw new \RuntimeException('Invalid AI response structure: ' . $text);
                }

                return response()->json($decoded);
            } catch (\Throwable $th) {
                $lastError = $th;
                if ($attempt < 3)
                    sleep($attempt);
            }
        }

        return response()->json(['error' => $lastError->getMessage()], 500);
    }

    public function summarize(Conversation $conversation): JsonResponse
    {
        abort_unless((int) auth()->id() === (int) $conversation->counselor_id, 403);

        $transcript = $conversation->messages()
            ->latest()
            ->limit(200)
            ->get(['sender_id', 'content', 'created_at'])
            ->reverse()
            ->filter(fn($m) => filled($m->content))
            ->map(fn($m) => sprintf(
                '[%s] %s: %s',
                $m->created_at->format('M j, g:i A'),
                (int) $m->sender_id === (int) $conversation->student_id ? 'Student' : 'Counselor',
                $m->content,
            ))
            ->implode("\n");

        if ($transcript === '') {
            return response()->json(['summary' => 'There are no messages to summarize yet.']);
        }

        try {
            $response = (new CounselorSummarize)->prompt($transcript);

            return response()->json(['summary' => trim((string) $response)]);
        } catch (\Throwable $th) {
            Log::error('Error summarizing conversation: ' . $th->getMessage(), ['exception' => $th]);

            return response()->json(['message' => 'Could not generate a summary.'], 500);
        }
    }

    public function create(CreateMessageRequest $request)
    {
        try {
            $data = $request->validated();

            $conversation = Conversation::where('uuid', $data['conversation_uuid'])->firstOrFail();
            $data['conversation_id'] = $conversation->id;

            $message = $this->messageRepo->createMessage($data);

            if ((int) auth()->id() === (int) $conversation->counselor_id) {
                $this->messageRepo->markStudentMessagesAsResponded($conversation);
            }

            $message->load('sender', 'attachments', 'conversation');

            broadcast(new MessageSent($message));

            $this->notifyRecipient($message, $conversation);

            return redirect()->back();
        } catch (\Throwable $th) {
            Log::error('Error creating message: ' . $th->getMessage(), ['exception' => $th]);
            return redirect()->back()->withErrors(['error' => 'Something went wrong while sending the message. Please try again.' . $th->getMessage()]);
        }
    }

    public function markSeen(Conversation $conversation): JsonResponse
    {
        $userId = (int) auth()->id();

        // Only the two participants can mark messages as seen
        abort_unless(
            in_array($userId, [(int) $conversation->student_id, (int) $conversation->counselor_id], true),
            403,
        );

        $updated = $this->messageRepo->markMessagesAsSeen($conversation, $userId);

        // Only notify the other side if something actually changed
        if ($updated > 0) {
            broadcast(new MessageSeen($conversation, $userId));
        }

        return response()->json(['updated' => $updated]);
    }
    protected function notifyRecipient(Message $message, Conversation $conversation): void
    {
        $recipientId = $message->sender_id === $conversation->counselor_id
            ? $conversation->student_id
            : $conversation->counselor_id;

        $recipient = User::find($recipientId);

        if (!$recipient || $recipient->id === $message->sender_id) {
            return;
        }

        $this->notifyIfNoPendingUnread($recipient, $conversation, $message);
    }

    protected function notifyIfNoPendingUnread(User $recipient, Conversation $conversation, Message $message): void
    {
        $cooldownHours = max(1, (int) config('app.message_notification_cooldown_hours', 12));
        $notificationWindowStart = now()->subHours($cooldownHours);

        $hasRecentNotification = $recipient->notifications()
            ->where('type', NotificationType::NEW_MESSAGE->value)
            ->where('data->conversation_id', $conversation->id)
            ->where('created_at', '>=', $notificationWindowStart)
            ->exists();

        if ($hasRecentNotification) {
            return;
        }

        $recipient->notify(new SendNotification(
            NotificationType::NEW_MESSAGE,
            ['name' => $message->sender->name],
            ['conversation_id' => $conversation->id], // extra data, not templated text
        ));
    }

    public function counselorResponse(Request $request)
    {
        set_time_limit(120);

        $lastError = null;

        $studentMessages = $request->input('studentMessages', []);

        for ($attempt = 1; $attempt <= 3; $attempt++) {
            try {
                $response = (new CounselorResponse($studentMessages))
                    ->prompt('Generate three counselor response suggestions based on the student conversation.');

                $content = is_string($response)
                    ? $response
                    : json_encode($response, JSON_UNESCAPED_UNICODE);

                $wrapper = json_decode($content, true);

                $text = $wrapper['messages'][0]['content']
                    ?? $wrapper['text']
                    ?? $content;

                // Remove markdown fences if the model added them
                $text = preg_replace('/^```json\s*/i', '', $text);
                $text = preg_replace('/^```\s*/i', '', $text);
                $text = preg_replace('/\s*```$/i', '', $text);
                $text = trim($text);

                $decoded = json_decode($text, true);

                if (
                    json_last_error() !== JSON_ERROR_NONE ||
                    !isset($decoded['suggestions']) ||
                    !is_array($decoded['suggestions'])
                ) {
                    throw new \RuntimeException("Invalid AI response: {$text}");
                }

                return response()->json($decoded);

            } catch (\Throwable $e) {
                $lastError = $e;

                if ($attempt < 3) {
                    sleep($attempt);
                }
            }
        }

        return response()->json([
            'error' => $lastError?->getMessage() ?? 'Unable to generate response.'
        ], 500);
    }
    public function notices(string $uuid)
    {
        $user = auth()->user();

        $roleValue = $user->role instanceof UserRole ? $user->role->value : $user->role;

        $conversation = $roleValue === UserRole::STUDENT->value
            ? $user->studentConversation()->where('uuid', $uuid)->first()
            : $user->counselorConversations()->where('uuid', $uuid)->first();

        if (!$conversation) {
            return response()->json(['notices' => []]);
        }

        $types = collect(NotificationType::chatTimelineTypes())->map->value->all();

        $notices = $user->notifications()
            ->whereIn('data->type', $types)
            ->where('data->conversation_id', $conversation->id)
            ->latest()
            ->limit(50)
            ->get()
            ->reverse()
            ->values()
            ->map(fn($n) => [
                'id' => $n->id,
                'type' => $n->data['type'],
                'description' => $n->data['description'],
                'created_at' => $n->created_at->toISOString(),
            ]);

        return response()->json(['notices' => $notices]);
    }
}
