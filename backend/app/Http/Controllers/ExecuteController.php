<?php

namespace App\Http\Controllers;

use App\Services\BridgeService;
use App\Services\GeoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class ExecuteController extends Controller
{
    public function __construct(
        private BridgeService $bridge,
        private GeoService $geo,
    ) {}

    public function execute(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'sessionId' => 'required|string',
            'command'   => 'required|string',
        ]);

        $ip = $request->ip();
        $ipHash = hash('sha256', $ip);
        $status = 'success';
        $error = null;
        $result = null;

        try {
            $result = $this->bridge->execute($validated['sessionId'], $validated['command']);

            $slowdown = config('app.simulation_slowdown_ms');
            if ($slowdown > 0) {
                usleep($slowdown * 1000);
            }
        } catch (RuntimeException $e) {
            $status = 'error';
            $error = $e->getMessage();
            $httpStatus = $e->getCode() === 404 ? 404 : 500;
        }

        $geo = $this->geo->lookup($ip);

        DB::table('request_logs')->insert([
            'session_id' => $validated['sessionId'],
            'type'       => 'execute',
            'command'    => $validated['command'],
            'params'     => null,
            'status'     => $status,
            'error'      => $error,
            'ip'         => $ipHash,
            'city'       => $geo['city'],
            'country'    => $geo['country'],
            'created_at' => now(),
        ]);

        if ($status === 'error') {
            return response()->json(['error' => $error], $httpStatus ?? 500);
        }

        return response()->json($result);
    }
}
