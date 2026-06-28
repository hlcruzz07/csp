<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    protected $fillable = [
        'conversation_id',
        'sender_id',
        'category_id',
        'content',
        'is_structured',
        'status'
    ];

    public function casts()
    {
        return [
            'is_structured' => 'boolean'
        ];
    }

    public function conversation()
    {
        return $this->belongsTo(Conversation::class);
    }

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function attachments()
    {
        return $this->hasMany(Attachment::class, 'message_id');
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }
}
