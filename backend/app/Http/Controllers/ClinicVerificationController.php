<?php

namespace App\Http\Controllers;

use App\Models\ClinicVerification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ClinicVerificationController extends Controller
{
    public function show(Request $request)
    {
        $verification = ClinicVerification::where('user_id', $request->user()->id)->first();

        return response()->json([
            'success' => true,
            'data' => $verification,
            'onboarding_required' => !$verification || $verification->status !== 'verified',
        ]);
    }

    public function submit(Request $request)
    {
        $validated = $request->validate([
            'official_name' => 'required|string|max:100',
            'institution_type' => ['required', Rule::in(['Clinic', 'Private Hospital', 'Nursing Home', 'Diagnostic Center', 'Dental Clinic', 'Medical Center', 'Other'])],
            'bangla_name' => 'nullable|string|max:150',
            'year_established' => 'nullable|integer|min:1800|max:' . now()->year,
            'official_phone' => 'required|string|max:30',
            'official_email' => 'required|email|max:150',
            'website' => 'nullable|url|max:255',
            'address' => 'required|string|max:200',
            'division' => 'required|string|max:100',
            'district' => 'required|string|max:100',
            'upazila' => 'required|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'ownership_type' => 'required|string|max:50',
            'owner_organization_name' => 'required|string|max:150',
            'authorized_representative_name' => 'required|string|max:150',
            'representative_designation' => 'required|string|max:100',
            'representative_phone' => 'required|string|max:30',
            'representative_email' => 'required|email|max:150',
            'dghs_license_number' => 'nullable|string|max:100',
            'trade_license_number' => 'nullable|string|max:100',
            'tin' => 'nullable|string|max:100',
            'bin_vat_number' => 'nullable|string|max:100',
            'licensed_bed_count' => 'nullable|integer|min:0',
            'current_bed_count' => 'nullable|integer|min:0',
            'services' => 'nullable|array',
            'operating_information' => 'required|array',
            'operating_information.opd_hours' => 'required|string|max:100',
            'operating_information.emergency_hours' => 'required|string|max:100',
            'operating_information.weekly_closing_day' => 'required|string|max:30',
            'operating_information.consultation_information' => 'required|string|max:1000',
            'dghs_license_document' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
            'trade_license_document' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
            'tin_certificate' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
            'bin_vat_certificate' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
            'environmental_clearance_document' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
            'fire_clearance_document' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
            'waste_management_document' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
            'narcotics_permit_document' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
        ]);

        $user = $request->user();
        $verification = ClinicVerification::where('user_id', $user->id)->first();
        $documents = $verification?->documents ?? [];

        foreach ([
            'dghs_license_document',
            'trade_license_document',
            'tin_certificate',
            'bin_vat_certificate',
            'environmental_clearance_document',
            'fire_clearance_document',
            'waste_management_document',
            'narcotics_permit_document',
        ] as $documentField) {
            if ($request->hasFile($documentField)) {
                $documents[$documentField] = $request->file($documentField)->store(
                    'clinic-verification/' . $user->id,
                    'local'
                );
            }
        }

        $verification = DB::transaction(function () use ($validated, $documents, $user, $verification) {
            $clinicData = [
                'name' => $validated['official_name'],
                'address' => $validated['address'],
                'phone' => $validated['official_phone'],
                'email' => $validated['official_email'],
                'status' => 'pending_review',
            ];

            if ($user->clinic_id) {
                DB::table('clinics')->where('clinic_id', $user->clinic_id)->update($clinicData);
                $clinicId = $user->clinic_id;
            } else {
                $planId = DB::table('subscription_plans')->value('plan_id');
                $clinicId = DB::table('clinics')->insertGetId([
                    'plan_id' => $planId,
                    ...$clinicData,
                    'created_at' => now(),
                ]);
                $user->update(['clinic_id' => $clinicId]);
            }

            return ClinicVerification::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'clinic_id' => $clinicId,
                    'institution_type' => $validated['institution_type'],
                    'bangla_name' => $validated['bangla_name'] ?? null,
                    'year_established' => $validated['year_established'] ?? null,
                    'website' => $validated['website'] ?? null,
                    'division' => $validated['division'],
                    'district' => $validated['district'],
                    'upazila' => $validated['upazila'],
                    'postal_code' => $validated['postal_code'] ?? null,
                    'ownership_type' => $validated['ownership_type'],
                    'owner_organization_name' => $validated['owner_organization_name'],
                    'authorized_representative_name' => $validated['authorized_representative_name'],
                    'representative_designation' => $validated['representative_designation'],
                    'representative_phone' => $validated['representative_phone'],
                    'representative_email' => $validated['representative_email'],
                    'dghs_license_number' => $validated['dghs_license_number'] ?? null,
                    'trade_license_number' => $validated['trade_license_number'] ?? null,
                    'tin' => $validated['tin'] ?? null,
                    'bin_vat_number' => $validated['bin_vat_number'] ?? null,
                    'licensed_bed_count' => $validated['licensed_bed_count'] ?? null,
                    'current_bed_count' => $validated['current_bed_count'] ?? null,
                    'services' => $validated['services'] ?? [],
                    'operating_information' => $validated['operating_information'],
                    'documents' => $documents,
                    'status' => 'pending_review',
                    'submitted_at' => now(),
                    'reviewed_at' => null,
                ]
            );
        });

        return response()->json([
            'success' => true,
            'message' => 'Clinic verification submitted and is now pending review.',
            'data' => $verification,
        ], 201);
    }

    public function index()
    {
        return response()->json([
            'success' => true,
            'data' => ClinicVerification::with(['clinic', 'user:id,name,email,phone'])->latest()->get(),
        ]);
    }

    public function review(Request $request, int $verification_id)
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['pending_review', 'verified', 'rejected', 'expired'])],
            'review_notes' => 'nullable|string|max:2000',
        ]);

        $verification = ClinicVerification::findOrFail($verification_id);
        $verification->update([
            'status' => $validated['status'],
            'review_notes' => $validated['review_notes'] ?? null,
            'reviewed_at' => now(),
        ]);

        if ($verification->clinic_id) {
            DB::table('clinics')->where('clinic_id', $verification->clinic_id)->update([
                'status' => $validated['status'] === 'verified' ? 'active' : 'pending_review',
            ]);
        }

        return response()->json(['success' => true, 'data' => $verification]);
    }
}
