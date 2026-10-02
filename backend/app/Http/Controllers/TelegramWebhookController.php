<?php

namespace App\Http\Controllers;

use App\Http\Services\TelegramService;
use Illuminate\Http\Request;

class TelegramWebhookController extends Controller
{
    public function handle(Request $request, TelegramService $telegram)
    {
        $secret = config('services.telegram.webhook_secret');
        if ($secret && !hash_equals($secret, (string) $request->header('X-Telegram-Bot-Api-Secret-Token'))) {
            return response()->json(['ok' => false], 403);
        }

        $telegram->handleUpdate($request->all());

        // Always 200 so Telegram does not keep retrying the same update.
        return response()->json(['ok' => true]);
    }
}
