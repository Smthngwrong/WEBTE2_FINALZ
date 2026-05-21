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
        $ipHash = hash('sha256', $ip);
        $cooldown = config('app.stats_cooldown_minutes');

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
            'ip'         => $ipHash,
            'city'       => $geo['city'],
            'country'    => $geo['country'],
            'used_at'    => now(),
        ]);

        return response()->json(['ok' => true, 'counted' => true]);
    }

    /** Returns paginated individual animation play records, excluding private fields. */
    public function details(Request $request): JsonResponse
    {
        $validatedAnimation = $request->validate([
            'animation' => 'sometimes|in:pendulum,ballbeam',
            'per_page'  => 'sometimes|integer|min:1|max:200',
        ]);

        $perPage = (int) ($validatedAnimation['per_page'] ?? 50);

        $query = DB::table('animation_stats')
            ->select('id', 'animation', 'city', 'country', 'used_at')
            ->orderBy('used_at', 'desc');

        if (isset($validatedAnimation['animation'])) {
            $query->where('animation', $validatedAnimation['animation']);
        }

        return response()->json($query->paginate($perPage));
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
