<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('first_name', 50)->nullable()->after('name');
            $table->string('last_name', 50)->nullable()->after('first_name');
            $table->string('secondary_phone', 20)->nullable()->after('phone');
            $table->unsignedTinyInteger('age')->nullable()->after('secondary_phone');
            $table->boolean('registering_for_other')->default(false)->after('age');
            $table->string('relationship_to_patient', 30)->nullable()->after('registering_for_other');
            $table->string('parent_guardian_name', 100)->nullable()->after('relationship_to_patient');
            $table->string('parent_guardian_phone', 20)->nullable()->after('parent_guardian_name');
        });

        Schema::table('patients', function (Blueprint $table) {
            $table->string('first_name', 50)->nullable()->after('name');
            $table->string('last_name', 50)->nullable()->after('first_name');
            $table->string('secondary_phone', 20)->nullable()->after('phone');
            $table->unsignedTinyInteger('age')->nullable()->after('secondary_phone');
            $table->boolean('registering_for_other')->default(false)->after('age');
            $table->string('relationship_to_patient', 30)->nullable()->after('registering_for_other');
            $table->string('parent_guardian_name', 100)->nullable()->after('relationship_to_patient');
            $table->string('parent_guardian_phone', 20)->nullable()->after('parent_guardian_name');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'first_name',
                'last_name',
                'secondary_phone',
                'age',
                'registering_for_other',
                'relationship_to_patient',
                'parent_guardian_name',
                'parent_guardian_phone',
            ]);
        });

        Schema::table('patients', function (Blueprint $table) {
            $table->dropColumn([
                'first_name',
                'last_name',
                'secondary_phone',
                'age',
                'registering_for_other',
                'relationship_to_patient',
                'parent_guardian_name',
                'parent_guardian_phone',
            ]);
        });
    }
};