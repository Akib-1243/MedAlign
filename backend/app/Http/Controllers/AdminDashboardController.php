<?php

namespace App\Http\Controllers;

use App\Http\Services\AdminDashboardService;
use App\Models\Doctor;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AdminDashboardController extends Controller
{
    public function __construct(
        private AdminDashboardService $dashboardService
    ) {}

    /** GET /admin/dashboard — KPI stats from DB */
    public function index()
    {
        return $this->dashboardService->getDashboardData();
    }

    /** GET /admin/doctors — list all doctors with user info */
    public function listDoctors()
    {
        $doctors = Doctor::with(['user', 'clinic'])->get()->map(fn($d) => [
            'doctor_id'           => $d->doctor_id,
            'name'                => $d->user?->name ?? 'Unknown',
            'email'               => $d->user?->email ?? '',
            'phone'               => $d->user?->phone ?? '',
            'specialization'      => $d->specialization,
            'avg_consult_min'     => $d->avg_consult_min,
            'availability_status' => $d->availability_status,
            'clinic'              => $d->clinic?->name ?? 'Unassigned',
            'clinic_id'           => $d->clinic_id,
            'user_id'             => $d->user_id,
            'verified'            => (bool) $d->user?->email_verified_at,
        ]);

        return response()->json(['success' => true, 'data' => $doctors]);
    }

    /** POST /admin/doctors — admin creates a new doctor account directly */
    public function addDoctor(Request $request)
    {
        $data = $request->validate([
            'name'           => 'required|string|max:100',
            'email'          => 'required|email|unique:users,email',
            'phone'          => 'nullable|string|max:20',
            'password'       => 'required|string|min:6',
            'specialization' => 'required|string|max:50',
            'avg_consult_min'=> 'nullable|integer|min:5|max:60',
            'clinic_id'      => 'nullable|integer|exists:clinics,clinic_id',
        ]);

        $clinicId = $data['clinic_id'] ?? DB::table('clinics')->value('clinic_id') ?? 1;

        // Create user with role=doctor, pre-verified (admin-created accounts skip OTP)
        $user = User::create([
            'name'              => $data['name'],
            'email'             => $data['email'],
            'phone'             => $data['phone'] ?? null,
            'password'          => Hash::make($data['password']),
            'role'              => 'doctor',
            'clinic_id'         => $clinicId,
            'email_verified_at' => now(), // admin-created: skip OTP
        ]);

        // Provision doctor profile
        $doctor = Doctor::create([
            'user_id'             => $user->id,
            'clinic_id'           => $clinicId,
            'specialization'      => $data['specialization'],
            'avg_consult_min'     => $data['avg_consult_min'] ?? 15,
            'availability_status' => 'available',
        ]);

        return response()->json([
            'success' => true,
            'message' => "Doctor account created successfully. {$data['name']} can now log in.",
            'doctor'  => [
                'doctor_id'      => $doctor->doctor_id,
                'name'           => $user->name,
                'email'          => $user->email,
                'specialization' => $doctor->specialization,
            ],
        ], 201);
    }

    /** PATCH /admin/doctors/{doctor_id} — update doctor info / availability */
    public function updateDoctor(Request $request, $doctor_id)
    {
        $doctor = Doctor::with('user')->findOrFail($doctor_id);

        $data = $request->validate([
            'name'                => 'nullable|string|max:100',
            'phone'               => 'nullable|string|max:20',
            'specialization'      => 'nullable|string|max:50',
            'avg_consult_min'     => 'nullable|integer|min:5|max:60',
            'availability_status' => 'nullable|in:available,unavailable',
        ]);

        if ($doctor->user) {
            $userUpdate = array_filter([
                'name'  => $data['name'] ?? null,
                'phone' => $data['phone'] ?? null,
            ]);
            if ($userUpdate) $doctor->user->update($userUpdate);
        }

        $doctorUpdate = array_filter([
            'specialization'      => $data['specialization'] ?? null,
            'avg_consult_min'     => $data['avg_consult_min'] ?? null,
            'availability_status' => $data['availability_status'] ?? null,
        ]);
        if ($doctorUpdate) $doctor->update($doctorUpdate);

        return response()->json(['success' => true, 'message' => 'Doctor updated successfully.']);
    }

    /** DELETE /admin/doctors/{doctor_id} — remove a doctor */
    public function deleteDoctor($doctor_id)
    {
        $doctor = Doctor::findOrFail($doctor_id);
        $userId = $doctor->user_id;
        $doctor->delete();
        User::where('id', $userId)->delete();

        return response()->json(['success' => true, 'message' => 'Doctor removed from system.']);
    }

    /** GET /admin/patients — list all patients */
    public function listPatients()
    {
        $patients = DB::table('patients')
            ->orderByDesc('patient_id')
            ->limit(100)
            ->get();

        return response()->json(['success' => true, 'data' => $patients]);
    }

    /** GET /admin/queue — live queue monitor across all doctors */
    public function liveQueue()
    {
        $tokens = DB::table('queue_tokens as qt')
            ->leftJoin('patients as p', 'p.patient_id', '=', 'qt.patient_id')
            ->leftJoin('doctors as d', 'd.doctor_id', '=', 'qt.doctor_id')
            ->leftJoin('users as u', 'u.id', '=', 'd.user_id')
            ->leftJoin('counters as c', 'c.counter_id', '=', 'qt.counter_id')
            ->select([
                'qt.token_id',
                'qt.token_number',
                'qt.status',
                'qt.check_in_time',
                'qt.called_time',
                'qt.completed_time',
                'p.name as patient_name',
                'p.phone as patient_phone',
                'u.name as doctor_name',
                'd.specialization',
                'c.counter_name',
            ])
            ->orderByDesc('qt.check_in_time')
            ->limit(50)
            ->get();

        return response()->json(['success' => true, 'data' => $tokens]);
    }
}
