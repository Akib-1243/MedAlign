<?php

namespace App\Services;

class SymptomTriageService
{
    private const SPECIALTIES = [
        'Cardiology' => [
            'reason' => 'Cardiology evaluates heart rhythm, blood pressure, and chest symptoms.',
            'preparation' => 'Note when the symptoms began, what brings them on, and any heart or blood-pressure medicines you take.',
            'signals' => [
                'chest discomfort' => ['weight' => 5, 'terms' => ['chest pain', 'chest discomfort', 'chest tightness', 'pressure in chest']],
                'palpitations' => ['weight' => 4, 'terms' => ['palpitations', 'palpitation', 'heart racing', 'racing heartbeat']],
                'blood pressure concern' => ['weight' => 4, 'terms' => ['high blood pressure', 'hypertension', 'high bp', 'blood pressure']],
                'irregular heartbeat' => ['weight' => 4, 'terms' => ['irregular heartbeat', 'irregular heart beat', 'skipping heartbeat']],
            ],
        ],
        'Orthopedics' => [
            'reason' => 'Orthopedics evaluates bone, joint, and movement-related pain or injury.',
            'preparation' => 'Note how the injury happened and what movements worsen the pain. Avoid stressing a seriously injured area.',
            'signals' => [
                'joint or back pain' => ['weight' => 4, 'terms' => ['joint pain', 'knee pain', 'back pain', 'shoulder pain', 'hip pain', 'wrist pain', 'ankle pain', 'bone pain']],
                'joint swelling' => ['weight' => 4, 'terms' => ['swollen joint', 'joint swelling', 'knee swelling']],
                'bone or soft-tissue injury' => ['weight' => 5, 'terms' => ['fracture', 'broken bone', 'sprain', 'ligament injury', 'muscle tear']],
            ],
        ],
        'Neurology' => [
            'reason' => 'Neurology evaluates headaches, dizziness, seizures, and nerve-related symptoms.',
            'preparation' => 'Note when symptoms started, how long they last, and any medicines taken, including the dose and time.',
            'signals' => [
                'headache' => ['weight' => 4, 'terms' => ['headache', 'migraine', 'head pain']],
                'dizziness or vertigo' => ['weight' => 3, 'terms' => ['dizziness', 'dizzy', 'vertigo', 'loss of balance']],
                'nerve symptoms' => ['weight' => 4, 'terms' => ['numbness', 'tingling', 'pins and needles', 'tremor']],
                'seizure' => ['weight' => 6, 'terms' => ['seizure', 'convulsion', 'fit']],
                'memory or confusion concern' => ['weight' => 3, 'terms' => ['memory loss', 'confusion', 'confused']],
            ],
        ],
        'Pediatrics' => [
            'reason' => 'Pediatrics provides care tailored to children and adolescents.',
            'preparation' => 'Bring the child’s medication list and vaccination record, and note when symptoms began.',
            'signals' => [
                'child or infant' => ['weight' => 7, 'terms' => ['my child', 'my son', 'my daughter', 'my baby', 'infant', 'toddler', 'pediatric', 'for my kid']],
                'child health concern' => ['weight' => 6, 'terms' => ['teething', 'child fever', 'baby fever', 'vaccine schedule']],
            ],
        ],
        'Dermatology' => [
            'reason' => 'Dermatology evaluates skin, hair, and nail conditions.',
            'preparation' => 'Note when the skin change appeared, whether it is spreading, and any products or medicines used on it.',
            'signals' => [
                'rash or skin irritation' => ['weight' => 4, 'terms' => ['rash', 'itchy skin', 'skin itching', 'hives', 'eczema', 'psoriasis']],
                'acne or skin lesion' => ['weight' => 4, 'terms' => ['acne', 'mole', 'skin lesion', 'skin growth']],
                'hair or nail concern' => ['weight' => 3, 'terms' => ['hair loss', 'nail infection', 'scalp problem']],
            ],
        ],
        'General Medicine' => [
            'reason' => 'General Medicine is a suitable starting point for common or unclear symptoms and can coordinate further care.',
            'preparation' => 'Note when symptoms began, any temperature readings, and the medicines and doses you have taken.',
            'signals' => [
                'fever or chills' => ['weight' => 3, 'terms' => ['fever', 'chills', 'high temperature']],
                'cough or respiratory infection' => ['weight' => 3, 'terms' => ['cough', 'flu', 'common cold', 'runny nose', 'body ache']],
                'digestive symptoms' => ['weight' => 3, 'terms' => ['stomach pain', 'abdominal pain', 'nausea', 'vomiting', 'diarrhea', 'constipation']],
                'fatigue or weakness' => ['weight' => 2, 'terms' => ['fatigue', 'tiredness', 'general weakness', 'loss of appetite']],
            ],
        ],
        'ENT' => [
            'reason' => 'ENT evaluates ear, nose, sinus, and throat symptoms.',
            'preparation' => 'Note any changes in hearing, swallowing, or breathing, and avoid putting objects or unprescribed drops in the ear.',
            'signals' => [
                'ear symptoms' => ['weight' => 4, 'terms' => ['earache', 'ear pain', 'ear infection', 'hearing loss', 'ringing in ears']],
                'nose or sinus symptoms' => ['weight' => 4, 'terms' => ['sinus pain', 'sinus pressure', 'nasal congestion', 'blocked nose']],
                'throat symptoms' => ['weight' => 3, 'terms' => ['sore throat', 'hoarse voice', 'tonsil pain', 'difficulty swallowing']],
            ],
        ],
        'Gynecology' => [
            'reason' => 'Gynecology evaluates reproductive and menstrual health concerns.',
            'preparation' => 'If relevant, note the date of your last menstrual period and any medicines or supplements you take.',
            'signals' => [
                'menstrual symptoms' => ['weight' => 5, 'terms' => ['period pain', 'painful periods', 'irregular period', 'menstrual cramps']],
                'reproductive health concern' => ['weight' => 5, 'terms' => ['pelvic pain', 'pregnancy', 'fertility', 'ovary', 'uterus']],
            ],
        ],
        'Ophthalmology' => [
            'reason' => 'Ophthalmology evaluates eye pain, irritation, and vision changes.',
            'preparation' => 'Note any change in vision and bring your glasses or contact-lens prescription if available.',
            'signals' => [
                'eye or vision symptoms' => ['weight' => 5, 'terms' => ['eye pain', 'red eye', 'blurred vision', 'blurry vision', 'vision problem', 'eye irritation']],
            ],
        ],
        'Psychiatry' => [
            'reason' => 'Mental-health professionals can assess emotional, mood, anxiety, and sleep concerns.',
            'preparation' => 'Consider noting how long this has been affecting you and any changes in sleep, mood, or daily activities.',
            'signals' => [
                'anxiety or panic' => ['weight' => 4, 'terms' => ['anxiety', 'panic attack', 'panic attacks']],
                'mood or sleep concern' => ['weight' => 4, 'terms' => ['depression', 'low mood', 'insomnia', 'cannot sleep', 'mental health concern']],
            ],
        ],
    ];

