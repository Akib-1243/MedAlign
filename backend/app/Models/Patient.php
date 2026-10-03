<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Patient extends Model
{
    protected $primaryKey = 'patient_id';
    public $timestamps = false;

    protected $hidden = [
        'telegram_chat_id',
    ];

    protected $fillable = [
        'name',
        'phone',
        'email',
        'date_of_birth',
        'dob',
        'gender',
        'blood_group',
        'address',
    ];

    public function queueTokens()
    {
        return $this->hasMany(QueueToken::class, 'patient_id', 'patient_id');
    }

    public function alertPreferences()
    {
        return $this->hasOne(AlertPreference::class, 'patient_id', 'patient_id');
    }

    public function prescriptions()
    {
        return $this->hasMany(Prescription::class, 'patient_id', 'patient_id');
    }
}
