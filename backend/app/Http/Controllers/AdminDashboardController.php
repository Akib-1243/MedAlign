<?php

namespace App\Http\Controllers;

use App\Http\Services\AdminDashboardService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminDashboardController extends Controller
{
    protected AdminDashboardService $dashboardService;

    public function __construct(AdminDashboardService $dashboardService)
    {
        $this->dashboardService = $dashboardService;
    }


    /*
    |--------------------------------------------------------------------------
    | Dashboard
    |--------------------------------------------------------------------------
    */

    public function index()
    {
        $data = $this->dashboardService->getDashboardData();

        return response()->json($data);
    }


    /*
    |--------------------------------------------------------------------------
    | Clinics / Hospitals
    |--------------------------------------------------------------------------
    */

    public function listClinics()
    {
        $clinics = $this->dashboardService->getClinics();

        return response()->json([
            'clinics' => $clinics
        ]);
    }


    public function clinicDetails($clinic_id)
    {
        $clinic = $this->dashboardService->getClinicDetails($clinic_id);

        if (!$clinic) {
            return response()->json([
                'message' => 'Clinic not found.'
            ], 404);
        }

        return response()->json([
            'clinic' => $clinic
        ]);
    }


    public function activateClinic($clinic_id)
    {
        $clinic = DB::table('clinics')
            ->where('clinic_id', $clinic_id)
            ->first();

        if (!$clinic) {
            return response()->json([
                'message' => 'Clinic not found.'
            ], 404);
        }

        DB::table('clinics')
            ->where('clinic_id', $clinic_id)
            ->update([
                'status' => 'active'
            ]);

        return response()->json([
            'message' => 'Clinic activated successfully.'
        ]);
    }


    public function deactivateClinic($clinic_id)
    {
        $clinic = DB::table('clinics')
            ->where('clinic_id', $clinic_id)
            ->first();

        if (!$clinic) {
            return response()->json([
                'message' => 'Clinic not found.'
            ], 404);
        }

        DB::table('clinics')
            ->where('clinic_id', $clinic_id)
            ->update([
                'status' => 'inactive'
            ]);

        return response()->json([
            'message' => 'Clinic deactivated successfully.'
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | Subscription Plans
    |--------------------------------------------------------------------------
    */

    public function listSubscriptionPlans()
    {
        $plans = DB::table('subscription_plans')
            ->orderBy('price', 'asc')
            ->get();

        return response()->json([
            'plans' => $plans
        ]);
    }


    public function addSubscriptionPlan(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'price' => 'required|numeric|min:0',
            'billing_cycle' => 'required|in:monthly,yearly',
            'max_doctors' => 'required|integer|min:1',
            'features' => 'nullable|string',
        ]);

        $planId = DB::table('subscription_plans')->insertGetId([
            'name' => $validated['name'],
            'price' => $validated['price'],
            'billing_cycle' => $validated['billing_cycle'],
            'max_doctors' => $validated['max_doctors'],
            'features' => $validated['features'] ?? null,
        ]);

        $plan = DB::table('subscription_plans')
            ->where('plan_id', $planId)
            ->first();

        return response()->json([
            'message' => 'Subscription plan created successfully.',
            'plan' => $plan,
        ], 201);
    }


    public function updateSubscriptionPlan(Request $request, $plan_id)
    {
        $plan = DB::table('subscription_plans')
            ->where('plan_id', $plan_id)
            ->first();

        if (!$plan) {
            return response()->json([
                'message' => 'Subscription plan not found.'
            ], 404);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'price' => 'required|numeric|min:0',
            'billing_cycle' => 'required|in:monthly,yearly',
            'max_doctors' => 'required|integer|min:1',
            'features' => 'nullable|string',
        ]);

        DB::table('subscription_plans')
            ->where('plan_id', $plan_id)
            ->update([
                'name' => $validated['name'],
                'price' => $validated['price'],
                'billing_cycle' => $validated['billing_cycle'],
                'max_doctors' => $validated['max_doctors'],
                'features' => $validated['features'] ?? null,
            ]);

        $updatedPlan = DB::table('subscription_plans')
            ->where('plan_id', $plan_id)
            ->first();

        return response()->json([
            'message' => 'Subscription plan updated successfully.',
            'plan' => $updatedPlan,
        ]);
    }


    public function deleteSubscriptionPlan($plan_id)
    {
        $plan = DB::table('subscription_plans')
            ->where('plan_id', $plan_id)
            ->first();

        if (!$plan) {
            return response()->json([
                'message' => 'Subscription plan not found.'
            ], 404);
        }

        /*
        |--------------------------------------------------------------------------
        | Do not delete a plan that is currently assigned to a clinic.
        |--------------------------------------------------------------------------
        */

        $clinicUsingPlan = DB::table('clinics')
            ->where('plan_id', $plan_id)
            ->exists();

        if ($clinicUsingPlan) {
            return response()->json([
                'message' => 'This plan cannot be deleted because one or more clinics are currently using it.'
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | Do not delete a plan that appears in invoice history.
        |--------------------------------------------------------------------------
        */

        $planUsedInInvoices = DB::table('invoices')
            ->where('plan_id', $plan_id)
            ->exists();

        if ($planUsedInInvoices) {
            return response()->json([
                'message' => 'This plan cannot be deleted because it is used in invoice history.'
            ], 422);
        }

        DB::table('subscription_plans')
            ->where('plan_id', $plan_id)
            ->delete();

        return response()->json([
            'message' => 'Subscription plan deleted successfully.'
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | Clinic Subscription
    |--------------------------------------------------------------------------
    */

    public function clinicSubscription($clinic_id)
    {
        $clinic = DB::table('clinics as c')
            ->leftJoin(
                'subscription_plans as sp',
                'c.plan_id',
                '=',
                'sp.plan_id'
            )
            ->where('c.clinic_id', $clinic_id)
            ->select(
                'c.clinic_id',
                'c.name',
                'c.status',
                'c.plan_id',
                'sp.name as plan_name',
                'sp.price as plan_price',
                'sp.billing_cycle',
                'sp.max_doctors',
                'sp.features'
            )
            ->first();

        if (!$clinic) {
            return response()->json([
                'message' => 'Clinic not found.'
            ], 404);
        }

        $invoices = DB::table('invoices')
            ->where('clinic_id', $clinic_id)
            ->orderByDesc('issued_date')
            ->get();

        return response()->json([
            'clinic' => $clinic,
            'invoices' => $invoices
        ]);
    }


    public function updateClinicPlan(Request $request, $clinic_id)
    {
        $validated = $request->validate([
            'plan_id' => 'required|exists:subscription_plans,plan_id',
        ]);

        $clinic = DB::table('clinics')
            ->where('clinic_id', $clinic_id)
            ->first();

        if (!$clinic) {
            return response()->json([
                'message' => 'Clinic not found.'
            ], 404);
        }

        DB::table('clinics')
            ->where('clinic_id', $clinic_id)
            ->update([
                'plan_id' => $validated['plan_id']
            ]);

        $updatedClinic = DB::table('clinics as c')
            ->leftJoin(
                'subscription_plans as sp',
                'c.plan_id',
                '=',
                'sp.plan_id'
            )
            ->where('c.clinic_id', $clinic_id)
            ->select(
                'c.clinic_id',
                'c.name',
                'c.status',
                'c.plan_id',
                'sp.name as plan_name',
                'sp.price as plan_price',
                'sp.billing_cycle',
                'sp.max_doctors',
                'sp.features'
            )
            ->first();

        return response()->json([
            'message' => 'Clinic subscription plan updated successfully.',
            'clinic' => $updatedClinic
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | Doctors
    |--------------------------------------------------------------------------
    */

    public function listDoctors()
    {
        $doctors = $this->dashboardService->getDoctors();

        return response()->json([
            'doctors' => $doctors
        ]);
    }


    public function addDoctor(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'email' => 'required|email',
            'phone' => 'nullable|string|max:30',
            'specialization' => 'required|string|max:100',
            'clinic_id' => 'required|integer|exists:clinics,clinic_id',
        ]);

        $doctor = $this->dashboardService->addDoctor($validated);

        return response()->json([
            'message' => 'Doctor added successfully.',
            'doctor' => $doctor
        ], 201);
    }


    public function updateDoctor(Request $request, $doctor_id)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:100',
            'email' => 'sometimes|email',
            'phone' => 'nullable|string|max:30',
            'specialization' => 'sometimes|string|max:100',
            'clinic_id' => 'sometimes|integer|exists:clinics,clinic_id',
        ]);

        $doctor = $this->dashboardService->updateDoctor(
            $doctor_id,
            $validated
        );

        if (!$doctor) {
            return response()->json([
                'message' => 'Doctor not found.'
            ], 404);
        }

        return response()->json([
            'message' => 'Doctor updated successfully.',
            'doctor' => $doctor
        ]);
    }


    public function deleteDoctor($doctor_id)
    {
        $deleted = $this->dashboardService->deleteDoctor($doctor_id);

        if (!$deleted) {
            return response()->json([
                'message' => 'Doctor not found.'
            ], 404);
        }

        return response()->json([
            'message' => 'Doctor deleted successfully.'
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | Patients
    |--------------------------------------------------------------------------
    */

    public function listPatients()
    {
        $patients = $this->dashboardService->getPatients();

        return response()->json([
            'patients' => $patients
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | Live Queue
    |--------------------------------------------------------------------------
    */

    public function liveQueue()
    {
        $queue = $this->dashboardService->getLiveQueue();

        return response()->json([
            'queue' => $queue
        ]);
    }
}
