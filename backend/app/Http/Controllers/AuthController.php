<?php

namespace App\Http\Controllers;

use App\Mail\SendOtpMail;
use App\Models\OtpVerification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class AuthController extends Controller
{
    /**
     * Register a new user and send email verification OTP.
     * Protected against SQL injection via Eloquent parameter binding.
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:100',
            'email' => 'required|string|email|max:100',
            'phone' => 'nullable|string|max:20',
            'password' => 'required|string|min:6',
            'role' => ['required', Rule::in(['admin', 'doctor', 'reception', 'patient'])],
            'clinic_id' => 'nullable|integer|exists:clinics,clinic_id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        if ($request->role === 'doctor') {
            return response()->json([
                'success' => false,
                'message' => 'Doctor accounts can only be provisioned by a Clinic Administrator. Please contact your administrator to create your account.',
            ], 403);
        }

        // Check if user already exists
        $existingUser = User::where('email', $request->email)->first();

        if ($existingUser) {
            if ($existingUser->email_verified_at) {
                return response()->json([
                    'success' => false,
                    'message' => 'An account with this email already exists.',
                ], 400);
            } else {
                // Update password if requested, resend OTP
                $existingUser->update([
                    'name' => $request->name,
                    'phone' => $request->phone ?? $existingUser->phone,
                    'password' => Hash::make($request->password),
                    'role' => $request->role,
                    'clinic_id' => $request->clinic_id ?? $existingUser->clinic_id,
                ]);
                $user = $existingUser;
            }
        } else {
            $user = User::create([
                'clinic_id' => $request->clinic_id,
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
                'password' => Hash::make($request->password),
                'role' => $request->role,
                'email_verified_at' => null,
            ]);
        }

        // Dispatch OTP code
        $this->dispatchOtp($user->email, 'registration', $user->name);

        return response()->json([
            'success' => true,
            'message' => 'Registration initiated. Please enter the 6-digit OTP sent to your email.',
            'email' => $user->email,
            'requires_otp' => true,
        ]);
    }

    /**
     * Send or resend OTP to user email.
     */
    public function sendOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'type' => 'nullable|string|in:registration,login,password_reset',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $email = $request->email;
        $type = $request->input('type', 'registration');
        $user = User::where('email', $email)->first();

        $name = $user ? $user->name : 'User';
        $this->dispatchOtp($email, $type, $name);

        return response()->json([
            'success' => true,
            'message' => 'OTP code dispatched to ' . $email,
        ]);
    }

    /**
     * Verify OTP code, mark email verified, and issue Sanctum token.
     */
    public function verifyOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'otp_code' => 'required|string|size:6',
            'type' => 'nullable|string|in:registration,login,password_reset',
            'role' => ['nullable', Rule::in(['admin', 'doctor', 'reception', 'patient'])],
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $email = $request->email;
        $otpCode = $request->otp_code;
        $type = $request->input('type', 'registration');

        // Retrieve valid OTP record using parameter binding
        $otpRecord = OtpVerification::where('email', $email)
            ->where('type', $type)
            ->where('expires_at', '>=', now())
            ->latest('id')
            ->first();

        if (!$otpRecord || !Hash::check($otpCode, $otpRecord->otp_code)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired OTP code. Please request a new code.',
            ], 400);
        }

        // Mark OTP as verified
        $otpRecord->update(['verified_at' => now()]);

        // Find and update user
        $user = User::where('email', $email)->first();
        if ($user) {
            if ($request->filled('role') && $user->role !== $request->role) {
                return response()->json([
                    'success' => false,
                    'message' => 'This account does not belong to the selected portal.',
                ], 403);
            }

            $user->email_verified_at = now();
            $user->save();

            // Auto-provision corresponding domain entity based on role in MySQL database
            if ($user->role === 'doctor') {
                \App\Models\Doctor::firstOrCreate(
                    ['user_id' => $user->id],
                    [
                        'clinic_id' => $user->clinic_id ?? 1,
                        'specialization' => 'General Medicine',
                        'avg_consult_min' => 15,
                        'availability_status' => 'available',
                    ]
                );
            } elseif ($user->role === 'patient') {
                \App\Models\Patient::firstOrCreate(
                    ['email' => $user->email],
                    [
                        'name' => $user->name,
                        'phone' => $user->phone ?? '+1 555 0100',
                        'gender' => 'Other',
                    ]
                );
            }
        } else {
            return response()->json(['success' => false, 'message' => 'User account not found.'], 404);
        }

        // Generate RFC 7519 signed JSON Web Token (JWT)
        $jwtToken = \App\Http\Services\JwtService::generateToken($user);
        $user->createToken('auth_token');

        return response()->json([
            'success' => true,
            'message' => 'Email verified successfully!',
            'access_token' => $jwtToken,
            'jwt_token' => $jwtToken,
            'token_type' => 'Bearer',
            'user' => $user->load(['clinic', 'doctor']),
            'redirect_url' => $this->getRoleRedirect($user->role),
        ]);
    }

    /**
     * Authenticate user with password and check email verification status.
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|string',
            'password' => 'required|string',
            'role' => ['nullable', Rule::in(['admin', 'doctor', 'reception', 'patient'])],
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $loginInput = $request->email;

        // Secure Eloquent query supporting email or phone login
        $user = User::where('email', $loginInput)
            ->orWhere('phone', $loginInput)
            ->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials.',
            ], 401);
        }

        if ($request->filled('role') && $user->role !== $request->role) {
            return response()->json([
                'success' => false,
                'message' => 'These credentials are not registered for this portal.',
            ], 403);
        }

        // Check if email is verified
        if (!$user->email_verified_at) {
            $this->dispatchOtp($user->email, 'login', $user->name);
            return response()->json([
                'success' => false,
                'requires_otp' => true,
                'message' => 'Your email is not verified yet. A 6-digit OTP code has been sent to your email.',
                'email' => $user->email,
            ], 403);
        }

        // Generate RFC 7519 signed JSON Web Token (JWT)
        $jwtToken = \App\Http\Services\JwtService::generateToken($user);
        $user->createToken('auth_token');

        return response()->json([
            'success' => true,
            'message' => 'Login successful.',
            'access_token' => $jwtToken,
            'jwt_token' => $jwtToken,
            'token_type' => 'Bearer',
            'user' => $user->load(['clinic', 'doctor']),
            'redirect_url' => $this->getRoleRedirect($user->role),
        ]);
    }

    /**
     * Get current authenticated user profile.
     */
    public function me(Request $request)
    {
        return response()->json([
            'success' => true,
            'user' => $request->user()->load(['clinic', 'doctor']),
        ]);
    }

    /**
     * Logout and revoke Sanctum access token.
     */
    public function logout(Request $request)
    {
        if ($request->user() && $request->user()->currentAccessToken()) {
            $request->user()->currentAccessToken()->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully.',
        ]);
    }

    /**
     * Request Password Reset OTP.
     */
    public function forgotPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'No account found with this email.'], 404);
        }

        $user = User::where('email', $request->email)->first();
        $this->dispatchOtp($user->email, 'password_reset', $user->name);

        return response()->json([
            'success' => true,
            'message' => 'Password reset OTP dispatched to your email.',
            'email' => $user->email,
        ]);
    }

    /**
     * Reset password using OTP.
     */
    public function resetPasswordWithOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
            'otp_code' => 'required|string|size:6',
            'new_password' => 'required|string|min:6',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $otpRecord = OtpVerification::where('email', $request->email)
            ->where('type', 'password_reset')
            ->where('expires_at', '>=', now())
            ->latest('id')
            ->first();

        if (!$otpRecord || !Hash::check($request->otp_code, $otpRecord->otp_code)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired OTP code.',
            ], 400);
        }

        $user = User::where('email', $request->email)->first();
        $user->password = Hash::make($request->new_password);
        $user->save();

        $otpRecord->update(['verified_at' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'Password reset successful! You can now log in with your new password.',
        ]);
    }

    /**
     * Helper to generate, hash, store, and mail 6-digit OTP.
     */
    private function dispatchOtp(string $email, string $type, string $name)
    {
        // Cryptographically secure 6-digit OTP
        $rawOtp = (string) random_int(100000, 999999);

        // Store hashed code in database for security
        OtpVerification::create([
            'email' => $email,
            'otp_code' => Hash::make($rawOtp),
            'type' => $type,
            'expires_at' => now()->addMinutes(10),
            'created_at' => now(),
        ]);

        // Send email via Laravel Mailable
        try {
            Mail::to($email)->send(new SendOtpMail($rawOtp, $type, $name));
        } catch (\Exception $e) {
            // Log mail failure gracefully for local/dev fallback
            \Illuminate\Support\Facades\Log::warning("OTP Email Dispatch Error: " . $e->getMessage() . " | Code: " . $rawOtp);
        }
    }

    /**
     * Role-based redirect path lookup according to App Flow.
     */
    private function getRoleRedirect($role): string
    {
        return match ($role) {
            'admin' => '/admin',
            'doctor' => '/doctor',
            'reception' => '/reception',
            'patient' => '/patient',
            default => '/',
        };
    }
}
