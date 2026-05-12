<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class BridgeService
{
    private string $baseUrl;
    private string $secret;

    public function __construct()
    {
        $this->baseUrl = rtrim(config('app.octave_bridge_url'), '/');
        $this->secret = config('app.bridge_secret');
    }

    public function createSession(): string
    {
        $response = $this->post('/session/create', []);
        return $response['sessionId'];
    }

    public function execute(string $sessionId, string $command): array
    {
        return $this->post("/session/{$sessionId}/execute", ['command' => $command]);
    }

    public function destroySession(string $sessionId): void
    {
        Http::withHeaders(['X-Bridge-Secret' => $this->secret])
            ->delete("{$this->baseUrl}/session/{$sessionId}");
    }

    private function post(string $path, array $body): array
    {
        $response = Http::withHeaders(['X-Bridge-Secret' => $this->secret])
            ->post("{$this->baseUrl}{$path}", $body);

        if ($response->failed()) {
            $error = $response->json('error') ?? $response->body();
            throw new RuntimeException($error, $response->status());
        }

        return $response->json();
    }
}
