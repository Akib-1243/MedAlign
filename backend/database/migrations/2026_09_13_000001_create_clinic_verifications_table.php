<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clinic_verifications', function (Blueprint $table) {
            $table->id('verification_id');
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('clinic_id')->nullable()->constrained('clinics', 'clinic_id')->nullOnDelete();
            $table->string('institution_type', 50);
            $table->string('bangla_name', 150)->nullable();
            $table->unsignedSmallInteger('year_established')->nullable();
            $table->string('website', 255)->nullable();
            $table->string('division', 100);
            $table->string('district', 100);
            $table->string('upazila', 100);
            $table->string('postal_code', 20)->nullable();
            $table->string('ownership_type', 50);
            $table->string('owner_organization_name', 150);
            $table->string('authorized_representative_name', 150);
            $table->string('representative_designation', 100);
            $table->string('representative_phone', 30);
            $table->string('representative_email', 150);
            $table->string('dghs_license_number', 100)->nullable();
            $table->string('trade_license_number', 100)->nullable();
            $table->string('tin', 100)->nullable();
            $table->string('bin_vat_number', 100)->nullable();
            $table->unsignedInteger('licensed_bed_count')->nullable();
            $table->unsignedInteger('current_bed_count')->nullable();
            $table->json('services')->nullable();
            $table->json('operating_information')->nullable();
            $table->json('documents')->nullable();
            $table->string('status', 30)->default('pending_review');
            $table->text('review_notes')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();

            $table->unique('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clinic_verifications');
    }
};
