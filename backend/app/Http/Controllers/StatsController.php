<?php

namespace App\Http\Controllers;

use App\Services\GeoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StatsController extends Controller
{
    public function __construct(private GeoService $geo) {}

    public function record(Request $request): JsonResponse
    {
        $v = $request->validate([
            'animation' => 'required|in:pendulum,ballbeam',
        ]);

        $userToken = $request->header('X-User-Token');
        $ip = $request->ip();
        $cooldown = (int) env('STATS_COOLDOWN_MINUTES', 10);

        // Register token if new
        if ($userToken) {
            DB::table('user_tokens')->insertOrIgnore([
                'token'      => $userToken,
                'created_at' => now(),
            ]);
        }

        // Enforce cooldown: check if this user already recorded within the window
        if ($userToken) {
            $recent = DB::table('animation_stats')
                ->where('animation', $v['animation'])
                ->where('user_token', $userToken)
                ->where('used_at', '>=', now()->subMinutes($cooldown))
                ->exists();

            if ($recent) {
                return response()->json(['ok' => true, 'counted' => false]);
            }
        }

        $geo = $this->geo->lookup($ip);

        DB::table('animation_stats')->insert([
            'animation'  => $v['animation'],
            'user_token' => $userToken,
            'ip'         => $ip,
            'city'       => $geo['city'],
            'country'    => $geo['country'],
            'used_at'    => now(),
        ]);

        return response()->json(['ok' => true, 'counted' => true]);
    }

    public function index(): JsonResponse
    {
        $execTotal = DB::table('request_logs')->count();

        $execByCountry = DB::table('request_logs')
            ->whereNotNull('country')
            ->selectRaw('country, count(*) as cnt')
            ->groupBy('country')
            ->pluck('cnt', 'country');

        $pendulumTotal = DB::table('animation_stats')->where('animation', 'pendulum')->count();
        $pendulumByCountry = DB::table('animation_stats')
            ->where('animation', 'pendulum')
            ->whereNotNull('country')
            ->selectRaw('country, count(*) as cnt')
            ->groupBy('country')
            ->pluck('cnt', 'country');

        $ballbeamTotal = DB::table('animation_stats')->where('animation', 'ballbeam')->count();
        $ballbeamByCountry = DB::table('animation_stats')
            ->where('animation', 'ballbeam')
            ->whereNotNull('country')
            ->selectRaw('country, count(*) as cnt')
            ->groupBy('country')
            ->pluck('cnt', 'country');

        return response()->json([
            'executions' => [
                'total'      => $execTotal,
                'by_country' => $execByCountry,
            ],
            'animations' => [
                'pendulum' => [
                    'total'      => $pendulumTotal,
                    'by_country' => $pendulumByCountry,
                ],
                'ballbeam' => [
                    'total'      => $ballbeamTotal,
                    'by_country' => $ballbeamByCountry,
                ],
            ],
        ]);
    }
}
