<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClinicVerification extends Model
{
    protected $primaryKey = 'verification_id';

    protected $fillable = [
        'user_id',
        'clinic_id',
        'institution_type',
        'bangla_name',
        'year_established',
        'website',
        'division',
        'district',
        'upazila',
        'postal_code',
        'ownership_type',
        'owner_organization_name',
        'authorized_representative_name',
        'representative_designation',
        'representative_phone',
        'representative_email',
        'dghs_license_number',
        'trade_license_number',
        'tin',
        'bin_vat_number',
        'licensed_bed_count',
        'current_bed_count',
        'services',
        'operating_information',
        'documents',
        'status',
        'review_notes',
        'submitted_at',
        'reviewed_at',
    ];

    protected $casts = [
        'services' => 'array',
        'operating_information' => 'array',
        'documents' => 'array',
        'submitted_at' => 'datetime',
        'reviewed_at' => 'datetime',
    ];

    public function clinic()
    {
        return $this->belongsTo(Clinic::class, 'clinic_id', 'clinic_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
