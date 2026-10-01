<?php

namespace App\Events;

use App\Models\Conversation;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageSeen implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Conversation $conversation,
        public int $readerId,
    ) {
    }

    public function broadcastOn(): array
    {
        return [new PrivateChannel('conversation.' . $this->conversation->uuid)];
    }

    public function broadcastWith(): array
    {
        return ['reader_id' => $this->readerId];
    }
}