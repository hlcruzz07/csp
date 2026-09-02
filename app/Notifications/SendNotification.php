<?php

namespace App\Notifications;

use App\Enums\NotificationType;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class SendNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * @param array<string, string> $params  e.g. ['name' => 'Harold Cruz']
     */
    public function __construct(
        public NotificationType $type,
        public array $params = [],
        public array $extra = [],
    ) {
    }
    /**
     * The channels the notification should be delivered on.
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Get the array representation for the "database" channel.
     */
    public function toDatabase(object $notifiable): array
    {
        return array_merge([
            'type' => $this->type->value,
            'title' => $this->type->value,
            'description' => $this->buildDescription(),
        ], $this->extra);
    }

    /**
     * Same payload, used when the notification is queued and (de)serialized.
     */
    public function toArray(object $notifiable): array
    {
        return $this->toDatabase($notifiable);
    }

    protected function buildDescription(): string
    {
        $description = $this->type->template();

        foreach ($this->params as $key => $value) {
            $description = str_replace(":{$key}", $value, $description);
        }

        return $description;
    }
}