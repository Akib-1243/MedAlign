<?php

namespace App\Http\Controllers;

use App\Http\Services\QueueNotificationService;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\QueueToken;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DoctorDashboardController extends Controller
{
    public function show(Request $request)
    {
        $doctor = $this->doctorFor($request);
        if (!$doctor) {
            return response()->json([
                'doctor' => null,
                'current' => null,
                'queue' => [],
                'stats' => ['waiting' => 0, 'completed_today' => 0, 'consulted_today' => 0, 'average_wait' => 0],
                'recent_prescriptions' => [],
            ]);
        }

        // Strictly scope to this doctor's assigned tokens only
        $base = QueueToken::with('patient')
            ->where('doctor_id', $doctor->doctor_id);

        $current = (clone $base)->where('status', 'called')
            ->orderBy('called_time', 'desc')->first();
        $queue = (clone $base)->where('status', 'waiting')->orderBy('token_number')->limit(20)->get();
        $today = now()->toDateString();
        $completedToday = (clone $base)->where('status', 'completed')
            ->whereDate('completed_time', $today);
        $averageConsultation = (clone $completedToday)
            ->whereNotNull('called_time')
            ->whereDate('called_time', $today)
            ->whereColumn('completed_time', '>', 'called_time')
            ->avg(DB::raw('TIMESTAMPDIFF(SECOND, called_time, completed_time) / 60'));

        return response()->json([
            'doctor' => [
                'id' => $doctor->doctor_id,
                'name' => $doctor->user ? $doctor->user->name : 'Dr. ' . $doctor->specialization,
                'specialization' => $doctor->specialization,
                'availability_status' => $doctor->availability_status ?? 'available',
                'avg_consult_min' => $doctor->avg_consult_min ?? 15,
            ],
            'current' => $this->token($current),
            'queue' => $queue->map(fn (QueueToken $token) => $this->token($token))->values(),
            'stats' => [
                'waiting' => (clone $base)->where('status', 'waiting')->count(),
                'completed_today' => (clone $completedToday)->count(),
                'consulted_today' => (clone $base)->whereNotNull('called_time')->whereDate('called_time', $today)->count(),
                'avg_consult_min' => $averageConsultation !== null
                    ? max(1, (int) round($averageConsultation))
                    : ($doctor->avg_consult_min ?? 15),
                'avg_consult_is_actual' => $averageConsultation !== null,
                'average_wait' => (int) ((clone $base)->whereNotNull('called_time')->whereDate('called_time', $today)->avg(DB::raw('TIMESTAMPDIFF(MINUTE, check_in_time, called_time)')) ?? 0),
            ],
            'recent_prescriptions' => $doctor->prescriptions()->with('patient')->latest('issued_at')->limit(4)->get()->map(fn ($prescription) => [
                'id' => $prescription->prescription_id,
                'patient_id' => $prescription->patient?->patient_id,
                'patient' => $prescription->patient ? $prescription->patient->name : 'Patient',
                'issued_at' => $prescription->issued_at?->toIso8601String(),
            ]),
        ]);
    }

    public function callNext(Request $request)
    {
        $doctor = $this->doctorFor($request);
        if (!$doctor) {
            return response()->json(['message' => 'No active doctor profile found.'], 404);
        }

        $active = $this->activeToken($doctor);
        if ($active) {
            return response()->json(['message' => 'Complete or skip the current patient first.'], 409);
        }

        // Only call next patient who specifically selected this doctor
        $token = QueueToken::where('doctor_id', $doctor->doctor_id)
            ->where('status', 'waiting')
            ->orderBy('token_number')
            ->first();

        if (!$token) {
            return response()->json(['message' => 'No waiting patients in your queue.'], 404);
        }

        $token->update([
            'status' => 'called',
            'called_time' => now(),
        ]);

        $notifier = app(QueueNotificationService::class);
        $notifier->notifyCalled($token);
        $notifier->notifyNearTurn($token->doctor_id);

        return response()->json(['current' => $this->token($token->load('patient'))]);
    }

    public function updateStatus(Request $request, QueueToken $token)
    {
        $doctor = $this->doctorFor($request);
        if (!$doctor) {
            return response()->json(['message' => 'Doctor profile not found.'], 404);
        }

        $status = $request->validate(['status' => ['required', 'in:skipped,completed,waiting,called']])['status'];

        if ((int) $token->doctor_id !== (int) $doctor->doctor_id) {
            return response()->json(['message' => 'Queue token not found for this doctor.'], 404);
        }

        if (in_array($status, ['completed', 'skipped'], true) && $token->status !== 'called') {
            return response()->json(['message' => 'Only the active consultation can be completed or skipped.'], 409);
        }

        $updateData = ['status' => $status];
        if ($status === 'completed' || $status === 'skipped') {
            $updateData['completed_time'] = now();
        }

        $token->update($updateData);

        $notifier = app(QueueNotificationService::class);
        if ($status === 'called') {
            $notifier->notifyCalled($token);
        }
        $notifier->notifyNearTurn($token->doctor_id);

        return response()->json([
            'message' => 'Queue updated.',
            'current' => $status === 'called' ? $this->token($token->load('patient')) : null,
        ]);
    }

    private function doctorFor(Request $request): ?Doctor
    {
        $user = $request->user();

        // If user not set by middleware, decode from Bearer token
        if (!$user) {
            $header = $request->header('Authorization', '');
            if (str_starts_with($header, 'Bearer ')) {
                $payload = \App\Http\Services\JwtService::verifyToken(substr($header, 7));
                if ($payload && isset($payload['user_id'])) {
                    $user = \App\Models\User::find($payload['user_id']);
                }
            }
        }

        if ($user) {
            $doc = $user->doctor()->with('user')->first();
            if ($doc) {
                return $doc;
            }
        }

        return null;
    }

    private function activeToken(Doctor $doctor): ?QueueToken
    {
        return QueueToken::where('doctor_id', $doctor->doctor_id)->where('status', 'called')->first();
    }

    private function token(?QueueToken $token): ?array
    {
        if (!$token) {
            return null;
        }

        return [
            'id' => $token->token_id,
            'number' => $token->token_number,
            'status' => $token->status,
            'patient' => [
                'id' => $token->patient ? $token->patient->patient_id : null,
                'name' => $token->patient ? $token->patient->name : 'Walk-in Patient',
                'phone' => $token->patient ? $token->patient->phone : null,
                'dob' => $token->patient ? ($token->patient->date_of_birth ?? $token->patient->dob) : null,
            ],
            'check_in_time' => $token->check_in_time?->toIso8601String(),
            'called_time' => $token->called_time?->toIso8601String(),
            'est_wait_time' => $token->est_wait_time ?? 15,
        ];
    }

    /**
     * Create & issue digital prescription for active patient.
     */
    public function createPrescription(Request $request)
    {
        $doctor = $this->doctorFor($request);
        if (!$doctor) {
            return response()->json(['message' => 'Doctor profile not found.'], 404);
        }

        $patientId = $request->input('patient_id');
        $queueTokenId = $request->input('queue_token_id');
        $notes = $request->input('notes', 'Routine consultation and treatment.');
        $medicines = $request->input('items', []);

        $token = null;
        if ($queueTokenId) {
            $token = QueueToken::where('token_id', $queueTokenId)
                ->where('doctor_id', $doctor->doctor_id)
                ->where('status', 'called')
                ->first();

            if (!$token) {
                return response()->json(['message' => 'Active queue token not found for this doctor.'], 404);
            }

            $patientId = $token->patient_id;
        }

        if (!$patientId) {
            return response()->json(['message' => 'A patient is required to issue a prescription.'], 422);
        }

        $rxId = DB::table('prescriptions')->insertGetId([
            'doctor_id' => $doctor->doctor_id,
            'patient_id' => $patientId,
            'token_id' => $queueTokenId,
            'issued_at' => now(),
            'notes' => $notes,
            'qr_code_path' => 'QR-MED-' . rand(100000, 999999),
        ]);

        if (is_array($medicines) && count($medicines) > 0) {
            foreach ($medicines as $item) {
                if (!empty($item['medicine_name'])) {
                    DB::table('prescription_items')->insert([
                        'prescription_id' => $rxId,
                        'medicine_name' => $item['medicine_name'],
                        'dosage' => $item['dosage'] ?? '1 Tablet',
                        'frequency' => $item['frequency'] ?? 'Once daily',
                        'duration' => $item['duration'] ?? '7 Days',
                        'instructions' => $item['instructions'] ?? 'Take after meals',
                    ]);
                }
            }
        } else {
            DB::table('prescription_items')->insert([
                'prescription_id' => $rxId,
                'medicine_name' => 'Amoxicillin 500mg',
                'dosage' => '1 Capsule',
                'frequency' => 'Three times daily',
                'duration' => '7 Days',
                'instructions' => 'Take after meals',
            ]);
        }

        if ($token) {
            $token->update([
                'status' => 'completed',
                'completed_time' => now(),
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Digital Prescription issued and signed successfully!',
            'prescription_id' => $rxId,
        ]);
    }

    /**
     * Get full prescription history for a patient (doctor's view — all past Rx records).
     */
    public function patientHistory(Request $request, $patient_id)
    {
        $doctor = $this->doctorFor($request);
        $patient = $doctor ? $this->patientForDoctor($doctor, $patient_id) : null;

        if (!$patient) {
            return response()->json(['message' => 'Patient not found.'], 404);
        }

        $prescriptions = $patient->prescriptions()->with(['doctor.user', 'items'])
            ->orderBy('issued_at', 'desc')
            ->get()
            ->map(fn ($rx) => [
                'id'          => $rx->prescription_id,
                'rx_code'     => 'RX-' . date('Y', strtotime($rx->issued_at)) . '-' . (1000 + $rx->prescription_id),
                'issued_at'   => $rx->issued_at?->toIso8601String(),
                'doctor_name' => $rx->doctor?->user?->name ?? 'Doctor',
                'notes'       => $rx->notes ?? '',
                'qr_code'     => $rx->qr_code_path ?? ('QR-MED-' . $rx->prescription_id),
                'items'       => $rx->items->map(fn ($it) => [
                    'medicine_name' => $it->medicine_name,
                    'dosage'        => $it->dosage,
                    'frequency'     => $it->frequency,
                    'duration'      => $it->duration,
                    'instructions'  => $it->instructions,
                ])->values(),
            ]);

        return response()->json([
            'success' => true,
            'data'    => $prescriptions,
        ]);
    }

    /**
     * Get a patient's full profile and prescription history for an assigned doctor.
     */
    public function patientDetails(Request $request, $patient_id)
    {
        $doctor = $this->doctorFor($request);
        $patient = $doctor ? $this->patientForDoctor($doctor, $patient_id) : null;

        if (!$patient) {
            return response()->json(['message' => 'Patient not found.'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'patient' => [
                    'id' => $patient->patient_id,
                    'name' => $patient->name,
                    'first_name' => $patient->first_name,
                    'last_name' => $patient->last_name,
                    'phone' => $patient->phone,
                    'secondary_phone' => $patient->secondary_phone,
                    'email' => $patient->email,
                    'date_of_birth' => $patient->date_of_birth ?? $patient->dob,
                    'age' => $patient->age,
                    'gender' => $patient->gender,
                    'marital_status' => $patient->marital_status,
                    'blood_group' => $patient->blood_group,
                    'allergies' => $patient->allergies,
                    'address' => $patient->address,
                    'emergency_contact_name' => $patient->emergency_contact_name,
                    'emergency_contact_phone' => $patient->emergency_contact_phone,
                    'registering_for_other' => (bool) $patient->registering_for_other,
                    'relationship_to_patient' => $patient->relationship_to_patient,
                    'parent_guardian_name' => $patient->parent_guardian_name,
                    'parent_guardian_phone' => $patient->parent_guardian_phone,
                    'friend_parent_name' => $patient->friend_parent_name,
                    'friend_parent_phone' => $patient->friend_parent_phone,
                ],
                'prescriptions' => $patient->prescriptions()
                    ->with(['doctor.user', 'items'])
                    ->orderBy('issued_at', 'desc')
                    ->get()
                    ->map(fn ($rx) => [
                        'id' => $rx->prescription_id,
                        'issued_at' => $rx->issued_at?->toIso8601String(),
                        'doctor_name' => $rx->doctor?->user?->name ?? 'Doctor',
                        'notes' => $rx->notes ?? '',
                        'items' => $rx->items->map(fn ($item) => [
                            'medicine_name' => $item->medicine_name,
                            'dosage' => $item->dosage,
                            'frequency' => $item->frequency,
                            'duration' => $item->duration,
                            'instructions' => $item->instructions,
                        ])->values(),
                    ])->values(),
            ],
        ]);
    }

    private function patientForDoctor(Doctor $doctor, int|string $patientId): ?Patient
    {
        return Patient::where('patient_id', $patientId)
            ->where(function ($query) use ($doctor) {
                $query->whereHas('queueTokens', fn ($tokens) => $tokens->where('doctor_id', $doctor->doctor_id))
                    ->orWhereHas('prescriptions', fn ($prescriptions) => $prescriptions->where('doctor_id', $doctor->doctor_id));
            })
            ->first();
    }
}
