<?php

namespace App\Console\Commands;

use App\Http\Services\TelegramService;
use Illuminate\Console\Command;

class TelegramSetWebhook extends Command
{
    protected $signature = 'telegram:set-webhook {url? : Public HTTPS base URL, defaults to APP_URL}';

    protected $description = 'Register the Telegram bot webhook (for deployed environments)';

    public function handle(TelegramService $telegram): int
    {
        if (!$telegram->isConfigured()) {
            $this->error('Set TELEGRAM_BOT_TOKEN in .env first.');
            return self::FAILURE;
        }

        $url = rtrim($this->argument('url') ?? config('app.url'), '/') . '/api/telegram/webhook';

        $response = $telegram->call('setWebhook', array_filter([
            'url' => $url,
            'secret_token' => config('services.telegram.webhook_secret'),
            'allowed_updates' => ['message'],
        ]));

        if (!$response->json('ok')) {
            $this->error('Telegram rejected the webhook: ' . $response->json('description'));
            return self::FAILURE;
        }

        $this->info("Webhook set to {$url}");
        return self::SUCCESS;
    }
}
