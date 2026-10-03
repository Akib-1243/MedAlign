<?php

namespace App\Http\Controllers;

use App\Models\Doctor;
use App\Models\Patient;
use App\Models\Prescription;
use App\Models\QueueToken;
use App\Services\SymptomTriageService;
use Illuminate\Http\Request;

class AiController extends Controller
{
    /**
     * AI Doctor Suggestion Engine for Patients based on described symptoms/problem.
     * POST /api/ai/suggest-doctor
     */
    public function suggestDoctor(Request $request, SymptomTriageService $triage)
    {
        try {
            $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
                'symptoms' => 'required|string|min:2|max:1000',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => $validator->errors()->first('symptoms') ?: 'Please provide a valid description of your symptoms.',
                ], 422);
            }

            $symptoms = trim($request->input('symptoms'));
            $analysis = $triage->analyze($symptoms);
            $matchingDoctors = collect();
            $availabilityMessage = null;

            if (!$analysis['urgency_flag'] && !$analysis['needs_clarification']) {
                $specialtyAliases = [
                    'Cardiology' => ['cardiology', 'cardiologist'],
                    'Orthopedics' => ['orthopedics', 'orthopaedics', 'orthopedic', 'orthopaedic'],
                    'Neurology' => ['neurology', 'neurologist'],
                    'Pediatrics' => ['pediatrics', 'paediatrics', 'pediatric', 'paediatric'],
                    'Dermatology' => ['dermatology', 'dermatologist'],
                    'General Medicine' => ['general medicine', 'general practice', 'family medicine', 'primary care'],
                    'ENT' => ['otolaryngology', 'otorhinolaryngology', 'ear nose throat'],
                    'Gynecology' => ['gynecology', 'gynaecology', 'obstetrics'],
                    'Ophthalmology' => ['ophthalmology', 'ophthalmologist'],
                    'Psychiatry' => ['psychiatry', 'psychiatrist'],
                ];
                $recommendedSpecialties = $analysis['recommended_specialties']
                    ?? array_filter([$analysis['recommended_specialty']]);
                $aliasesBySpecialty = collect($recommendedSpecialties)
                    ->mapWithKeys(fn (string $specialty) => [
                        $specialty => $specialtyAliases[$specialty] ?? [],
                    ])
                    ->filter(fn (array $aliases) => $aliases !== []);
                $aliases = $aliasesBySpecialty->flatten()->all();
                $doctors = Doctor::with(['user', 'clinic'])->get();
                $waitingCounts = QueueToken::query()
                    ->select('doctor_id')
                    ->selectRaw('COUNT(*) as waiting_count')
                    ->where('status', 'waiting')
                    ->groupBy('doctor_id')
                    ->get()
                    ->keyBy('doctor_id');

                $matchingDoctors = $doctors->map(function (Doctor $doctor) use ($aliasesBySpecialty) {
                    $matchedSpecialty = $aliasesBySpecialty->keys()->first(
                        fn (string $specialty) => $this->doctorMatchesSpecialty(
                            $doctor->specialization,
                            $aliasesBySpecialty->get($specialty)
                        )
                    );

                    return $matchedSpecialty ? [$doctor, $matchedSpecialty] : null;
                })->filter()->sort(function (array $left, array $right) use ($waitingCounts, $recommendedSpecialties) {
                    $leftSpecialtyRank = array_search($left[1], $recommendedSpecialties, true);
                    $rightSpecialtyRank = array_search($right[1], $recommendedSpecialties, true);
                    if ($leftSpecialtyRank !== $rightSpecialtyRank) {
                        return $leftSpecialtyRank <=> $rightSpecialtyRank;
                    }

                    /** @var Doctor $leftDoctor */
                    $leftDoctor = $left[0];
                    /** @var Doctor $rightDoctor */
                    $rightDoctor = $right[0];
                    $leftQueue = (int) ($waitingCounts->get($leftDoctor->doctor_id)->waiting_count ?? 0);
                    $rightQueue = (int) ($waitingCounts->get($rightDoctor->doctor_id)->waiting_count ?? 0);
                    $leftRank = [$leftDoctor->availability_status === 'available' ? 0 : 1, $leftQueue];
                    $rightRank = [$rightDoctor->availability_status === 'available' ? 0 : 1, $rightQueue];

                    return $leftRank <=> $rightRank;
                })->values()->map(function (array $match) use ($waitingCounts) {
                    /** @var Doctor $doctor */
                    [$doctor, $matchedSpecialty] = $match;
                    $waitingCount = (int) ($waitingCounts->get($doctor->doctor_id)->waiting_count ?? 0);

                    return [
                        'doctor_id' => $doctor->doctor_id,
                        'name' => $doctor->user ? $doctor->user->name : 'Dr. ' . $doctor->specialization,
                        'specialization' => $doctor->specialization,
                        'clinic_name' => $doctor->clinic?->name ?? 'Clinic information unavailable',
                        'clinic_address' => $doctor->clinic?->address,
                        'availability_status' => $doctor->availability_status ?? 'unavailable',
                        'avg_consult_min' => $doctor->avg_consult_min ?? 15,
                        'waiting_patients' => $waitingCount,
                        'est_wait_minutes' => $waitingCount * ($doctor->avg_consult_min ?? 15),
                        'match_label' => $matchedSpecialty . ' match',
                        'matched_specialty' => $matchedSpecialty,
                    ];
                });

                if ($matchingDoctors->isEmpty()) {
                    $availabilityMessage = 'No clinician in this specialty is currently listed. You can check the Specialists directory or ask the clinic for a referral.';
                }
            }

            return response()->json([
                'success' => true,
                'data' => array_merge($analysis, [
                    'query_symptoms' => $symptoms,
                    'matched_doctors' => $matchingDoctors,
                    'availability_message' => $availabilityMessage,
                    'disclaimer' => 'This tool suggests a place to start; it does not diagnose or replace advice from a qualified clinician.',
                ]),
            ]);
        } catch (\Throwable $e) {
            report($e);
            return response()->json([
                'success' => false,
                'message' => 'The symptom navigator is temporarily unavailable. Please try again or contact the clinic.',
            ], 500);
        }
    }

    private function doctorMatchesSpecialty(string $doctorSpecialty, array $aliases): bool
    {
        $normalized = ' ' . trim((string) preg_replace('/[^a-z0-9]+/', ' ', strtolower($doctorSpecialty))) . ' ';
        foreach ($aliases as $alias) {
            $normalizedAlias = ' ' . trim((string) preg_replace('/[^a-z0-9]+/', ' ', strtolower($alias))) . ' ';
            if (str_contains($normalized, $normalizedAlias)) {
                return true;
            }
        }

        return false;
    }

    /**
     * AI Clinical History Summarizer for Doctors.
     * GET /api/ai/patient-summary/{patient_id}
     */
    public function patientSummary($patient_id)
    {
        $patient = Patient::find($patient_id);
        if (!$patient) {
            return response()->json(['success' => false, 'message' => 'Patient record not found.'], 404);
        }

        $prescriptions = Prescription::with(['doctor.user', 'items'])
            ->where('patient_id', $patient_id)
            ->orderBy('issued_at', 'desc')
            ->get();

        $totalVisits = $prescriptions->count();

        // Aggregate medications and clinical findings
        $allMedicines = [];
        $diagnosesNotes = [];
        $timeline = [];

        foreach ($prescriptions as $rx) {
            $doctorName = $rx->doctor && $rx->doctor->user ? $rx->doctor->user->name : 'Attending Clinician';
            $rxItems = [];

            foreach ($rx->items as $it) {
                $allMedicines[] = [
                    'name'         => $it->medicine_name,
                    'dosage'       => $it->dosage,
                    'frequency'    => $it->frequency,
                    'duration'     => $it->duration,
                    'instructions' => $it->instructions,
                    'prescribed_by'=> $doctorName,
                    'date'         => $rx->issued_at ? $rx->issued_at->format('M d, Y') : 'Recent',
                ];
                $rxItems[] = $it->medicine_name . ' (' . $it->dosage . ')';
            }

            if (!empty($rx->notes)) {
                $diagnosesNotes[] = [
                    'date'   => $rx->issued_at ? $rx->issued_at->format('M d, Y') : 'Past Visit',
                    'doctor' => $doctorName,
                    'notes'  => $rx->notes,
                ];
            }

            $timeline[] = [
                'prescription_id' => $rx->prescription_id,
                'date'            => $rx->issued_at ? $rx->issued_at->format('M d, Y') : 'Unknown',
                'doctor'          => $doctorName,
                'notes'           => $rx->notes,
                'medicines'       => $rxItems,
            ];
        }

        // Deduplicate medicines by name
        $uniqueMeds = [];
        foreach ($allMedicines as $m) {
            $key = strtolower($m['name']);
            if (!isset($uniqueMeds[$key])) {
                $uniqueMeds[$key] = $m;
            }
        }
        $medicationList = array_values($uniqueMeds);

        // Derive AI Clinical Insights
        $clinicalTrends = [];
        $suggestedActions = [];

        if ($totalVisits === 0) {
            $executiveSummary = "{$patient->name} is a new patient with no recorded prior digital prescriptions at this clinic. Conduct baseline vital checks and medical history onboarding.";
            $clinicalTrends[] = "First encounter recorded in MedAlign Vault.";
            $suggestedActions[] = "Establish baseline vitals (BP, Heart Rate, SpO2, Temperature).";
            $suggestedActions[] = "Inquire regarding drug allergies and chronic medical conditions.";
        } else {
            $executiveSummary = "{$patient->name} has {$totalVisits} recorded clinical encounter(s) in MedAlign. Patient was previously treated with " .
                count($medicationList) . " distinct medication(s). Latest consultation notes indicate: " .
                (!empty($diagnosesNotes[0]['notes']) ? '"' . $diagnosesNotes[0]['notes'] . '"' : "routine medical care.");

            $clinicalTrends[] = "Encounter history: {$totalVisits} prescription records on file.";

            // Detect patterns
            $allText = strtolower(implode(' ', array_column($diagnosesNotes, 'notes')) . ' ' . implode(' ', array_column($allMedicines, 'name')));

            if (str_contains($allText, 'amoxicillin') || str_contains($allText, 'antibiotic') || str_contains($allText, 'infection') || str_contains($allText, 'sinus')) {
                $clinicalTrends[] = "History of antibiotic therapy for bacterial or respiratory/sinus presentation.";
                $suggestedActions[] = "Assess resolution of infection symptoms; monitor for antibiotic resistance or recurrence.";
            }

            if (str_contains($allText, 'lisinopril') || str_contains($allText, 'hypertension') || str_contains($allText, 'bp') || str_contains($allText, 'blood pressure') || str_contains($allText, 'amlodipine')) {
                $clinicalTrends[] = "Cardiovascular / Hypertension monitoring noted in past prescriptions.";
                $suggestedActions[] = "Perform blood pressure measurement today; verify patient compliance with antihypertensive regimen.";
            }

            if (str_contains($allText, 'metformin') || str_contains($allText, 'diabetes') || str_contains($allText, 'glucose')) {
                $clinicalTrends[] = "Glycemic / Metabolic management profile identified.";
                $suggestedActions[] = "Check recent fasting glucose / HbA1c status and dietary adherence.";
            }

            $suggestedActions[] = "Review patient response to previous medication dosages before adding or adjusting prescriptions.";
        }

        return response()->json([
            'success' => true,
            'data' => [
                'patient' => [
                    'id'     => $patient->patient_id,
                    'name'   => $patient->name,
                    'phone'  => $patient->phone,
                    'dob'    => $patient->dob,
                    'gender' => $patient->gender,
                ],
                'executive_summary'       => $executiveSummary,
                'total_prescriptions'     => $totalVisits,
                'medication_history'      => $medicationList,
                'clinical_trends'         => $clinicalTrends,
                'doctor_action_insights'  => $suggestedActions,
                'timeline'                => $timeline,
            ],
        ]);
    }
}
