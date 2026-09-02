<?php

namespace App\Enums;

enum NotificationType: string
{
    // Account
    case NEW_CHAT_ASSIGNED = 'New Chat Assigned';
    case CHAT_UPDATED = 'Chat Updated';
    case ACCOUNT_UPDATED = 'Account Updated';
    case WELCOME = 'Welcome';
    case NEW_MESSAGE = 'New Message';

    /**
     * Description template. Use :placeholder syntax,
     * filled in dynamically via SendNotification's $params.
     */
    public function template(): string
    {
        return match ($this) {
            self::NEW_CHAT_ASSIGNED => ':name has been assigned to you for counseling support.',
            self::CHAT_UPDATED => 'Your chat with :name has been updated.',
            self::ACCOUNT_UPDATED => 'Your account information has been successfully updated.',
            self::WELCOME => 'Welcome, :name! We’re delighted to have you join our counseling team. We look forward to supporting you in making a positive difference in the lives of our students.',
            self::NEW_MESSAGE => 'You received a message from :name',
        };
    }
}