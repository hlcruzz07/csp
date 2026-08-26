<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Consent extends Model
{
    use HasFactory;
    protected $fillable = [
        'user_id',
        'consent_given'
    ];

    protected $casts = [
        'consent_given' => 'boolean',
    ];
}
