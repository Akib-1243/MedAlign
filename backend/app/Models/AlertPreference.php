<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AlertPreference extends Model
{
    protected $primaryKey = 'preference_id';
    public $timestamps = false;

    protected $fillable = [
        'patient_id',
        'sms_enabled',
        'whatsapp_enabled',
        'near_turn_threshold',
    ];

    public function patient()
    {
        return $this->belongsTo(Patient::class, 'patient_id', 'patient_id');
    }
}
