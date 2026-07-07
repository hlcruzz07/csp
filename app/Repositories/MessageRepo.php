<?php

namespace App\Repositories;

use App\Enums\MessageStatus;
use App\Models\Consent;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\UserCollege;
use App\Services\ImageCompressionService;


class MessageRepo
{
    /**
     * Create a new class instance.
     */
    public function __construct(protected Message $model, protected ImageCompressionService $imageCompressionService)
    {
        //
    }

    public function createMessage(array $data)
    {
        $message = $this->model->create([
            'conversation_id' => (int) auth()->user()->studentConversation->id,
            'sender_id' => (int) auth()->id(),
            'category_id' => isset($data['category_id']) ? (int) $data['category_id'] : null,
            'content' => $data['content'],
            'is_structured' => (bool) $data['is_structured'],
            'status' => MessageStatus::SENT->value,
        ]);

        $this->uploadAttachments($message, $data['attachments'] ?? []);

        return $message;
    }

    protected function uploadAttachments(Message $message, array $attachments)
    {

        if (empty($attachments)) {
            return;
        }

        $paths = [];

        $results = $this->imageCompressionService->compressMany($attachments);

        foreach ($results as $result) {
            $paths[] = $result['path'];
        }

        $message->attachments()->createMany(
            array_map(fn($img) => ['file_url' => $img], $paths)
        );
    }
}
