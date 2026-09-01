<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QueueToken extends Model
{
    protected $primaryKey = 'token_id';
    public $timestamps = false;

    protected $fillable = [
        'clinic_id',
        'doctor_id',
        'patient_id',
        'counter_id',
        'token_number',
        'status',
        'check_in_time',
        'called_time',
        'completed_time',
        'est_wait_time',
    ];

    protected $casts = [
        'check_in_time' => 'datetime',
        'called_time' => 'datetime',
        'completed_time' => 'datetime',
    ];

    public function patient()
    {
        return $this->belongsTo(Patient::class, 'patient_id', 'patient_id');
    }

    public function doctor()
    {
        return $this->belongsTo(Doctor::class, 'doctor_id', 'doctor_id');
    }

    public function counter()
    {
        return $this->belongsTo(Counter::class, 'counter_id', 'counter_id');
    }

    public function clinic()
    {
        return $this->belongsTo(Clinic::class, 'clinic_id', 'clinic_id');
    }

    public function prescriptions()
    {
        return $this->hasMany(Prescription::class, 'token_id', 'token_id');
    }
}
