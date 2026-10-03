<?php

namespace App\Http\Services;

use Illuminate\Support\Facades\DB;

class AdminDashboardService
{
    public function getDashboardData()
    {
        // 1. Queue Snapshot
        $queueSnapshot = [
            'waiting' => DB::table('queue_tokens')
                ->where('status', 'waiting')
                ->count(),

            'called' => DB::table('queue_tokens')
                ->where('status', 'called')
                ->count(),

            'completed' => DB::table('queue_tokens')
                ->where('status', 'completed')
                ->count(),

            'total' => DB::table('queue_tokens')->count(),
        ];

        // 2. Doctor Activity
        $doctorActivity = [
            'total_doctors' => DB::table('doctors')->count(),

            'available' => DB::table('doctors')
                ->where('availability_status', 'available')
                ->count(),

            'unavailable' => DB::table('doctors')
                ->where('availability_status', 'unavailable')
                ->count(),
        ];

        // 3. Subscription Status
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

        // 4. Analytics
        $analytics = [
            'total_patients' => DB::table('daily_analytics')
                ->sum('total_patients'),

            'average_wait_time' => round(
                (float) (DB::table('daily_analytics')
                    ->avg('avg_wait_time') ?? 0),
                2
            ),

            'average_walkout_rate' => round(
                (float) (DB::table('daily_analytics')
                    ->avg('walkout_rate') ?? 0),
                2
            ),

            'analytics_days' => DB::table('daily_analytics')->count(),
        ];

        return [
            'queue_snapshot' => $queueSnapshot,
            'doctor_activity' => $doctorActivity,
            'subscription_status' => $subscriptionStatus,
            'analytics' => $analytics,
        ];
    }
}
