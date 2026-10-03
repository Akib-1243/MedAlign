<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('patients', function (Blueprint $table) {
            $table->string('telegram_chat_id', 32)->nullable()->after('phone');
        });

        Schema::table('alert_preferences', function (Blueprint $table) {
            $table->boolean('telegram_enabled')->default(true)->after('whatsapp_enabled');
        });

        Schema::table('queue_tokens', function (Blueprint $table) {
            $table->timestamp('near_turn_notified_at')->nullable()->after('completed_time');
        });
    }

    public function down(): void
    {
        Schema::table('queue_tokens', function (Blueprint $table) {
            $table->dropColumn('near_turn_notified_at');
        });

        Schema::table('alert_preferences', function (Blueprint $table) {
            $table->dropColumn('telegram_enabled');
        });

        Schema::table('patients', function (Blueprint $table) {
            $table->dropColumn('telegram_chat_id');
        });
    }
};
