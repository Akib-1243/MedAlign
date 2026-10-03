<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminClinicVerificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_load_clinic_verification_records(): void
    {
        $this->withoutMiddleware();

        $this->getJson('/api/admin/clinic-verifications')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data', []);
    }
}
