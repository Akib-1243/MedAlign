<?php

namespace App\Http\Controllers;

use App\Models\AlertPreference;
use App\Models\Patient;
use App\Models\Prescription;
use App\Models\QueueToken;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PatientController extends Controller
{
    /**
     * Get live queue token status and positioning.
     */
    public function getQueueToken($identifier)
    {
        $token = QueueToken::with(['patient', 'doctor.user', 'doctor.clinic', 'counter'])
            ->where('token_id', $identifier)
            ->orWhere('token_number', $identifier)
            ->orWhereHas('patient', function ($q) use ($identifier) {
                $q->where('phone', $identifier)->orWhere('name', 'like', "%{$identifier}%");
            })
            ->latest('check_in_time')
            ->first();

        if (!$token) {
            return response()->json([
                'success' => false,
                'message' => 'Token not found.',
            ], 404);
        }

        // Calculate queue details
        $currentlyServing = QueueToken::where('doctor_id', $token->doctor_id)
            ->where('status', 'called')
            ->orderBy('called_time', 'desc')
            ->first();

        $patientsAhead = QueueToken::where('doctor_id', $token->doctor_id)
            ->where('status', 'waiting')
            ->where('token_id', '<', $token->token_id)
            ->count();

        $avgConsult = $token->doctor ? $token->doctor->avg_consult_min : 15;
        $estWaitMinutes = $token->status === 'waiting' ? ($patientsAhead + 1) * $avgConsult : 0;

        return response()->json([
            'success' => true,
            'data' => [
                'token' => $token,
                'patients_ahead' => $patientsAhead,
                'est_wait_time' => $estWaitMinutes,
                'currently_serving' => $currentlyServing ? $currentlyServing->token_number : null,
            ],
        ]);
    }

    /**
     * Search patient by phone or name to load workspace.
     */
    public function searchPatient(Request $request)
    {
        $query = $request->query('query');

        if (!$query) {
            $patient = Patient::first();
        } else {
            $patient = Patient::where('phone', $query)
                ->orWhere('email', $query)
                ->orWhere('name', 'like', "%{$query}%")
                ->orWhere('patient_id', $query)
                ->first();
        }

        if (!$patient) {
            return response()->json(['success' => false, 'message' => 'Patient not found']);
        }

        $latestToken = QueueToken::with(['doctor.user', 'doctor.clinic', 'counter'])
            ->where('patient_id', $patient->patient_id)
            ->latest('token_id')
            ->first();

        $patientsAhead = 0;
        $currentlyServing = null;

        if ($latestToken) {
            $patientsAhead = QueueToken::where('doctor_id', $latestToken->doctor_id)
                ->where('status', 'waiting')
                ->where('token_id', '<', $latestToken->token_id)
                ->count();

            $servingToken = QueueToken::where('doctor_id', $latestToken->doctor_id)
                ->where('status', 'called')
                ->first();
            $currentlyServing = $servingToken ? $servingToken->token_number : ($latestToken->token_number - 2 > 0 ? $latestToken->token_number - 2 : 101);
        }

        $alerts = AlertPreference::firstOrCreate(
            ['patient_id' => $patient->patient_id],
            [
                'sms_enabled' => true,
                'whatsapp_enabled' => true,
                'near_turn_threshold' => 3,
            ]
        );

        return response()->json([
            'success' => true,
            'patient' => $patient,
            'latest_token' => $latestToken,
            'patients_ahead' => $patientsAhead,
            'currently_serving' => $currentlyServing,
            'alert_preferences' => $alerts,
        ]);
    }

    /**
     * Get alert preferences for a patient.
     */
    public function getAlertPreferences($patient_id)
    {
        $alerts = AlertPreference::firstOrCreate(
            ['patient_id' => $patient_id],
            [
                'sms_enabled' => true,
                'whatsapp_enabled' => true,
                'near_turn_threshold' => 3,
            ]
        );

        return response()->json(['success' => true, 'data' => $alerts]);
    }

    /**
     * Update alert preferences.
     */
    public function updateAlertPreferences(Request $request, $patient_id)
    {
        $alerts = AlertPreference::firstOrCreate(['patient_id' => $patient_id]);

        $alerts->update([
            'sms_enabled' => $request->input('sms_enabled', $alerts->sms_enabled),
            'whatsapp_enabled' => $request->input('whatsapp_enabled', $alerts->whatsapp_enabled),
            'near_turn_threshold' => $request->input('near_turn_threshold', $alerts->near_turn_threshold),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Alert preferences saved successfully.',
            'data' => $alerts,
        ]);
    }

    /**
     * Get Medical Vault (Prescription history) for patient.
     */
    public function getMedicalVault($patient_id)
    {
        $prescriptions = Prescription::with(['doctor.user', 'items', 'queueToken'])
            ->where('patient_id', $patient_id)
            ->orderBy('issued_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $prescriptions,
        ]);
    }

    /**
     * Get single prescription detail.
     */
    public function getPrescriptionDetail($id)
    {
        $prescription = Prescription::with(['doctor.user', 'doctor.clinic', 'patient', 'items'])
            ->find($id);

        if (!$prescription) {
            return response()->json(['success' => false, 'message' => 'Prescription not found'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $prescription,
        ]);
    }

    /**
     * Public Doctors Directory Endpoint (backed by database `doctors`, `users`, `clinics` tables).
     */
    public function getDoctors()
    {
        $doctors = \App\Models\Doctor::with(['user', 'clinic'])->get()->map(function ($doc) {
            return [
                'id' => $doc->doctor_id,
                'name' => $doc->user ? $doc->user->name : 'Dr. ' . $doc->specialization,
                'specialty' => $doc->specialization,
                'clinic' => $doc->clinic ? $doc->clinic->name : 'MedAlign Health Centre',
                'experience' => ($doc->doctor_id * 2 + 5) . ' years experience',
                'availability' => $doc->availability_status === 'available' ? 'Available today' : 'Unavailable',
                'avg_consult_min' => $doc->avg_consult_min ?? 15,
                'detail' => 'Specialist in ' . $doc->specialization . ' with digital queue roster integration.',
            ];
        });

        return response()->json(['success' => true, 'data' => $doctors]);
    }

    /**
     * Public Subscription Plans Endpoint (backed by database `subscription_plans` table).
     */
    public function getSubscriptionPlans()
    {
        $plans = DB::table('subscription_plans')->get();
        return response()->json(['success' => true, 'data' => $plans]);
    }

    /**
     * Issue/Book a new queue token for a selected doctor (backed by `queue_tokens` table).
     */
    public function issueToken(Request $request)
    {
        $doctorId = $request->input('doctor_id');
        $patientId = $request->input('patient_id');
        $patientName = $request->input('name');
        $patientPhone = $request->input('phone');

        if (!$patientId && ($patientPhone || $patientName)) {
            $patient = Patient::firstOrCreate(
                ['phone' => $patientPhone ?? '+1 555 0199'],
                ['name' => $patientName ?? 'Patient', 'gender' => 'Other']
            );
            $patientId = $patient->patient_id;
        }

        if (!$patientId) {
            $patient = Patient::first();
            $patientId = $patient ? $patient->patient_id : 1;
        }

        $doctor = \App\Models\Doctor::with(['user', 'clinic'])->find($doctorId) ?? \App\Models\Doctor::with(['user', 'clinic'])->first();
        $clinicId = $doctor ? $doctor->clinic_id : 1;

        $lastTokenNum = DB::table('queue_tokens')
            ->where('clinic_id', $clinicId)
            ->max('token_number') ?? 100;

        $nextTokenNum = $lastTokenNum + 1;

        $patientsAhead = QueueToken::where('clinic_id', $clinicId)
            ->where('status', 'waiting')
            ->count();

        $tokenId = DB::table('queue_tokens')->insertGetId([
            'clinic_id' => $clinicId,
            'doctor_id' => $doctor ? $doctor->doctor_id : null,
            'patient_id' => $patientId,
            'counter_id' => 1,
            'token_number' => $nextTokenNum,
            'status' => 'waiting',
            'check_in_time' => now(),
            'est_wait_time' => $patientsAhead * ($doctor ? $doctor->avg_consult_min : 15),
        ]);

        $token = QueueToken::with(['patient', 'doctor.user', 'doctor.clinic', 'counter'])
            ->find($tokenId);

        return response()->json([
            'success' => true,
            'message' => 'Queue token issued successfully!',
            'token' => [
                'token_id' => $token->token_id,
                'token_number' => $token->token_number,
                'clinic_name' => $token->doctor && $token->doctor->clinic ? $token->doctor->clinic->name : "MedAlign Health Centre",
                'clinic_address' => $token->doctor && $token->doctor->clinic ? $token->doctor->clinic->address : "24 Crescent Road",
                'doctor_name' => $token->doctor && $token->doctor->user ? $token->doctor->user->name : "Dr. Sarah Ahmed",
                'specialization' => $token->doctor ? $token->doctor->specialization : "General Medicine",
                'counter_name' => $token->counter ? $token->counter->counter_name : "Counter 1 (Room 101)",
                'status' => $token->status,
                'check_in_time' => $token->check_in_time ? $token->check_in_time->format('h:i A') : now()->format('h:i A'),
                'patients_ahead' => $patientsAhead,
                'currently_serving' => 101,
                'est_wait_time' => $patientsAhead * 15,
            ],
        ]);
    }
}
