<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class TelegramStatusTest extends TestCase
{
    public function test_reports_the_bot_username_when_telegram_is_reachable(): void
    {
        config([
            'services.telegram.bot_token' => 'test-token',
            'services.telegram.bot_username' => '@MedAlignTestBot',
        ]);
        Http::fake([
            'api.telegram.org/*' => Http::response([
                'ok' => true,
                'result' => ['username' => 'MedAlignTestBot'],
            ]),
        ]);

        $this->artisan('telegram:status')
            ->expectsOutput('Telegram bot is reachable: @MedAlignTestBot')
            ->assertExitCode(0);
    }

    public function test_reports_when_the_bot_token_is_missing(): void
    {
        config(['services.telegram.bot_token' => null]);

        $this->artisan('telegram:status')
            ->expectsOutput('Set TELEGRAM_BOT_TOKEN in backend/.env first.')
            ->assertExitCode(1);

        Http::assertNothingSent();
    }

    public function test_reports_when_the_configured_username_does_not_match_the_token(): void
    {
        config([
            'services.telegram.bot_token' => 'test-token',
            'services.telegram.bot_username' => 'AnotherBot',
        ]);
        Http::fake([
            'api.telegram.org/*' => Http::response([
                'ok' => true,
                'result' => ['username' => 'MedAlignTestBot'],
            ]),
        ]);

        $this->artisan('telegram:status')
            ->expectsOutput('TELEGRAM_BOT_USERNAME does not match the bot returned by TELEGRAM_BOT_TOKEN.')
            ->assertExitCode(1);
    }
}
