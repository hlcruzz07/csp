<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Conversation extends Model
{
    protected $fillable = [
        'uuid',
        'student_id',
        'counselor_id',
    ];

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function counselor()
    {
        return $this->belongsTo(User::class, 'counselor_id');
    }

    public function messages()
    {
        return $this->hasMany(Message::class);
    }
    public function latestMessage()
    {
        return $this->hasOne(Message::class)->latestOfMany();
    }
}
