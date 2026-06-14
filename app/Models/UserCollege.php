<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserCollege extends Model
{
    protected $fillable = [
        'user_id',
        'college_id'
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
    public function college()
    {
        return $this->belongsTo(College::class, 'college_id');
    }
}
