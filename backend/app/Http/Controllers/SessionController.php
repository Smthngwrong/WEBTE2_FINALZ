<?php

namespace App\Http\Controllers;

use App\Services\BridgeService;
use Illuminate\Http\JsonResponse;
use RuntimeException;

class SessionController extends Controller
{
    public function __construct(private BridgeService $bridge) {}

    public function create(): JsonResponse
    {
        try {
            $sessionId = $this->bridge->createSession();
            return response()->json(['sessionId' => $sessionId]);
        } catch (RuntimeException $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function destroy(string $id): JsonResponse
    {
        try {
            $this->bridge->destroySession($id);
            return response()->json(['ok' => true]);
        } catch (RuntimeException $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
