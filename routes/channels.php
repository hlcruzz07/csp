<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::routes(['middleware' => ['web']]);

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

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
