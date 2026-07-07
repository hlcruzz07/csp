<?php

namespace App\Enums;

enum MessageStatus: string
{
    case SENT = 'sent';
    case SEEN = 'seen';
    case RESPONDED = 'responded';
}
