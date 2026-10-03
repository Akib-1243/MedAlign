<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('patients', function (Blueprint $table) {
            $table->string('address', 255)->nullable();
            $table->string('marital_status', 30)->nullable();
            $table->string('emergency_contact_name', 100)->nullable();
            $table->string('emergency_contact_phone', 20)->nullable();
            $table->string('profile_photo_path', 255)->nullable();
            $table->string('blood_group', 5)->nullable();
            $table->text('allergies')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('patients', function (Blueprint $table) {
            $table->dropColumn([
                'address',
                'marital_status',
                'emergency_contact_name',
                'emergency_contact_phone',
                'profile_photo_path',
                'blood_group',
                'allergies',
            ]);
        });
    }
};