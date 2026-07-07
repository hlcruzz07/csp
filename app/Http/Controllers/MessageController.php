<?php

namespace App\Http\Controllers;

use App\Ai\Agents\CounselingAssistant;
use App\Events\MessageSent;
use App\Models\Message;
use App\Http\Controllers\Controller;
use App\Http\Requests\CreateMessageRequest;
use App\Repositories\MessageRepo;
use App\Services\ImageCompressionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;


class MessageController extends Controller
{
    public function __construct(protected MessageRepo $messageRepo, protected ImageCompressionService $imageCompressionService)
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

    public function create(CreateMessageRequest $request)
    {
        try {

            $data = $request->all();

            $message = $this->messageRepo->createMessage($data);

            $message->load('sender', 'attachments', 'conversation');

            broadcast(new MessageSent($message));
            return redirect()->back();
        } catch (\Throwable $th) {
            Log::error('Error creating message: ' . $th->getMessage(), ['exception' => $th]);
            return redirect()->back()->withErrors(['error' => 'Something went wrong while sending the message. Please try again.']);
        }
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
