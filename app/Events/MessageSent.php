<?php

namespace App\Events;

use App\Models\Message;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Message $message) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("conversation.{$this->message->conversation->uuid}")
        ];
    }

    public function broadcastAs(): string
    {
        return 'MessageSent';
    }

    public function broadcastWith(): array
    {
        return [
            'message' => [
                'id'              => $this->message->id,
                'conversation_id' => $this->message->conversation_id,
                'sender_id'       => $this->message->sender_id,
                'category_id'     => $this->message->category_id,
                'content'         => $this->message->content,
                'is_structured'   => $this->message->is_structured,
                'status'          => $this->message->status,
                'sender'          => $this->message->sender,
                'attachments'     => $this->message->attachments,
                'created_at'      => $this->message->created_at,
            ],
        ];
    }
}
