<?php

namespace App\Http\Controllers;

use App\Models\Doctor;
use App\Models\Patient;
use App\Models\QueueToken;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class ReceptionDashboardController extends Controller
{
    private function clinicId(Request $request)
    {
        $clinicId = $request->user()?->clinic_id;

        if (!$clinicId) {
            abort(response()->json([
                'message' => 'Receptionist is not assigned to a hospital/clinic.'
            ], 403));
        }

        return $clinicId;
    }

    public function dashboard(Request $request)
    {
        $clinicId = $this->clinicId($request);

        return response()->json([
            'success' => true,

            'doctors' => Doctor::with('user')
                ->where('clinic_id', $clinicId)
                ->where('is_active', true)
                ->count(),

            'patients' => Patient::where('clinic_id', $clinicId)->count(),

            'queue' => [
                'waiting' => QueueToken::where('clinic_id', $clinicId)
                    ->where('status', 'waiting')
                    ->count(),

                'called' => QueueToken::where('clinic_id', $clinicId)
                    ->where('status', 'called')
                    ->count(),

                'completed' => QueueToken::where('clinic_id', $clinicId)
                    ->where('status', 'completed')
                    ->count(),
            ],
        ]);
    }

    /*
     * ---------------------------------------------------------
     * DOCTORS
     * ---------------------------------------------------------
     */

    public function doctors(Request $request)
    {
        $clinicId = $this->clinicId($request);

        $doctors = Doctor::with('user')
            ->where('clinic_id', $clinicId)
            ->orderBy('doctor_id')
            ->get()
            ->map(function ($doctor) {
                return [
                    'doctor_id' => $doctor->doctor_id,
                    'name' => $doctor->user?->name ?? 'Doctor',
                    'email' => $doctor->user?->email,
                    'phone' => $doctor->user?->phone,
                    'specialization' => $doctor->specialization,
                    'availability_status' => $doctor->availability_status,
                    'avg_consult_min' => $doctor->avg_consult_min,
                    'is_active' => $doctor->is_active,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $doctors,
        ]);
    }

    public function addDoctor(Request $request)
    {
        $clinicId = $this->clinicId($request);

        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'email' => 'required|email|unique:users,email',
            'phone' => 'nullable|string|max:30',
            'password' => 'required|string|min:6',
            'specialization' => 'required|string|max:100',
            'avg_consult_min' => 'nullable|integer|min:1|max:180',
        ]);

        $user = User::create([
            'clinic_id' => $clinicId,
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'password' => Hash::make($validated['password']),
            'role' => 'doctor',
            'email_verified_at' => now(),
        ]);

        $doctor = Doctor::create([
            'user_id' => $user->id,
            'clinic_id' => $clinicId,
            'specialization' => $validated['specialization'],
            'avg_consult_min' => $validated['avg_consult_min'] ?? 15,
            'availability_status' => 'available',
            'is_active' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Doctor registered successfully.',
            'data' => $doctor->load('user'),
        ], 201);
    }

    public function updateDoctor(Request $request, $doctorId)
    {
        $clinicId = $this->clinicId($request);

        $doctor = Doctor::where('clinic_id', $clinicId)
            ->where('doctor_id', $doctorId)
            ->firstOrFail();

        $validated = $request->validate([
            'name' => 'sometimes|string|max:150',
            'phone' => 'nullable|string|max:30',
            'specialization' => 'sometimes|string|max:100',
            'avg_consult_min' => 'sometimes|integer|min:1|max:180',
            'availability_status' => 'sometimes|in:available,unavailable',
            'is_active' => 'sometimes|boolean',
        ]);

        $doctor->update([
            'specialization' => $validated['specialization']
                ?? $doctor->specialization,

            'avg_consult_min' => $validated['avg_consult_min']
                ?? $doctor->avg_consult_min,

            'availability_status' => $validated['availability_status']
                ?? $doctor->availability_status,

            'is_active' => $validated['is_active']
                ?? $doctor->is_active,
        ]);

        if (isset($validated['name'])) {
            $doctor->user->update([
                'name' => $validated['name'],
            ]);
        }

        if (array_key_exists('phone', $validated)) {
            $doctor->user->update([
                'phone' => $validated['phone'],
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Doctor updated successfully.',
            'data' => $doctor->load('user'),
        ]);
    }

    public function deleteDoctor(Request $request, $doctorId)
    {
        $clinicId = $this->clinicId($request);

        $doctor = Doctor::where('clinic_id', $clinicId)
            ->where('doctor_id', $doctorId)
            ->firstOrFail();

        // Deactivate rather than destroy historical records.
        $doctor->update([
            'is_active' => false,
            'availability_status' => 'unavailable',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Doctor removed from the hospital roster.',
        ]);
    }

    /*
     * ---------------------------------------------------------
     * PATIENTS
     * ---------------------------------------------------------
     */

    public function patients(Request $request)
    {
        $clinicId = $this->clinicId($request);

        $patients = Patient::where('clinic_id', $clinicId)
            ->orderBy('patient_id', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $patients,
        ]);
    }

    public function addPatient(Request $request)
    {
        $clinicId = $this->clinicId($request);

        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'phone' => 'required|string|max:30',
            'email' => 'nullable|email',
            'date_of_birth' => 'nullable|date',
            'gender' => 'nullable|string|max:30',
            'blood_group' => 'nullable|string|max:10',
            'address' => 'nullable|string|max:255',
        ]);

        $patient = Patient::create([
            'clinic_id' => $clinicId,
            'name' => $validated['name'],
            'phone' => $validated['phone'],
            'email' => $validated['email'] ?? null,
            'date_of_birth' => $validated['date_of_birth'] ?? null,
            'gender' => $validated['gender'] ?? null,
            'blood_group' => $validated['blood_group'] ?? null,
            'address' => $validated['address'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Patient registered successfully.',
            'data' => $patient,
        ], 201);
    }

    public function updatePatient(Request $request, $patientId)
    {
        $clinicId = $this->clinicId($request);

        $patient = Patient::where('clinic_id', $clinicId)
            ->where('patient_id', $patientId)
            ->firstOrFail();

        $validated = $request->validate([
            'name' => 'sometimes|string|max:150',
            'phone' => 'sometimes|string|max:30',
            'email' => 'nullable|email',
            'date_of_birth' => 'nullable|date',
            'gender' => 'nullable|string|max:30',
            'blood_group' => 'nullable|string|max:10',
            'address' => 'nullable|string|max:255',
        ]);

        $patient->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Patient updated successfully.',
            'data' => $patient,
        ]);
    }

    /*
     * ---------------------------------------------------------
     * QUEUE
     * ---------------------------------------------------------
     */

    public function queue(Request $request)
    {
        $clinicId = $this->clinicId($request);

        $queue = QueueToken::with(['patient', 'doctor.user', 'counter'])
            ->where('clinic_id', $clinicId)
            ->whereIn('status', ['waiting', 'called'])
            ->orderBy('token_number')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $queue,
        ]);
    }

    public function issueToken(Request $request)
    {
        $clinicId = $this->clinicId($request);

        $validated = $request->validate([
            'doctor_id' => 'required|integer',
            'patient_id' => 'required|integer',
        ]);

        $doctor = Doctor::where('clinic_id', $clinicId)
            ->where('doctor_id', $validated['doctor_id'])
            ->where('is_active', true)
            ->firstOrFail();

        $patient = Patient::where('clinic_id', $clinicId)
            ->where('patient_id', $validated['patient_id'])
            ->firstOrFail();

        $lastToken = QueueToken::where('clinic_id', $clinicId)
            ->max('token_number');

        $tokenNumber = ($lastToken ?? 100) + 1;

        $waiting = QueueToken::where('clinic_id', $clinicId)
            ->where('status', 'waiting')
            ->count();

        $token = QueueToken::create([
            'clinic_id' => $clinicId,
            'doctor_id' => $doctor->doctor_id,
            'patient_id' => $patient->patient_id,
            'counter_id' => null,
            'token_number' => $tokenNumber,
            'status' => 'waiting',
            'check_in_time' => now(),
            'est_wait_time' => $waiting * ($doctor->avg_consult_min ?? 15),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Queue token issued successfully.',
            'data' => $token->load(['patient', 'doctor.user']),
        ], 201);
    }

    public function updateQueue(Request $request, $tokenId)
    {
        $clinicId = $this->clinicId($request);

        $token = QueueToken::where('clinic_id', $clinicId)
            ->where('token_id', $tokenId)
            ->firstOrFail();

        $validated = $request->validate([
            'status' => 'required|in:waiting,called,completed,skipped',
        ]);

        $data = [
            'status' => $validated['status'],
        ];

        if ($validated['status'] === 'called') {
            $data['called_time'] = now();
        }

        if (in_array($validated['status'], ['completed', 'skipped'])) {
            $data['completed_time'] = now();
        }

        $token->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Queue updated successfully.',
            'data' => $token->fresh()->load(['patient', 'doctor.user']),
        ]);
    }
}