<?php

namespace App\Console\Commands;

use App\Http\Services\TelegramService;
use Illuminate\Console\Command;

/**
 * Local development alternative to the webhook: long-polls Telegram for
 * updates so patients can link their phone without a public HTTPS URL.
 */
class TelegramPoll extends Command
{
    protected $signature = 'telegram:poll';

    protected $description = 'Receive Telegram bot updates by long polling (for local development)';

    public function handle(TelegramService $telegram): int
    {
        if (!$telegram->isConfigured()) {
            $this->error('Set TELEGRAM_BOT_TOKEN in .env first.');
            return self::FAILURE;
        }

        // getUpdates does not work while a webhook is registered.
        try {
            $telegram->call('deleteWebhook');
        } catch (\Throwable $e) {
            $this->error('Cannot reach Telegram: ' . $telegram->redact($e->getMessage()));
            return self::FAILURE;
        }
        $this->info('Polling Telegram for updates. Press Ctrl+C to stop.');

        $offset = 0;
        while (true) {
            try {
                $response = $telegram->call('getUpdates', [
                    'offset' => $offset,
                    'timeout' => 25,
                    'allowed_updates' => ['message'],
                ], 30);
            } catch (\Throwable $e) {
                $this->warn($telegram->redact($e->getMessage()));
                sleep(3);
                continue;
            }

            foreach ($response->json('result') ?? [] as $update) {
                $offset = $update['update_id'] + 1;
                $this->line('Update ' . $update['update_id'] . ' from chat ' . ($update['message']['chat']['id'] ?? '?'));
                $telegram->handleUpdate($update);
            }
        }
    }
}
