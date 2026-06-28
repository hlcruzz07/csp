<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class College extends Model
{
    protected $fillable = [
        'name',
        'code',
    ];

    public function userColleges(): HasMany
    {
        return $this->hasMany(UserCollege::class, 'college_id', 'id');
    }
}
