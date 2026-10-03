<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'clinic_id',
        'name',
        'first_name',
        'last_name',
        'email',
        'phone',
        'secondary_phone',
        'age',
        'registering_for_other',
        'relationship_to_patient',
        'parent_guardian_name',
        'parent_guardian_phone',
        'friend_parent_name',
        'friend_parent_phone',
        'password',
        'role',
        'email_verified_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    public function clinic()
    {
        return $this->belongsTo(Clinic::class, 'clinic_id', 'clinic_id');
    }

    public function doctor()
    {
        return $this->hasOne(Doctor::class, 'user_id', 'id');
    }

    public function clinicVerification()
    {
        return $this->hasOne(ClinicVerification::class, 'user_id', 'id');
    }
}
