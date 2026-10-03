<?php

namespace App\Console\Commands;

use App\Http\Services\TelegramService;
use Illuminate\Console\Command;

class TelegramStatus extends Command
{
    protected $signature = 'telegram:status';

    protected $description = 'Check Telegram bot configuration and connectivity without sending a message';

    public function handle(TelegramService $telegram): int
    {
        if (!$telegram->isConfigured()) {
            $this->error('Set TELEGRAM_BOT_TOKEN in backend/.env first.');
            return self::FAILURE;
        }

        $configuredUsername = ltrim((string) config('services.telegram.bot_username'), '@');
        if ($configuredUsername === '') {
            $this->error('Set TELEGRAM_BOT_USERNAME in backend/.env first.');
            return self::FAILURE;
        }

        try {
            $response = $telegram->call('getMe');
        } catch (\Throwable $e) {
            $this->error('Cannot reach Telegram: ' . $telegram->redact($e->getMessage()));
            return self::FAILURE;
        }

        if (!$response->successful() || !$response->json('ok')) {
            $this->error('Telegram bot check failed: ' . ($response->json('description') ?? 'HTTP ' . $response->status()));
            return self::FAILURE;
        }

        $username = $response->json('result.username');
        if (!$username || strcasecmp($configuredUsername, $username) !== 0) {
            $this->error('TELEGRAM_BOT_USERNAME does not match the bot returned by TELEGRAM_BOT_TOKEN.');
            return self::FAILURE;
        }

        $this->info('Telegram bot is reachable: @' . $username);

        return self::SUCCESS;
    }
}
