<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Consent extends Model
{
    protected $fillable = [
        'user_id',
        'consent_given'
    ];

    protected $casts = [
        'consent_given' => 'boolean',
    ];
}
