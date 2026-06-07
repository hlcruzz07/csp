<?php

namespace App\Enums;

enum UserRole: string
{
    case STUDENT = 'student';
    case COUNSELOR = 'counselor';
    case ADMIN = 'admin';
}
