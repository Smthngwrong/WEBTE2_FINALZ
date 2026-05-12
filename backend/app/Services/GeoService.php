<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class GeoService
{
    private function isPrivate(string $ip): bool
    {
        return filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false;
    }

    public function lookup(string $ip): array
    {
        if ($this->isPrivate($ip)) {
            return ['city' => null, 'country' => null];
        }

        try {
            $response = Http::timeout(3)->get("http://ip-api.com/json/{$ip}?fields=city,country");
            if ($response->ok()) {
                return [
                    'city'    => $response->json('city'),
                    'country' => $response->json('country'),
                ];
            }
        } catch (\Throwable) {
        }

        return ['city' => null, 'country' => null];
    }
}
