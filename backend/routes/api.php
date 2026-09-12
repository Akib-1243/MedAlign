<?php

use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\AiController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DoctorDashboardController;
use App\Http\Controllers\PatientController;
use App\Http\Controllers\ReceptionDashboardController;
use App\Http\Controllers\UsersController;
use App\Http\Controllers\ClinicVerificationController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes - MedAlign Healthcare Engine
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Authentication API Routes
|--------------------------------------------------------------------------
| Public routes - rate limited
*/

Route::middleware('throttle:10,1')->prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/send-otp', [AuthController::class, 'sendOtp']);
    Route::post('/verify-otp', [AuthController::class, 'verifyOtp']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPasswordWithOtp']);
});

/*
|--------------------------------------------------------------------------
| Authenticated Routes
|--------------------------------------------------------------------------
| JWT Bearer token required
*/

Route::middleware(['jwt.auth'])->prefix('auth')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
});

/*
|--------------------------------------------------------------------------
| System Admin Dashboard Routes
|--------------------------------------------------------------------------
| System-level administration:
| - Hospitals / Clinics
| - Subscription Plans
| - Hospital Subscriptions
| - Billing / Subscription information
| - System Dashboard / Analytics
|
| Daily hospital operations such as doctors, patients and queues
| are handled by the Receptionist role instead.
|--------------------------------------------------------------------------
*/

Route::middleware(['jwt.auth', 'role:admin'])
    ->prefix('admin')
    ->group(function () {

        /*
        |--------------------------------------------------------------------------
        | System Dashboard
        |--------------------------------------------------------------------------
        */

        Route::get(
            '/dashboard-stats',
            [AdminDashboardController::class, 'index']
        );

        Route::get(
            '/dashboard',
            [AdminDashboardController::class, 'index']
        );

        /*
        |--------------------------------------------------------------------------
        | Hospital / Clinic Management
        |--------------------------------------------------------------------------
        */

        Route::get(
            '/clinics',
            [AdminDashboardController::class, 'listClinics']
        );

        Route::get(
            '/clinics/{clinic_id}',
            [AdminDashboardController::class, 'clinicDetails']
        );

        Route::patch(
            '/clinics/{clinic_id}/activate',
            [AdminDashboardController::class, 'activateClinic']
        );

        Route::patch(
            '/clinics/{clinic_id}/deactivate',
            [AdminDashboardController::class, 'deactivateClinic']
        );

        /*
        |--------------------------------------------------------------------------
        | Subscription Plan Management
        |--------------------------------------------------------------------------
        */

        Route::get(
            '/subscription-plans',
            [AdminDashboardController::class, 'listSubscriptionPlans']
        );

        Route::post(
            '/subscription-plans',
            [AdminDashboardController::class, 'addSubscriptionPlan']
        );

        Route::patch(
            '/subscription-plans/{plan_id}',
            [AdminDashboardController::class, 'updateSubscriptionPlan']
        );

        Route::delete(
            '/subscription-plans/{plan_id}',
            [AdminDashboardController::class, 'deleteSubscriptionPlan']
        );

        /*
        |--------------------------------------------------------------------------
        | Hospital Subscription Management
        |--------------------------------------------------------------------------
        */

        Route::get(
            '/clinics/{clinic_id}/subscription',
            [AdminDashboardController::class, 'clinicSubscription']
        );

        Route::patch(
            '/clinics/{clinic_id}/plan',
            [AdminDashboardController::class, 'updateClinicPlan']
        );
    });

/*
|--------------------------------------------------------------------------
| Doctor Dashboard Routes
|--------------------------------------------------------------------------
| Doctor-specific queue, appointment and prescription operations.
|--------------------------------------------------------------------------
*/

Route::middleware(['jwt.auth', 'role:doctor'])
    ->prefix('doctor')
    ->group(function () {

        Route::get(
            '/queue-snapshot',
            [DoctorDashboardController::class, 'show']
        );

        Route::get(
            '/dashboard',
            [DoctorDashboardController::class, 'show']
        );

        Route::post(
            '/queue/call-next',
            [DoctorDashboardController::class, 'callNext']
        );

        Route::post(
            '/queue/next',
            [DoctorDashboardController::class, 'callNext']
        );

        Route::patch(
            '/queue/{token}/status',
            [DoctorDashboardController::class, 'updateStatus']
        );

        Route::patch(
            '/queue/{token}',
            [DoctorDashboardController::class, 'updateStatus']
        );

        Route::post(
            '/prescription',
            [DoctorDashboardController::class, 'createPrescription']
        );

        Route::get(
            '/patient/{patient_id}/history',
            [DoctorDashboardController::class, 'patientHistory']
        );
    });

