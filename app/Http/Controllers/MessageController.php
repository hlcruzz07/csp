<?php

namespace App\Http\Controllers;

use App\Ai\Agents\CounselingAssistant;
use App\Events\MessageSent;
use App\Models\Message;
use App\Http\Controllers\Controller;
use App\Http\Requests\CreateMessageRequest;
use App\Services\ImageCompressionService;
use Illuminate\Http\Request;


class MessageController extends Controller
{
    public function __construct() {}

    public function suggest(Request $request)
    {
        set_time_limit(120);

        $request->validate([
            'message'              => ['required', 'string', 'max:1000'],
            'category'             => ['nullable', 'string'],
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
                if ($attempt < 3) sleep($attempt);
            }
        }

        return response()->json(['error' => $lastError->getMessage()], 500);
    }

    public function create(CreateMessageRequest $request, ImageCompressionService $imageCompressionService)
    {
        $attachmentPaths = [];

        if ($request->hasFile('attachments')) {
            $results = $imageCompressionService->compressMany($request->file('attachments'));

            foreach ($results as $result) {

                $attachmentPaths[] = $result['path'];
            }
        }

        $message = Message::create([
            'conversation_id' => auth()->user()->studentConversation->id,
            'sender_id'       => auth()->id(),
            'category_id'     => $request->category_id,
            'content'         => $request->content ?? null,
            'is_structured'   => $request->is_structured,
            'status'          => 'sent',
        ]);

        if (!empty($attachmentPaths)) {
            $message->attachments()->createMany(
                array_map(fn($img) => ['file_url' => $img], $attachmentPaths)
            );
        }
        $message->load('sender', 'attachments', 'conversation');

        broadcast(new MessageSent($message));
        return back();
    }

    public function store(Request $request)
    {
        //
    }

    public function show(Message $message)
    {
        //
    }

    public function edit(Message $message)
    {
        //
    }

    public function update(Request $request, Message $message)
    {
        //
    }

    public function destroy(Message $message)
    {
        //
    }
}
