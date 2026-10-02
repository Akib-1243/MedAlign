<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Databases created before 'patient' was added to the users.role enum in
 * 2026_08_21_000003 still reject patient registrations ("Data truncated for
 * column 'role'"). Bring the column in line with that migration.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        DB::statement("ALTER TABLE users MODIFY role ENUM('admin', 'doctor', 'reception', 'patient') NOT NULL DEFAULT 'patient'");
    }

    public function down(): void
    {
        // Intentionally left as-is: removing 'patient' would fail for existing patient users.
    }
};
