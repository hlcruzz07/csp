<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Enums\UserRole;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\Contracts\PasskeyUser;
use Laravel\Fortify\PasskeyAuthenticatable;
use Laravel\Fortify\TwoFactorAuthenticatable;

#[Fillable(['avatar', 'uuid', 'name', 'pseudonym', 'email', 'password', 'is_anonymous', 'role'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]

class User extends Authenticatable implements PasskeyUser
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, PasskeyAuthenticatable, TwoFactorAuthenticatable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    const ROLE_STUDENT = 'student';
    const ROLE_COUNSELOR = 'counselor';
    const ROLE_ADMIN = 'admin';

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'role' => UserRole::class,
            'is_anonymous' => 'boolean'
        ];
    }

    public function consent()
    {
        return $this->hasOne(Consent::class, 'user_id');
    }

    public function assignedCollege()
    {
        return $this->hasOneThrough(
            College::class,
            UserCollege::class,
            'user_id',    // Foreign key on user_colleges
            'id',         // Foreign key on colleges
            'id',         // Local key on users
            'college_id'  // Local key on user_colleges
        );
    }

    public function counselor()
    {
        return $this->belongsTo(User::class, 'counselor_id');
    }

    public function messages()
    {
        return $this->hasMany(Message::class);
    }

    public function studentConversation()
    {
        return $this->hasOne(Conversation::class, 'student_id');
    }

    public function counselorConversations()
    {
        return $this->hasMany(Conversation::class, 'counselor_id');
    }
    public function userCollege()
    {
        return $this->hasOne(UserCollege::class);
    }


}
