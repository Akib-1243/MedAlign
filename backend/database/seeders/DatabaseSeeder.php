<?php

namespace Database\Seeders;

use App\Models\Doctor;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        // Wipe tables for a clean re-seed
        foreach ([
            'prescription_items',
            'prescriptions',
            'prescription_templates',
            'alert_preferences',
            'queue_tokens',
            'doctor_schedules',
            'counters',
            'doctors',
            'daily_analytics',
            'invoices',
            'clinics',
            'subscription_plans',
            'patients',
        ] as $t) {
            DB::table($t)->truncate();
        }

        User::whereIn('role', ['admin', 'doctor', 'reception'])->delete();

        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // ── 1. Subscription Plans ─────────────────────────────────────────

        $planStarter = DB::table('subscription_plans')->insertGetId([
            'name'          => 'Starter',
            'price'         => 5000.00,
            'billing_cycle' => 'monthly',
            'max_doctors'   => 5,
            'features'      => 'Basic queue, 1 counter, email alerts',
        ]);

        $planPro = DB::table('subscription_plans')->insertGetId([
            'name'          => 'Clinic Pro',
            'price'         => 15000.00,
            'billing_cycle' => 'monthly',
            'max_doctors'   => 25,
            'features'      => 'Queue management, prescriptions, analytics, multi-doctor',
        ]);

        // ── 2. Clinics ────────────────────────────────────────────────────

        $mainClinic = DB::table('clinics')->insertGetId([
            'plan_id' => $planPro,
            'name'    => 'MedAlign Health Centre',
            'address' => '24 Crescent Road, Health District',
            'phone'   => '+1 555 0100',
            'email'   => 'hello@medalign.test',
            'status'  => 'active',
        ]);

        $branchClinic = DB::table('clinics')->insertGetId([
            'plan_id' => $planStarter,
            'name'    => 'MedAlign Branch — Eastside',
            'address' => '78 Lakeside Avenue, Eastside',
            'phone'   => '+1 555 0200',
            'email'   => 'east@medalign.test',
            'status'  => 'active',
        ]);

        // ── 3. Admin User ──────────────────────────────────────────────────

        User::firstOrCreate(['email' => 'admin@medalign.test'], [
            'name'              => 'Admin',
            'password'          => Hash::make('password'),
            'role'              => 'admin',
            'clinic_id'         => $mainClinic,
            'email_verified_at' => now(),
        ]);

        // ── 3b. Receptionist User ───────────────────────────────────────