/*
|--------------------------------------------------------------------------
| Receptionist Dashboard Routes
|--------------------------------------------------------------------------
| Receptionist manages:
| - Doctors belonging to their clinic
| - Patients who have visited their clinic
| - Live queue for their clinic
|
| IMPORTANT:
| Patients are global in MedAlign and do NOT have clinic_id.
| The clinic relationship comes from queue/visit records.
|--------------------------------------------------------------------------
*/

Route::middleware(['jwt.auth', 'role:reception'])
    ->prefix('reception')
    ->group(function () {

        Route::get(
            '/dashboard',
            [ReceptionDashboardController::class, 'dashboard']
        );

        Route::get(
            '/doctors',
            [ReceptionDashboardController::class, 'doctors']
        );

        Route::get(
            '/patients',
            [ReceptionDashboardController::class, 'patients']
        );

        Route::get(
            '/queue',
            [ReceptionDashboardController::class, 'queue']
        );
    });

Route::middleware(['jwt.auth', 'role:reception'])
    ->prefix('clinic/verification')
    ->group(function () {
        Route::get('/', [ClinicVerificationController::class, 'show']);
        Route::post('/', [ClinicVerificationController::class, 'submit']);
    });

Route::middleware(['jwt.auth', 'role:admin'])
    ->prefix('admin/clinic-verifications')
    ->group(function () {
        Route::get('/', [ClinicVerificationController::class, 'index']);
        Route::patch('/{verification_id}', [ClinicVerificationController::class, 'review']);
    });

/*
|--------------------------------------------------------------------------
| Patient Portal API Routes
|--------------------------------------------------------------------------
*/

Route::prefix('patient')->group(function () {

    Route::get(
        '/search',
        [PatientController::class, 'searchPatient']
    );

    Route::get(
        '/token/{identifier}',
        [PatientController::class, 'getQueueToken']
    );

    Route::get(
        '/{patient_id}/alerts',
        [PatientController::class, 'getAlertPreferences']
    );

    Route::post(
        '/{patient_id}/alerts',
        [PatientController::class, 'updateAlertPreferences']
    );

    Route::get(
        '/{patient_id}/vault',
        [PatientController::class, 'getMedicalVault']
    );

    Route::get(
        '/prescription/{id}',
        [PatientController::class, 'getPrescriptionDetail']
    );

    Route::post(
        '/issue-token',
        [PatientController::class, 'issueToken']
    );
});

/*
|--------------------------------------------------------------------------
| AI Clinical & Triage Engine Routes
|--------------------------------------------------------------------------
*/

Route::prefix('ai')->group(function () {

    Route::post(
        '/suggest-doctor',
        [AiController::class, 'suggestDoctor']
    );

    Route::get(
        '/patient-summary/{patient_id}',
        [AiController::class, 'patientSummary']
    );
});

/*
|--------------------------------------------------------------------------
| Public Directory & Metadata API Routes
|--------------------------------------------------------------------------
*/

Route::get(
    '/doctors',
    [PatientController::class, 'getDoctors']
);

Route::get(
    '/plans',
    [PatientController::class, 'getSubscriptionPlans']
);

/*
|--------------------------------------------------------------------------
| General CRUD Endpoints
|--------------------------------------------------------------------------
*/

Route::get(
    '/items',
    [UsersController::class, 'index']
);

Route::get(
    '/items/{id}',
    [UsersController::class, 'show']
);

Route::post(
    '/items',
    [UsersController::class, 'store']
);

Route::put(
    '/items/{id}',
    [UsersController::class, 'update']
);

Route::patch(
    '/items/{id}',
    [UsersController::class, 'patch']
);

Route::delete(
    '/items/{id}',
    [UsersController::class, 'destroy']
);

