<?php

namespace App\Notifications;

use App\Enums\NotificationType;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class SendNotification extends Notification
{
    use Queueable;

    /**
     * @param  array<string, string>  $params  e.g. ['name' => 'Harold Cruz']
     * @param  array<int, mixed>|null  $channels  null = database, broadcast and web push
     */
    public function __construct(
        public NotificationType $type,
        public array $params = [],
        public array $extra = [],
        public ?array $channels = null,
    ) {
    }

    public function via(object $notifiable): array
    {
        return $this->channels ?? ['database', 'broadcast', WebPushChannel::class];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->payload());
    }

    public function toWebPush(object $notifiable, Notification $notification): WebPushMessage
    {
        $payload = $this->payload();

        return (new WebPushMessage)
            ->title($payload['title'])
            ->body($payload['description'])
            ->icon('/logo.webp')
            ->data([
                'url' => '/dashboard',
                'notification' => $payload,
            ]);
    }

    public function toDatabase(object $notifiable): array
    {
        return $this->payload();
    }

    /**
     * `extra` is merged last, so it can add ids and also override
     * `description` with a custom sentence.
     */
    protected function payload(): array
    {
        return array_merge([
            'type' => $this->type->value,
            'title' => $this->type->value,
            'description' => $this->buildDescription(),
            'show_in_chat' => $this->type->showInChat(),
        ], $this->extra);
    }

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