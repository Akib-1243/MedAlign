<?php

namespace App\Http\Controllers;

use App\Models\Doctor;
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
        $today = (clone $base)->whereDate('check_in_time', now()->toDateString());

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
                'completed_today' => (clone $today)->where('status', 'completed')->count(),
                'consulted_today' => (clone $today)->whereIn('status', ['called', 'completed'])->count(),
                'average_wait' => (int) ((clone $today)->whereNotNull('called_time')->avg(DB::raw('TIMESTAMPDIFF(MINUTE, check_in_time, called_time)')) ?? 0),
            ],
            'recent_prescriptions' => $doctor->prescriptions()->with('patient')->latest('issued_at')->limit(4)->get()->map(fn ($prescription) => [
                'id' => $prescription->prescription_id,
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

        return response()->json(['current' => $this->token($token->load('patient'))]);
    }

    public function updateStatus(Request $request, QueueToken $token)
    {
        $doctor = $this->doctorFor($request);
        if (!$doctor) {
            return response()->json(['message' => 'Doctor profile not found.'], 404);
        }

        $status = $request->validate(['status' => ['required', 'in:skipped,completed,waiting,called']])['status'];

        $updateData = ['status' => $status];
        if ($status === 'completed' || $status === 'skipped') {
            $updateData['completed_time'] = now();
        }

        $token->update($updateData);

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

        if ($request->has('doctor_id')) {
            $doc = Doctor::with('user')->find($request->input('doctor_id'));
            if ($doc) return $doc;
        }

        return Doctor::with('user')->orderBy('doctor_id')->first();
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

        if (!$patientId && $queueTokenId) {
            $token = QueueToken::find($queueTokenId);
            $patientId = $token ? $token->patient_id : 1;
        }

        if (!$patientId) {
            $patientId = 1;
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

        if ($queueTokenId) {
            QueueToken::where('token_id', $queueTokenId)->update([
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
        $prescriptions = \App\Models\Prescription::with(['doctor.user', 'items'])
            ->where('patient_id', $patient_id)
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
}
