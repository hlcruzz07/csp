<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description'
    ];

    public function conversation()
    {
        return $this->belongsTo(Conversation::class, 'category_id');
    }
}
