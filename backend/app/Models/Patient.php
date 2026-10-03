<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Patient extends Model
{
    protected $primaryKey = 'patient_id';
    public $timestamps = false;

    protected $hidden = [
        'telegram_chat_id',
        'first_name',
        'last_name',
        'secondary_phone',
        'age',
        'registering_for_other',
        'relationship_to_patient',
        'parent_guardian_name',
        'parent_guardian_phone',
        'friend_parent_name',
        'friend_parent_phone',
        'address',
        'marital_status',
        'emergency_contact_name',
        'emergency_contact_phone',
        'profile_photo_path',
        'blood_group',
        'allergies',
    ];

    protected $fillable = [
        'name',
        'first_name',
        'last_name',
        'phone',
        'secondary_phone',
        'age',
        'registering_for_other',
        'relationship_to_patient',
        'parent_guardian_name',
        'parent_guardian_phone',
        'friend_parent_name',
        'friend_parent_phone',
        'email',
        'date_of_birth',
        'dob',
        'gender',
        'marital_status',
        'emergency_contact_name',
        'emergency_contact_phone',
        'profile_photo_path',
        'blood_group',
        'allergies',
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
