<?php

namespace Tests\Unit;

use App\Http\Services\AdminDashboardService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AdminDashboardServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_excludes_queue_details_and_clinic_queries_return_clinic_data(): void
    {
        $planId = DB::table('subscription_plans')->insertGetId([
            'name' => 'Starter',
            'price' => 0,
            'billing_cycle' => 'monthly',
            'max_doctors' => 5,
        ]);

        $clinicId = DB::table('clinics')->insertGetId([
            'plan_id' => $planId,
            'name' => 'MedAlign Clinic',
            'address' => '10 Main Street',
            'phone' => '555-0100',
            'email' => 'clinic@example.test',
            'status' => 'active',
            'created_at' => now()->subDays(4),
        ]);

        $doctorUserId = DB::table('users')->insertGetId([
            'clinic_id' => $clinicId,
            'name' => 'Dr. Recent Doctor',
            'email' => 'recent-doctor@example.test',
            'password' => 'test-password',
            'role' => 'doctor',
            'created_at' => now()->subDay(),
            'updated_at' => now()->subDay(),
        ]);
        DB::table('doctors')->insert([
            'user_id' => $doctorUserId,
            'clinic_id' => $clinicId,
            'specialization' => 'Cardiology',
            'availability_status' => 'available',
        ]);

        $patientId = DB::table('patients')->insertGetId([
            'name' => 'Recent Patient',
            'phone' => '555-0199',
            'created_at' => now(),
        ]);
        DB::table('queue_tokens')->insert([
            'clinic_id' => $clinicId,
            'patient_id' => $patientId,
            'token_number' => 1,
            'status' => 'completed',
            'check_in_time' => now(),
        ]);

        $service = app(AdminDashboardService::class);
        $dashboard = $service->getDashboardData();
        $clinics = $service->getClinics();
        $clinic = $service->getClinicDetails($clinicId);

        $this->assertArrayNotHasKey('queue_snapshot', $dashboard);
        $this->assertArrayNotHasKey('analytics', $dashboard);
        $this->assertCount(1, $clinics);
        $this->assertSame('MedAlign Clinic', $clinics[0]->name);
        $this->assertSame('Starter', $clinics[0]->plan_name);
        $this->assertSame('Dr. Recent Doctor', $clinics[0]->recent_doctor_name);
        $this->assertSame('Cardiology', $clinics[0]->recent_doctor_specialty);
        $this->assertSame('Recent Patient', $clinics[0]->recent_patient_name);
        $this->assertNotNull($clinics[0]->created_at);
        $this->assertNotNull($clinics[0]->recent_patient_seen_at);
        $this->assertSame($clinicId, $clinic->clinic_id);
    }
}