    private const EMERGENCY_SIGNALS = [
        'Possible stroke warning signs' => ['facial drooping', 'face drooping', 'slurred speech', 'sudden one sided weakness', 'weakness on one side'],
        'Severe breathing difficulty' => ['cannot breathe', 'difficulty breathing', 'struggling to breathe', 'severe shortness of breath'],
        'Possible severe heart symptoms' => ['crushing chest pain', 'chest pain with shortness of breath', 'heart attack'],
        'Possible severe allergic reaction' => ['anaphylaxis', 'throat swelling', 'swollen tongue'],
        'Possible overdose or poisoning' => ['overdose', 'poisoning', 'took too many pills'],
        'Immediate risk of self-harm' => ['suicidal thoughts', 'suicide plan', 'about to hurt myself', 'going to kill myself'],
        'Sudden loss of vision' => ['sudden vision loss', 'suddenly cannot see'],
    ];

    private const MEDICATIONS = [
        'paracetamol', 'acetaminophen', 'ibuprofen', 'aspirin', 'naproxen',
        'antibiotic', 'amoxicillin', 'insulin', 'metformin', 'lisinopril',
    ];

    public function analyze(string $description): array
    {
        $text = $this->normalize($description);
        $scores = [];
        $matchedSignals = [];

        foreach (self::SPECIALTIES as $specialty => $definition) {
            $score = 0;
            foreach ($definition['signals'] as $label => $signal) {
                if ($this->hasPositiveTerm($text, $signal['terms'])) {
                    $score += $signal['weight'];
                    $matchedSignals[] = $label;
                }
            }
            if ($specialty === 'Pediatrics' && $this->describesChild($text)) {
                $score += 7;
                $matchedSignals[] = 'child or infant';
            }
            $scores[$specialty] = $score;
        }

        $emergencyReasons = [];
        foreach (self::EMERGENCY_SIGNALS as $reason => $terms) {
            if ($this->hasPositiveTerm($text, $terms)) {
                $emergencyReasons[] = $reason;
            }
        }

        $medications = array_values(array_filter(
            self::MEDICATIONS,
            fn (string $medication): bool => $this->hasPositiveTerm($text, [$medication])
        ));

        if ($emergencyReasons !== []) {
            return [
                'recommended_specialty' => null,
                'needs_clarification' => false,
                'clarification_message' => null,
                'urgency_flag' => true,
                'urgency_message' => 'These may be emergency warning signs. Call your local emergency number or go to the nearest emergency department now. Do not wait for an online recommendation or routine appointment.',
                'urgency_reasons' => $emergencyReasons,
                'clinical_rationale' => null,
                'preparation_advice' => null,
                'recognized_symptoms' => array_values(array_unique($matchedSignals)),
                'alternative_specialties' => [],
                'recommended_specialties' => [],
                'medications_mentioned' => $medications,
            ];
        }

        arsort($scores);
        $ranked = array_filter($scores, fn (int $score): bool => $score > 0);
        if ($ranked === []) {
            return [
                'recommended_specialty' => null,
                'needs_clarification' => true,
                'clarification_message' => 'I could not identify a symptom to guide a specialty suggestion. Describe what you feel, where it is, and when it started. For medicine questions without symptoms, ask a pharmacist or clinician.',
                'urgency_flag' => false,
                'urgency_message' => null,
                'urgency_reasons' => [],
                'clinical_rationale' => null,
                'preparation_advice' => null,
                'recognized_symptoms' => [],
                'alternative_specialties' => [],
                'recommended_specialties' => [],
                'medications_mentioned' => $medications,
            ];
        }

        $specialties = array_keys($ranked);
        $recommended = $specialties[0];
        $alternatives = array_slice($specialties, 1);
        $rationale = self::SPECIALTIES[$recommended]['reason'];
        if ($alternatives !== []) {
            $rationale = 'The symptoms described may involve more than one area. ' . $recommended . ' is the strongest match; ' . implode(', ', $alternatives) . ' may also be relevant. A clinician can assess the full picture.';
        }

        $preparation = self::SPECIALTIES[$recommended]['preparation'];
        if ($medications !== []) {
            $preparation .= ' Tell the clinician the medicine name, dose, and when you took it; follow the package directions and do not exceed the recommended dose.';
        }

        return [
            'recommended_specialty' => $recommended,
            'needs_clarification' => false,
            'clarification_message' => null,
            'urgency_flag' => false,
            'urgency_message' => null,
            'urgency_reasons' => [],
            'clinical_rationale' => $rationale,
            'preparation_advice' => $preparation,
            'recognized_symptoms' => array_values(array_unique($matchedSignals)),
            'alternative_specialties' => $alternatives,
            'recommended_specialties' => $specialties,
            'medications_mentioned' => $medications,
        ];
    }

