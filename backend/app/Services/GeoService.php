<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class GeoService
{
    public function lookup(string $ip): array
    {
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
