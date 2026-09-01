<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::routes(['middleware' => ['web']]);

Broadcast::channel('conversation.{conversationUuid}', function ($user, $conversationUuid) {
    if ($user->studentConversation && (string) $user->studentConversation->uuid === (string) $conversationUuid) {
        return true;
    }

    if (
        method_exists($user, 'counselorConversations')
        && $user->counselorConversations()->where('uuid', $conversationUuid)->exists()
    ) {
        return true;
    }

    return false;
});