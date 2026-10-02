<?php

namespace App\Http\Services;

use App\Models\Patient;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Thin wrapper around the Telegram Bot API.
 *
 * Telegram bots cannot message a user by phone number. A patient links their
 * account once by opening the bot and tapping "Share phone number"; we match
 * that number against patients.phone and store the chat id for later alerts.
 */
class TelegramService
{
    public function isConfigured(): bool
    {
        return !empty(config('services.telegram.bot_token'));
    }

    public function botLink(): ?string
    {
        $username = config('services.telegram.bot_username');

        return $username ? 'https://t.me/' . ltrim($username, '@') : null;
    }

    public function sendMessage(string $chatId, string $text, array $extra = []): bool
    {
        if (!$this->isConfigured()) {
            return false;
        }

        try {
            $response = $this->call('sendMessage', array_merge([
                'chat_id' => $chatId,
                'text' => $text,
                'parse_mode' => 'HTML',
            ], $extra));

            if (!$response->successful()) {
                Log::warning('Telegram sendMessage failed: ' . $response->body());
                return false;
            }

            return true;
        } catch (\Throwable $e) {
            Log::warning('Telegram sendMessage error: ' . $this->redact($e->getMessage()));
            return false;
        }
    }

    /**
     * Hide the bot token in error text (Guzzle includes the request URL).
     */
    public function redact(string $text): string
    {
        $token = config('services.telegram.bot_token');

        return $token ? str_replace($token, '***', $text) : $text;
    }

    public function call(string $method, array $params = [], int $timeout = 5)
    {
        $token = config('services.telegram.bot_token');

        return Http::timeout($timeout)->post("https://api.telegram.org/bot{$token}/{$method}", $params);
    }

    /**
     * Handle one incoming update, from either the webhook or the poll command.
     */
    public function handleUpdate(array $update): void
    {
        $message = $update['message'] ?? null;
        if (!$message || !isset($message['chat']['id'])) {
            return;
        }

        $chatId = (string) $message['chat']['id'];

        if (isset($message['contact'])) {
            $this->linkContact($chatId, $message);
            return;
        }

        $text = trim($message['text'] ?? '');

        if (str_starts_with($text, '/stop')) {
            Patient::where('telegram_chat_id', $chatId)->update(['telegram_chat_id' => null]);
            $this->sendMessage($chatId, 'You will no longer receive MedAlign queue alerts here. Send /start to link again.', [
                'reply_markup' => ['remove_keyboard' => true],
            ]);
            return;
        }

        $this->sendMessage(
            $chatId,
            "Welcome to <b>MedAlign</b> queue alerts.\n\nTap <b>Share phone number</b> below so we can match you with your patient record. Use the same number you registered with at the clinic.",
            ['reply_markup' => [
                'keyboard' => [[['text' => 'Share phone number', 'request_contact' => true]]],
                'resize_keyboard' => true,
                'one_time_keyboard' => true,
            ]]
        );
    }

    private function linkContact(string $chatId, array $message): void
    {
        $contact = $message['contact'];

        // Only accept the sender's own contact card, not someone else's.
        if (($contact['user_id'] ?? null) !== ($message['from']['id'] ?? null)) {
            $this->sendMessage($chatId, 'Please share your own phone number using the button below.');
            return;
        }

        $patients = $this->patientsByPhone($contact['phone_number'] ?? '');

        if ($patients->isEmpty()) {
            $this->sendMessage($chatId, 'We could not find a patient registered with this phone number. Please check with the clinic reception.', [
                'reply_markup' => ['remove_keyboard' => true],
            ]);
            return;
        }

        Patient::whereIn('patient_id', $patients->pluck('patient_id'))->update(['telegram_chat_id' => $chatId]);

        $this->sendMessage(
            $chatId,
            "Linked to <b>" . e($patients->first()->name) . "</b>. You will get a message here when your turn is near and when you are called.\n\nSend /stop to unsubscribe.",
            ['reply_markup' => ['remove_keyboard' => true]]
        );
    }

    /**
     * Match phone numbers regardless of formatting or country prefix by
     * comparing the last 10 digits (e.g. +8801712345678 == 01712345678).
     */
    private function patientsByPhone(string $phone)
    {
        $suffix = substr(preg_replace('/\D/', '', $phone), -10);
        if (strlen($suffix) < 7) {
            return collect();
        }

        return Patient::where('phone', 'like', '%' . substr($suffix, -4))
            ->get()
            ->filter(fn (Patient $p) => str_ends_with(preg_replace('/\D/', '', $p->phone), $suffix))
            ->values();
    }
}
