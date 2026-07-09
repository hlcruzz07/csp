<?php

namespace App\Repositories;

use App\Enums\MessageStatus;
use App\Enums\UserRole;
use App\Models\Consent;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\UserCollege;
use App\Services\AttachmentStorageService;
use App\Services\ImageCompressionService;


class MessageRepo
{
    /**
     * Create a new class instance.
     */
    public function __construct(protected Message $model, protected AttachmentStorageService $attachmentStorageService)
    {
        //
    }

    public function createMessage(array $data)
    {


        $message = $this->model->create([
            'conversation_id' => $data['conversation_id'],
            'sender_id' => (int) auth()->id(),
            'category_id' => isset($data['category_id']) ? (int) $data['category_id'] : null,
            'content' => $data['content'],
            'is_structured' => (bool) $data['is_structured'],
            'status' => MessageStatus::SENT->value,
        ]);

        $this->uploadAttachments($message, $data['attachments'] ?? []);

        return $message;
    }

    protected function uploadAttachments(Message $message, array $attachments): void
    {
        if (empty($attachments)) {
            return;
        }

        $results = $this->attachmentStorageService->storeMany($attachments);

        $message->attachments()->createMany(
            collect($results)
                ->reject(fn($result) => isset($result['error']))
                ->map(fn($result) => [
                    'file_url' => $result['path'],
                ])
                ->values()
                ->all()
        );
    }
}
