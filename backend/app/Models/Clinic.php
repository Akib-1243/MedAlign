<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Clinic extends Model
{
    protected $primaryKey = 'clinic_id';
    public $timestamps = false;

    protected $fillable = [
        'clinic_name',
        'address',
        'phone',
        'email',
    ];

    public function doctors()
    {
        return $this->hasMany(Doctor::class, 'clinic_id', 'clinic_id');
    }

    public function users()
    {
        return $this->hasMany(User::class, 'clinic_id', 'clinic_id');
    }

    public function counters()
    {
        return $this->hasMany(Counter::class, 'clinic_id', 'clinic_id');
    }

    public function verification()
    {
        return $this->hasOne(ClinicVerification::class, 'clinic_id', 'clinic_id');
    }
}
