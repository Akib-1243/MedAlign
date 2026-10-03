<?php

namespace Tests\Unit;

use App\Services\SymptomTriageService;
use PHPUnit\Framework\TestCase;

class SymptomTriageServiceTest extends TestCase
{
    private SymptomTriageService $triage;

    protected function setUp(): void
    {
        $this->triage = new SymptomTriageService();
    }

    public function test_negated_symptom_does_not_drive_the_specialty_match(): void
    {
        $result = $this->triage->analyze('no chest pain, only a mild headache');

        $this->assertSame('Neurology', $result['recommended_specialty']);
        $this->assertNotContains('Cardiology', $result['alternative_specialties']);
    }

    public function test_medication_only_query_asks_for_more_detail_instead_of_guessing(): void
    {
        $result = $this->triage->analyze('I have no symptoms, only asking about paracetamol');

        $this->assertTrue($result['needs_clarification']);
        $this->assertNull($result['recommended_specialty']);
        $this->assertSame(['paracetamol'], $result['medications_mentioned']);
    }

    public function test_emergency_signal_takes_precedence_over_a_routine_specialty(): void
    {
        $result = $this->triage->analyze('sudden facial drooping and slurred speech');

        $this->assertTrue($result['urgency_flag']);
        $this->assertNull($result['recommended_specialty']);
        $this->assertNotEmpty($result['urgency_reasons']);
    }

    public function test_negated_emergency_signal_does_not_trigger_urgent_escalation(): void
    {
        $result = $this->triage->analyze('no facial drooping or slurred speech, only a mild headache');

        $this->assertFalse($result['urgency_flag']);
        $this->assertSame('Neurology', $result['recommended_specialty']);
    }

    public function test_child_context_prioritizes_pediatrics(): void
    {
        $result = $this->triage->analyze('my 4 year old has a fever and chills');

        $this->assertSame('Pediatrics', $result['recommended_specialty']);
    }

    public function test_multiple_symptom_groups_return_all_relevant_specialties_in_rank_order(): void
    {
        $result = $this->triage->analyze('I have chest pain and knee pain');

        $this->assertSame('Cardiology', $result['recommended_specialty']);
        $this->assertSame(['Cardiology', 'Orthopedics'], $result['recommended_specialties']);
        $this->assertSame(['Orthopedics'], $result['alternative_specialties']);
    }
}