<?php

namespace App\Http\Services;

use App\Models\QueueToken;

/**
 * Sends Telegram alerts to patients as the queue moves:
 * - "your turn is near" when three or fewer patients are ahead
 * - "it's your turn" when the doctor calls their token
 *
 * Only patients who have linked Telegram (and kept Telegram alerts on) are
 * messaged; everyone else is skipped.
 */
class QueueNotificationService
{
    private const NEAR_TURN_THRESHOLD = 3;

    public function __construct(private TelegramService $telegram)
    {
    }

    public function notifyCalled(QueueToken $token): void
    {
        $token->loadMissing(['patient.alertPreferences', 'doctor.user', 'doctor.clinic', 'counter']);

        if (!$chatId = $this->chatIdFor($token)) {
            return;
        }

        $room = $token->counter?->counter_name;

        $this->telegram->sendMessage($chatId, implode("\n", [
            "🔔 <b>It's your turn!</b>",
            '',
            "Token <b>#{$token->token_number}</b>",
            $this->doctorLine($token),
            $room ? 'Please proceed to <b>' . e($room) . '</b> now.' : 'Please proceed to the consultation room now.',
        ]));
    }

    /**
     * Alert every waiting patient for this doctor who has just come within
     * the fixed near-turn range. Each token is alerted at most once.
     */
    public function notifyNearTurn(?int $doctorId): void
    {
        if (!$doctorId || !$this->telegram->isConfigured()) {
            return;
        }

        $waiting = QueueToken::with(['patient.alertPreferences', 'doctor.user', 'doctor.clinic'])
            ->where('doctor_id', $doctorId)
            ->where('status', 'waiting')
            ->orderBy('token_number')
            ->limit(self::NEAR_TURN_THRESHOLD + 1)
            ->get();

        foreach ($waiting as $ahead => $token) {
            if ($token->near_turn_notified_at) {
                continue;
            }

            if ($ahead > self::NEAR_TURN_THRESHOLD || !$chatId = $this->chatIdFor($token)) {
                continue;
            }

            $sent = $this->telegram->sendMessage($chatId, implode("\n", [
                '⏳ <b>Your turn is coming up</b>',
                '',
                "Token <b>#{$token->token_number}</b>",
                $this->doctorLine($token),
                $ahead === 0
                    ? 'You are <b>next</b> in line.'
                    : "<b>{$ahead}</b> patient" . ($ahead === 1 ? '' : 's') . ' ahead of you.',
                'Please make your way to the waiting area.',
            ]));

            if ($sent) {
                $token->forceFill(['near_turn_notified_at' => now()])->save();
            }
        }
    }

    /**
     * The patient's Telegram chat, or null when they haven't linked Telegram
     * or have switched Telegram alerts off.
     */
    private function chatIdFor(QueueToken $token): ?string
    {
        $patient = $token->patient;
        if (!$patient || !$patient->telegram_chat_id) {
            return null;
        }

        $enabled = $patient->alertPreferences?->telegram_enabled ?? true;

        return $enabled ? $patient->telegram_chat_id : null;
    }

    private function doctorLine(QueueToken $token): string
    {
        $doctor = $token->doctor?->user?->name ?? 'your doctor';
        $clinic = $token->doctor?->clinic?->name;

        return 'Doctor: ' . e($doctor) . ($clinic ? ' — ' . e($clinic) : '');
    }
}
