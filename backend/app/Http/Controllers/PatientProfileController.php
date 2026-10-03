<?php

namespace App\Http\Controllers;

use App\Models\Patient;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class PatientProfileController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'data' => $this->profileData($user, $this->patientFor($user)),
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:50',
            'last_name' => 'required|string|max:50',
            'phone' => 'required|string|max:20',
            'secondary_phone' => 'nullable|string|max:20',
            'age' => 'required|integer|min:0|max:120',
            'registering_for_other' => 'required|boolean',
            'relationship_to_patient' => [
                Rule::requiredIf(fn () => $request->boolean('registering_for_other')),
                'nullable',
                Rule::in(['mother', 'father', 'guardian', 'spouse', 'child', 'sibling', 'friend']),
            ],
            'friend_parent_name' => [
                Rule::requiredIf(fn () => $request->boolean('registering_for_other') && $request->relationship_to_patient === 'friend'),
                'nullable',
                'string',
                'max:100',
            ],
            'friend_parent_phone' => [
                Rule::requiredIf(fn () => $request->boolean('registering_for_other') && $request->relationship_to_patient === 'friend'),
                'nullable',
                'string',
                'max:20',
            ],
            'parent_guardian_name' => [
                Rule::requiredIf(fn () => $request->filled('age') && (int) $request->age < 18),
                'nullable',
                'string',
                'max:100',
            ],
            'parent_guardian_phone' => [
                Rule::requiredIf(fn () => $request->filled('age') && (int) $request->age < 18),
                'nullable',
                'string',
                'max:20',
            ],
            'dob' => 'nullable|date|before_or_equal:today',
            'gender' => ['nullable', Rule::in(['Female', 'Male', 'Other'])],
            'marital_status' => ['nullable', Rule::in(['single', 'married', 'divorced', 'widowed', 'prefer_not_to_say'])],
            'address' => 'nullable|string|max:255',
            'emergency_contact_name' => 'nullable|required_with:emergency_contact_phone|string|max:100',
            'emergency_contact_phone' => 'nullable|required_with:emergency_contact_name|string|max:20',
            'blood_group' => ['nullable', Rule::in(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])],
            'allergies' => 'nullable|string|max:2000',
        ]);

        $user = $request->user();
        $patient = DB::transaction(function () use ($user, $validated) {
            $user->name = trim($validated['first_name'] . ' ' . $validated['last_name']);
            foreach ([
                'first_name',
                'last_name',
                'phone',
                'secondary_phone',
                'age',
                'registering_for_other',
                'relationship_to_patient',
                'parent_guardian_name',
                'parent_guardian_phone',
                'friend_parent_name',
                'friend_parent_phone',
            ] as $field) {
                $user->{$field} = $validated[$field] ?? null;
            }
            $user->save();

            $patient = $this->patientFor($user) ?? new Patient(['email' => $user->email]);
            $patient->fill($validated);
            $patient->name = $user->name;
            $patient->email = $user->email;
            $patient->save();

            return $patient;
        });

        return response()->json([
            'success' => true,
            'message' => 'Profile saved.',
            'data' => $this->profileData($user->fresh(), $patient->fresh()),
        ]);
    }

    public function uploadPhoto(Request $request)
    {
        $request->validate([
            'photo' => 'required|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        $patient = $this->patientFor($request->user());
        if (!$patient) {
            return response()->json(['message' => 'Save your name and phone number before adding a photo.'], 422);
        }

        $path = $request->file('photo')->store('patient-profile-photos/' . $patient->patient_id, 'local');
        if (!$path) {
            return response()->json(['message' => 'Unable to store the profile photo.'], 500);
        }

        if ($patient->profile_photo_path) {
            Storage::disk('local')->delete($patient->profile_photo_path);
        }

        $patient->profile_photo_path = $path;
        $patient->save();

        return response()->json(['success' => true, 'has_photo' => true]);
    }

    public function showPhoto(Request $request)
    {
        $patient = $this->patientFor($request->user());
        if (!$patient?->profile_photo_path || !Storage::disk('local')->exists($patient->profile_photo_path)) {
            return response()->json(['message' => 'Profile photo not found.'], 404);
        }

        return response()->file(Storage::disk('local')->path($patient->profile_photo_path), [
            'Cache-Control' => 'private, no-store',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    public function deletePhoto(Request $request)
    {
        $patient = $this->patientFor($request->user());
        if ($patient?->profile_photo_path) {
            Storage::disk('local')->delete($patient->profile_photo_path);
            $patient->profile_photo_path = null;
            $patient->save();
        }

        return response()->json(['success' => true]);
    }

    private function patientFor(User $user): ?Patient
    {
        return Patient::where('email', $user->email)->first();
    }

    private function profileData(User $user, ?Patient $patient): array
    {
        return [
            'account' => [
                'name' => $user->name,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
                'phone' => $user->phone,
                'secondary_phone' => $user->secondary_phone,
                'age' => $user->age,
                'registering_for_other' => (bool) $user->registering_for_other,
                'relationship_to_patient' => $user->relationship_to_patient,
                'parent_guardian_name' => $user->parent_guardian_name,
                'parent_guardian_phone' => $user->parent_guardian_phone,
                'friend_parent_name' => $user->friend_parent_name,
                'friend_parent_phone' => $user->friend_parent_phone,
                'email_verified_at' => $user->email_verified_at?->toIso8601String(),
            ],
            'patient' => $patient ? [
                'patient_id' => $patient->patient_id,
                'name' => $patient->name,
                'first_name' => $patient->first_name,
                'last_name' => $patient->last_name,
                'email' => $patient->email,
                'phone' => $patient->phone,
                'secondary_phone' => $patient->secondary_phone,
                'age' => $patient->age,
                'registering_for_other' => (bool) $patient->registering_for_other,
                'relationship_to_patient' => $patient->relationship_to_patient,
                'parent_guardian_name' => $patient->parent_guardian_name,
                'parent_guardian_phone' => $patient->parent_guardian_phone,
                'friend_parent_name' => $patient->friend_parent_name,
                'friend_parent_phone' => $patient->friend_parent_phone,
                'dob' => $patient->dob,
                'gender' => $patient->gender,
                'marital_status' => $patient->marital_status,
                'address' => $patient->address,
                'emergency_contact_name' => $patient->emergency_contact_name,
                'emergency_contact_phone' => $patient->emergency_contact_phone,
                'blood_group' => $patient->blood_group,
                'allergies' => $patient->allergies,
                'has_photo' => (bool) $patient->profile_photo_path,
            ] : null,
        ];
    }
}