<?php

namespace App\Http\Services;

use Illuminate\Support\Facades\DB;

class AdminDashboardService
{
    public function getDashboardData()
    {
        // Doctor activity
        $doctorActivity = [
            'total_doctors' => DB::table('doctors')->count(),

            'available' => DB::table('doctors')
                ->where('availability_status', 'available')
                ->count(),

            'unavailable' => DB::table('doctors')
                ->where('availability_status', 'unavailable')
                ->count(),
        ];

        // Subscription and clinic status
        $subscriptionStatus = [
            'total_clinics' => DB::table('clinics')->count(),

            'active_clinics' => DB::table('clinics')
                ->where('status', 'active')
                ->count(),

            'inactive_clinics' => DB::table('clinics')
                ->where('status', '!=', 'active')
                ->count(),

            'total_plans' => DB::table('subscription_plans')->count(),
        ];

        return [
            'doctor_activity' => $doctorActivity,
            'subscription_status' => $subscriptionStatus,
        ];
    }

    public function getClinics()
    {
        return $this->clinicQuery()
            ->orderBy('c.name')
            ->get();
    }

    public function getClinicDetails($clinicId)
    {
        return $this->clinicQuery()
            ->where('c.clinic_id', $clinicId)
            ->first();
    }

    private function clinicQuery()
    {
        return DB::table('clinics as c')
            ->leftJoin(
                'subscription_plans as sp',
                'c.plan_id',
                '=',
                'sp.plan_id'
            )
            ->select(
                'c.clinic_id',
                'c.name',
                'c.address',
                'c.phone',
                'c.email',
                'c.status',
                'c.created_at',
                'c.plan_id',
                'sp.name as plan_name'
            )
            ->addSelect([
                'recent_doctor_name' => DB::table('doctors as d')
                    ->join('users as u', 'u.id', '=', 'd.user_id')
                    ->select('u.name')
                    ->whereColumn('d.clinic_id', 'c.clinic_id')
                    ->orderByDesc('u.created_at')
                    ->orderByDesc('d.doctor_id')
                    ->limit(1),
                'recent_doctor_specialty' => DB::table('doctors as d')
                    ->select('d.specialization')
                    ->join('users as u', 'u.id', '=', 'd.user_id')
                    ->whereColumn('d.clinic_id', 'c.clinic_id')
                    ->orderByDesc('u.created_at')
                    ->orderByDesc('d.doctor_id')
                    ->limit(1),
                'recent_doctor_created_at' => DB::table('doctors as d')
                    ->join('users as u', 'u.id', '=', 'd.user_id')
                    ->select('u.created_at')
                    ->whereColumn('d.clinic_id', 'c.clinic_id')
                    ->orderByDesc('u.created_at')
                    ->orderByDesc('d.doctor_id')
                    ->limit(1),
                'recent_patient_name' => DB::table('queue_tokens as qt')
                    ->join('patients as p', 'p.patient_id', '=', 'qt.patient_id')
                    ->select('p.name')
                    ->whereColumn('qt.clinic_id', 'c.clinic_id')
                    ->whereNotNull('qt.check_in_time')
                    ->orderByDesc('qt.check_in_time')
                    ->orderByDesc('qt.token_id')
                    ->limit(1),
                'recent_patient_seen_at' => DB::table('queue_tokens as qt')
                    ->select('qt.check_in_time')
                    ->whereColumn('qt.clinic_id', 'c.clinic_id')
                    ->whereNotNull('qt.check_in_time')
                    ->orderByDesc('qt.check_in_time')
                    ->orderByDesc('qt.token_id')
                    ->limit(1),
            ]);
    }
}
