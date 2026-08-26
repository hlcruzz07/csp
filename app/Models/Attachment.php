<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Attachment extends Model
{
    use HasFactory;
    protected $fillable = [
        'message_id',
        'file_url',
    ];

    public function message()
    {
        return $this->belongsTo(Message::class);
    }
}