User::firstOrCreate(['email' => 'reception@medalign.test'], [
    'name'              => 'Receptionist',
    'password'          => Hash::make('password'),
    'role'              => 'reception',
    'clinic_id'         => $mainClinic,
    'email_verified_at' => now(),
]);

        // ── 4. Doctors ────────────────────────────────────────────────────

        $doctorSpecs = [
            ['Dr. Sarah Ahmed',  'doctor1@medalign.test', 'Cardiology',        15, 'available'],
            ['Dr. James Okafor', 'doctor2@medalign.test', 'Orthopedics',        20, 'available'],
            ['Dr. Priya Sharma', 'doctor3@medalign.test', 'Neurology',          25, 'available'],
            ['Dr. Carlos Reyes', 'doctor4@medalign.test', 'General Practice',   12, 'unavailable'],
            ['Dr. Hina Malik',   'doctor5@medalign.test', 'Pediatrics',         18, 'available'],
        ];

        $doctorIds = [];
        $doctorUserIds = [];

        foreach ($doctorSpecs as [$name, $email, $spec, $avgMin, $status]) {
            $u = User::firstOrCreate(['email' => $email], [
                'name'              => $name,
                'password'          => Hash::make('password'),
                'role'              => 'doctor',
                'clinic_id'         => $mainClinic,
                'email_verified_at' => now(),
            ]);

            $d = Doctor::firstOrCreate(['user_id' => $u->id], [
                'clinic_id'          => $mainClinic,
                'specialization'     => $spec,
                'avg_consult_min'    => $avgMin,
                'availability_status' => $status,
            ]);

            $doctorIds[] = $d->doctor_id;
            $doctorUserIds[] = $u->id;
        }

        // Doctor schedules (Mon–Fri, 09:00–17:00)

        $days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

        foreach ($doctorIds as $did) {
            foreach ($days as $day) {
                DB::table('doctor_schedules')->insertOrIgnore([
                    'doctor_id'   => $did,
                    'day_of_week' => $day,
                    'start_time'  => '09:00:00',
                    'end_time'    => '17:00:00',
                ]);
            }
        }

        // ── 5. Counters ───────────────────────────────────────────────────

        $counterIds = [];

        for ($c = 1; $c <= 4; $c++) {
            $counterIds[] = DB::table('counters')->insertGetId([
                'clinic_id'      => $mainClinic,
                'counter_number' => $c,
                'counter_name'   => "Room 10{$c}",
            ]);
        }

        // ── 6. Patients ───────────────────────────────────────────────────

        $patientsData = [
            ['Amina Yusuf',      '+1 555 0101', '1988-04-12', 'amina@test.org',   'Female'],
            ['Michael Chen',     '+1 555 0102', '1979-11-03', 'michael@test.org', 'Male'],
            ['Priya Nair',       '+1 555 0103', '1994-07-28', 'priya@test.org',   'Female'],
            ['Jon Bell',         '+1 555 0104', '1967-02-16', 'jon@test.org',     'Male'],
            ['Lina Gomez',       '+1 555 0105', '1982-09-08', 'lina@test.org',    'Female'],
            ['Noah Williams',    '+1 555 0106', '1990-01-21', 'noah@test.org',    'Male'],
            ['Fatima Al-Hassan', '+1 555 0107', '1997-03-15', 'fatima@test.org',  'Female'],
            ['David Kim',        '+1 555 0108', '1975-08-22', 'david@test.org',   'Male'],
            ['Sofia Rossi',      '+1 555 0109', '2001-12-05', 'sofia@test.org',   'Female'],
            ['Omar Farooq',      '+1 555 0110', '1985-06-30', 'omar@test.org',    'Male'],
            ['Elena Petrova',   '+1 555 0111', '1992-09-18', 'elena@test.org',    'Female'],
            ['James Oduya',      '+1 555 0112', '1969-04-07', 'james@test.org',   'Male'],
        ];

        $patientIds = [];

        foreach ($patientsData as [$name, $phone, $dob, $email, $gender]) {
            $p = Patient::firstOrCreate(['phone' => $phone], [
                'name'   => $name,
                'email'  => $email,
                'dob'    => $dob,
                'gender' => $gender,
            ]);

            $patientIds[] = $p->patient_id;

            DB::table('alert_preferences')->insertOrIgnore([
                'patient_id'          => $p->patient_id,
                'sms_enabled'         => (bool) rand(0, 1),
                'whatsapp_enabled'    => (bool) rand(0, 1),
                'near_turn_threshold' => rand(2, 5),
            ]);
        }

        // ── 7. Queue Tokens — Today's Queue for Doctor 1 (Cardiology) ─────

        // token_number: 101..112
        // status: completed(1), called(1), waiting(rest)

        $statusMap = [
            0 => 'completed',
            1 => 'called',
            // rest: waiting
        ];

        $assignedDoctorId = $doctorIds[0]; // Dr. Sarah Ahmed

        foreach ($patientIds as $idx => $pid) {
            $status = $statusMap[$idx] ?? 'waiting';

            $checkIn = now()->subMinutes(110 - ($idx * 8));

            $calledTime = null;
            $completedTime = null;

            if ($status === 'called') {
                $calledTime = now()->subMinutes(10);
            }

            if ($status === 'completed') {
                $calledTime = now()->subMinutes(35);
                $completedTime = now()->subMinutes(18);
            }

            $tokenId = DB::table('queue_tokens')->insertGetId([
                'clinic_id'       => $mainClinic,
                'doctor_id'       => $assignedDoctorId,
                'counter_id'      => $counterIds[0],
                'patient_id'      => $pid,
                'token_number'    => 101 + $idx,
                'status'          => $status,
                'check_in_time'   => $checkIn,
                'called_time'     => $calledTime,
                'completed_time'  => $completedTime,
                'est_wait_time'   => $idx * 15,
            ]);

            // Prescription for completed patient

            if ($status === 'completed') {
                $rxId = DB::table('prescriptions')->insertGetId([
                    'token_id'   => $tokenId,
                    'doctor_id'  => $assignedDoctorId,
                    'patient_id' => $pid,
                    'notes'      => 'Patient responded well to respiratory therapy. Follow up in 2 weeks. Rest and hydration advised.',
                    'issued_at'  => now()->subMinutes(18),
                ]);

                DB::table('prescription_items')->insert([
                    [
                        'prescription_id' => $rxId,
                        'medicine_name'   => 'Amoxicillin 500mg',
                        'dosage'          => '1 capsule',
                        'frequency'       => '3x daily',
                        'duration'        => '7 days',
                        'instructions'    => 'After meals'
                    ],
                    [
                        'prescription_id' => $rxId,
                        'medicine_name'   => 'Paracetamol 500mg',
                        'dosage'          => '1-2 tablets',
                        'frequency'       => 'Every 6h if fever',
                        'duration'        => '3 days',
                        'instructions'    => 'As needed'
                    ],
                    [
                        'prescription_id' => $rxId,
                        'medicine_name'   => 'Vitamin C 1000mg',
                        'dosage'          => '1 tablet',
                        'frequency'       => 'Once daily after lunch',
                        'duration'        => '30 days',
                        'instructions'    => 'Immunity support'
                    ],
                ]);
            }
        }

        // ── 7b. Rich Multi-visit Clinical History for Patients ─────────────

        // Patient 2 (Michael Chen - currently active in Doctor Consultation Desk)

        $p2 = $patientIds[1] ?? 2;

        $rxP2_1 = DB::table('prescriptions')->insertGetId([
            'token_id'   => null,
            'doctor_id'  => $doctorIds[0],
            'patient_id' => $p2,
            'notes'      => 'Stage 1 Essential Hypertension diagnosed. Patient advised low-sodium diet and daily BP log.',
            'issued_at'  => now()->subMonths(2),
        ]);

        DB::table('prescription_items')->insert([
            [
                'prescription_id' => $rxP2_1,
                'medicine_name'   => 'Amlodipine 5mg',
                'dosage'          => '1 tablet',
                'frequency'       => 'Once daily (morning)',
                'duration'        => '60 days',
                'instructions'    => 'Take before breakfast with water.'
            ],
            [
                'prescription_id' => $rxP2_1,
                'medicine_name'   => 'Hydrochlorothiazide 12.5mg',
                'dosage'          => '1 tablet',
                'frequency'       => 'Once daily (morning)',
                'duration'        => '30 days',
                'instructions'    => 'Monitor potassium levels.'
            ],
        ]);

        $rxP2_2 = DB::table('prescriptions')->insertGetId([
            'token_id'   => null,
            'doctor_id'  => $doctorIds[1],
            'patient_id' => $p2,
            'notes'      => 'Right knee strain from running. Swelling resolved with cold compression. Physiotherapy recommended.',
            'issued_at'  => now()->subDays(21),
        ]);

        DB::table('prescription_items')->insert([
            [
                'prescription_id' => $rxP2_2,
                'medicine_name'   => 'Ibuprofen 400mg',
                'dosage'          => '1 tablet',
                'frequency'       => 'Twice daily after meals',
                'duration'        => '5 days',
                'instructions'    => 'Take with full stomach.'
            ],
            [
                'prescription_id' => $rxP2_2,
                'medicine_name'   => 'Glucosamine Sulfate 1500mg',
                'dosage'          => '1 sachet',
                'frequency'       => 'Once daily',
                'duration'        => '30 days',
                'instructions'    => 'Dissolve in warm water.'
            ],
        ]);

        // Patient 1 (Amina Yusuf)

        $p1 = $patientIds[0] ?? 1;

        $rxP1_1 = DB::table('prescriptions')->insertGetId([
            'token_id'   => null,
            'doctor_id'  => $doctorIds[0],
            'patient_id' => $p1,
            'notes'      => 'Mild sinus congestion and allergic rhinitis. Symptoms improving.',
            'issued_at'  => now()->subMonths(1),
        ]);

        DB::table('prescription_items')->insert([
            [
                'prescription_id' => $rxP1_1,
                'medicine_name'   => 'Cetirizine 10mg',
                'dosage'          => '1 tablet',
                'frequency'       => 'Once daily (night)',
                'duration'        => '14 days',
                'instructions'    => 'Avoid driving if drowsy.'
            ],
            [
                'prescription_id' => $rxP1_1,
                'medicine_name'   => 'Fluticasone Nasal Spray 50mcg',
                'dosage'          => '2 sprays each nostril',
                'frequency'       => 'Once daily',
                'duration'        => '30 days',
                'instructions'    => 'Shake well before use.'
            ],
        ]);

        // Extra prescriptions for other patients

        foreach ([1, 2, 3] as $di) {
            foreach ([3, 4, 5, 6, 7] as $pi) {
                if (!isset($patientIds[$pi])) {
                    continue;
                }

                $rxId = DB::table('prescriptions')->insertGetId([
                    'token_id'   => null,
                    'doctor_id'  => $doctorIds[$di],
                    'patient_id' => $patientIds[$pi],
                    'notes'      => 'Routine follow-up consultation. Patient is adhering well to prescribed regimen.',
                    'issued_at'  => now()->subDays(rand(5, 45)),
                ]);

                DB::table('prescription_items')->insert([
                    [
                        'prescription_id' => $rxId,
                        'medicine_name'   => 'Metformin 500mg',
                        'dosage'          => '1 tablet',
                        'frequency'       => 'Twice daily',
                        'duration'        => '30 days',
                        'instructions'    => 'With meals'
                    ],
                    [
                        'prescription_id' => $rxId,
                        'medicine_name'   => 'Atorvastatin 20mg',
                        'dosage'          => '1 tablet',
                        'frequency'       => 'Once daily (bedtime)',
                        'duration'        => '30 days',
                        'instructions'    => 'Take at night'
                    ],
                ]);
            }
        }

        // ── 8. Daily Analytics (30 days for charts) ───────────────────────

        for ($d = 29; $d >= 0; $d--) {
            $isWeekend = in_array(
                now()->subDays($d)->dayOfWeek,
                [0, 6]
            );

            $patients = $isWeekend ? rand(20, 35) : rand(45, 85);

            DB::table('daily_analytics')->updateOrInsert(
                [
                    'clinic_id' => $mainClinic,
                    'date'      => now()->subDays($d)->toDateString()
                ],
                [
                    'total_patients' => $patients,
                    'avg_wait_time'  => rand(10, 22),
                    'walkout_rate'   => round(1.5 + (rand(0, 30) / 10), 2),
                ]
            );
        }

        // Branch clinic analytics

        for ($d = 29; $d >= 0; $d--) {
            DB::table('daily_analytics')->updateOrInsert(
                [
                    'clinic_id' => $branchClinic,
                    'date'      => now()->subDays($d)->toDateString()
                ],
                [
                    'total_patients' => rand(15, 30),
                    'avg_wait_time'  => rand(8, 18),
                    'walkout_rate'   => round(1.0 + (rand(0, 20) / 10), 2),
                ]
            );
        }

        // ── 9. Invoices ───────────────────────────────────────────────────

        DB::table('invoices')->insert([
            [
                'clinic_id'   => $mainClinic,
                'plan_id'     => $planPro,
                'amount'      => 15000.00,
                'status'      => 'paid',
                'issued_date' => now()->subDays(30)->toDateString(),
                'due_date'    => now()->subDays(2)->toDateString()
            ],
            [
                'clinic_id'   => $mainClinic,
                'plan_id'     => $planPro,
                'amount'      => 15000.00,
                'status'      => 'pending',
                'issued_date' => now()->toDateString(),
                'due_date'    => now()->addDays(28)->toDateString()
            ],
            [
                'clinic_id'   => $branchClinic,
                'plan_id'     => $planStarter,
                'amount'      => 5000.00,
                'status'      => 'paid',
                'issued_date' => now()->subDays(30)->toDateString(),
                'due_date'    => now()->subDays(2)->toDateString()
            ],
        ]);
    }
}
