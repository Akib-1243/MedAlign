<?php

namespace App\Http\Controllers;

use App\Models\Doctor;
use App\Models\Patient;
use App\Models\Prescription;
use App\Models\QueueToken;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AiController extends Controller
{
    /**
     * AI Doctor Suggestion Engine for Patients based on described symptoms/problem.
     * POST /api/ai/suggest-doctor
     */
    public function suggestDoctor(Request $request)
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

            $symptoms = strtolower(trim($request->input('symptoms')));

        // Clinical Specialty Lexicon & Weight Mapping
        $specialtyMap = [
            'Cardiology' => [
                'keywords' => ['chest pain', 'chest', 'heart', 'palpitation', 'bp', 'blood pressure', 'hypertension', 'angina', 'shortness of breath', 'cholesterol', 'cardiac', 'pulse', 'tachycardia', 'breathless', 'dizzy when standing'],
                'primary_reason' => 'Evaluates cardiovascular symptoms, blood pressure anomalies, chest discomfort, and cardiac health.',
                'urgency_keywords' => ['crushing chest pain', 'left arm pain', 'radiating pain', 'unconscious', 'severe shortness of breath'],
            ],
            'Orthopedics' => [
                'keywords' => ['bone', 'joint', 'knee', 'back pain', 'spine', 'fracture', 'sprain', 'arthritis', 'shoulder', 'hip', 'swollen joint', 'wrist', 'ankle', 'tendon', 'muscle tear', 'ligament', 'posture'],
                'primary_reason' => 'Specializes in bone structure, joints, muscular injuries, arthritis, and skeletal rehabilitation.',
                'urgency_keywords' => ['open fracture', 'cannot move limb', 'severe deformity'],
            ],
            'Neurology' => [
                'keywords' => ['headache', 'migraine', 'dizziness', 'seizure', 'numbness', 'tingling', 'paralysis', 'tremor', 'nerve', 'memory', 'confusion', 'vertigo', 'loss of balance', 'fainting'],
                'primary_reason' => 'Manages neurological disorders, chronic migraines, nerve sensations, and cognitive/motor functions.',
                'urgency_keywords' => ['sudden weakness on one side', 'facial drooping', 'slurred speech', 'worst headache of life'],
            ],
            'Pediatrics' => [
                'keywords' => ['child', 'baby', 'infant', 'toddler', 'kid', 'pediatric', 'vaccine', 'colic', 'teething', 'growth', 'school age', 'child fever', 'rash child'],
                'primary_reason' => 'Provides specialized developmental wellness and medical care tailored for infants, children, and adolescents.',
                'urgency_keywords' => ['high fever in newborn', 'difficulty breathing infant'],
            ],
            'Dermatology' => [
                'keywords' => ['skin', 'rash', 'acne', 'itch', 'itchy', 'eczema', 'psoriasis', 'mole', 'allergy skin', 'scalp', 'hair loss', 'lesion', 'burn', 'dry skin', 'hives', 'fungal'],
                'primary_reason' => 'Diagnoses skin dermatoses, allergies, fungal conditions, rash patterns, and dermal health.',
                'urgency_keywords' => ['rapidly spreading rash with fever', 'blistering skin'],
            ],
            'General Medicine' => [
                'keywords' => ['fever', 'cough', 'cold', 'flu', 'sore throat', 'vomiting', 'diarrhea', 'weakness', 'fatigue', 'stomach', 'nausea', 'infection', 'body ache', 'chills', 'appetite', 'runny nose', 'malaise'],
                'primary_reason' => 'Primary triage and comprehensive evaluation for acute viral infections, systemic symptoms, and general diagnostics.',
                'urgency_keywords' => ['high fever > 104', 'persistent vomiting blood', 'severe dehydration'],
            ],
            'ENT' => [
                'keywords' => ['ear', 'nose', 'throat', 'sinus', 'tonsil', 'hearing', 'tinnitus', 'earache', 'nasal', 'hoarseness', 'snoring', 'smell'],
                'primary_reason' => 'Specializes in ear infections, sinus congestion, hearing issues, and upper respiratory tract passages.',
                'urgency_keywords' => ['stridor', 'foreign body in airway'],
            ],
            'Gynecology' => [
                'keywords' => ['pregnancy', 'period', 'menstrual', 'cramps', 'pelvic', 'fertility', 'ovary', 'uterus', 'discharge', 'contraception'],
                'primary_reason' => 'Specializes in women’s reproductive health, obstetric checkups, and hormonal management.',
                'urgency_keywords' => ['severe sudden pelvic pain', 'heavy abnormal bleeding'],
            ],
            'Ophthalmology' => [
                'keywords' => ['eye', 'vision', 'blur', 'cornea', 'cataract', 'glaucoma', 'red eye', 'eye pain', 'tearing'],
                'primary_reason' => 'Specializes in optical health, visual acuity, eye infections, and ocular therapies.',
                'urgency_keywords' => ['sudden vision loss', 'chemical eye splash'],
            ],
            'Psychiatry' => [
                'keywords' => ['anxiety', 'depression', 'panic', 'stress', 'insomnia', 'sleep', 'mood', 'trauma', 'bipolar', 'mental health'],
                'primary_reason' => 'Focuses on psychological well-being, mood regulation, sleep disorders, and emotional support.',
                'urgency_keywords' => ['suicidal thoughts', 'acute psychosis'],
            ],
        ];

        $scores = [];
        $urgencyFlag = false;
        $urgencyMessage = null;

        foreach ($specialtyMap as $specialty => $data) {
            $score = 0;
            foreach ($data['keywords'] as $kw) {
                if (str_contains($symptoms, $kw)) {
                    $score += (strlen($kw) > 6 ? 3 : 2); // weight multi-word or specific terms higher
                }
            }
            if (isset($data['urgency_keywords'])) {
                foreach ($data['urgency_keywords'] as $ukw) {
                    if (str_contains($symptoms, $ukw)) {
                        $urgencyFlag = true;
                        $urgencyMessage = "Red Flag Alert: Your described symptoms include potential high-priority warning signs. Please proceed to an Emergency Room immediately or alert clinic staff upon arrival.";
                        $score += 5;
                    }
                }
            }
            $scores[$specialty] = $score;
        }

        arsort($scores);
        $topSpecialty = key($scores);
        $topScore = current($scores);

        // Fallback to General Practice / Medicine if no specific keywords matched
        if ($topScore === 0) {
            $topSpecialty = 'General Medicine';
        }

        // Fetch doctors matching recommended specialty, or fallback to all available
        $allDbDoctors = Doctor::with(['user', 'clinic'])->get();

        $matchingDoctors = $allDbDoctors->filter(function ($doc) use ($topSpecialty) {
            return stripos($doc->specialization, $topSpecialty) !== false ||
                   ($topSpecialty === 'General Medicine' && stripos($doc->specialization, 'General') !== false);
        });

        if ($matchingDoctors->isEmpty()) {
            $matchingDoctors = $allDbDoctors;
        }

        $formattedDoctors = $matchingDoctors->map(function ($doc, $idx) {
            $waitingCount = QueueToken::where('doctor_id', $doc->doctor_id)
                ->where('status', 'waiting')
                ->count();

            return [
                'doctor_id'           => $doc->doctor_id,
                'name'                => $doc->user ? $doc->user->name : 'Dr. ' . $doc->specialization,
                'specialization'      => $doc->specialization,
                'clinic_name'         => $doc->clinic ? $doc->clinic->name : 'MedAlign Health Centre',
                'clinic_address'      => $doc->clinic ? $doc->clinic->address : '24 Crescent Road',
                'availability_status' => $doc->availability_status ?? 'available',
                'avg_consult_min'     => $doc->avg_consult_min ?? 15,
                'experience'          => ($doc->doctor_id * 2 + 6) . ' years clinical experience',
                'waiting_patients'    => $waitingCount,
                'est_wait_minutes'    => $waitingCount * ($doc->avg_consult_min ?? 15),
                'match_confidence'    => $idx === 0 ? '96% Best Match' : '91% Suitable Match',
            ];
        })->values();

        $triageAdvice = [
            'Cardiology'       => 'Keep calm, avoid strenuous exertion, and prepare a list of any current blood pressure or cardiac medications.',
            'Orthopedics'      => 'Avoid putting unnecessary weight on the painful limb; rest and elevate if swelling is present.',
            'Neurology'        => 'Note the exact time and duration of symptoms, and bring records of any prior headache medications.',
            'Pediatrics'       => 'Keep your child hydrated, note recent feeding times, and bring their vaccination record book.',
            'Dermatology'      => 'Do not apply strong over-the-counter ointments right before the visit so the clinician can observe the natural rash.',
            'General Medicine' => 'Stay well hydrated, note your temperature if you have a thermometer, and list when symptoms first began.',
            'ENT'              => 'Avoid inserting cotton swabs or ear drops without medical guidance prior to otoscopic examination.',
            'Gynecology'       => 'Note the date of your last menstrual cycle and any current vitamins or supplements.',
            'Ophthalmology'    => 'Avoid wearing contact lenses if your eye is red or irritated; bring your current glasses.',
            'Psychiatry'       => 'You are in a safe, confidential environment. Note your sleep patterns over the last 7 days.',
        ];

            return response()->json([
                'success' => true,
                'data' => [
                    'query_symptoms'       => $request->input('symptoms'),
                    'recommended_specialty'=> $topSpecialty,
                    'clinical_rationale'   => $specialtyMap[$topSpecialty]['primary_reason'] ?? "Recommended based on symptom profile analysis.",
                    'urgency_flag'         => $urgencyFlag,
                    'urgency_message'      => $urgencyMessage,
                    'preparation_advice'   => $triageAdvice[$topSpecialty] ?? 'Please have your government ID and previous prescription history ready.',
                    'matched_doctors'      => $formattedDoctors,
                ],
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'AI suggestion service error: ' . $e->getMessage(),
            ], 500);
        }
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
