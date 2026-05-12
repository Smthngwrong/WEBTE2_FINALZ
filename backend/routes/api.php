<?php

use App\Http\Controllers\DocsController;
use App\Http\Controllers\ExecuteController;
use App\Http\Controllers\LogsController;
use App\Http\Controllers\SessionController;
use App\Http\Controllers\SimulateController;
use App\Http\Controllers\StatsController;
use Illuminate\Support\Facades\Route;

Route::middleware('api.key')->group(function () {
    // Health
    Route::get('/ping', fn () => response()->json(['ok' => true]));

    // CAS Terminal
    Route::post('/session/create', [SessionController::class, 'create']);
    Route::delete('/session/{id}', [SessionController::class, 'destroy']);
    Route::post('/execute', [ExecuteController::class, 'execute']);

    // Simulations
    Route::post('/simulate/pendulum', [SimulateController::class, 'pendulum']);
    Route::post('/simulate/ballbeam', [SimulateController::class, 'ballbeam']);

    // Logs
    Route::get('/logs', [LogsController::class, 'index']);
    Route::get('/logs/export', [LogsController::class, 'export']);

    // Stats
    Route::post('/stats/record', [StatsController::class, 'record']);
    Route::get('/stats', [StatsController::class, 'index']);

    // Docs
    Route::get('/openapi.yaml', [DocsController::class, 'yaml']);
    Route::get('/docs/pdf', [DocsController::class, 'pdf']);
});
