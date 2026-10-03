<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('friend_parent_name', 100)->nullable()->after('parent_guardian_phone');
            $table->string('friend_parent_phone', 20)->nullable()->after('friend_parent_name');
        });

        Schema::table('patients', function (Blueprint $table) {
            $table->string('friend_parent_name', 100)->nullable()->after('parent_guardian_phone');
            $table->string('friend_parent_phone', 20)->nullable()->after('friend_parent_name');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['friend_parent_name', 'friend_parent_phone']);
        });

        Schema::table('patients', function (Blueprint $table) {
            $table->dropColumn(['friend_parent_name', 'friend_parent_phone']);
        });
    }
};