    private function normalize(string $text): string
    {
        $text = strtolower(str_replace(["can't", "cannot", "doesn't", "don't", "isn't", "aren't"], ['cannot', 'cannot', 'does not', 'do not', 'is not', 'are not'], $text));

        return trim((string) preg_replace('/[^a-z0-9]+/', ' ', $text));
    }

    private function hasPositiveTerm(string $text, array $terms): bool
    {
        foreach ($terms as $term) {
            $term = $this->normalize($term);
            $pattern = '/(?<![a-z0-9])' . preg_quote($term, '/') . '(?![a-z0-9])/';
            if (!preg_match_all($pattern, $text, $matches, PREG_OFFSET_CAPTURE)) {
                continue;
            }

            foreach ($matches[0] as [$match, $offset]) {
                if (!$this->isNegated($text, $offset)) {
                    return true;
                }
            }
        }

        return false;
    }

    private function isNegated(string $text, int $offset): bool
    {
        $prefix = substr($text, 0, $offset);
        $clauses = preg_split('/\b(?:but|however|although|except|yet)\b/', $prefix);
        $words = preg_split('/\s+/', trim((string) end($clauses)), -1, PREG_SPLIT_NO_EMPTY);
        $window = array_slice($words, -4);
        $negators = ['no', 'not', 'without', 'deny', 'denies', 'denied', 'never', 'negative'];

        foreach ($window as $index => $word) {
            if (!in_array($word, $negators, true)) {
                continue;
            }
            if ($word === 'not' && ($window[$index + 1] ?? null) === 'only') {
                continue;
            }
            $distance = count($window) - $index - 1;
            $between = array_slice($window, $index + 1);
            if ($distance <= 2 || ($distance <= 4 && array_intersect($between, ['or', 'nor', 'and']) !== [])) {
                return true;
            }
        }

        return false;
    }

    private function describesChild(string $text): bool
    {
        if ($this->hasPositiveTerm($text, ['my child', 'my son', 'my daughter', 'my baby', 'infant', 'toddler', 'pediatric', 'for my kid'])) {
            return true;
        }

        if (preg_match('/\b(\d{1,2})\s*(?:year|yr)s?\s*old\b/', $text, $match)) {
            return (int) $match[1] < 18;
        }

        return false;
    }
}