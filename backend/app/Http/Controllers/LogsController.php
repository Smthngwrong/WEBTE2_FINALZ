<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

class LogsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = min((int) $request->query('per_page', 50), 200);

        $logs = DB::table('request_logs')
            ->orderByDesc('created_at')
            ->paginate($perPage);

        return response()->json($logs);
    }

    public function export(): Response
    {
        $logs = DB::table('request_logs')->orderByDesc('created_at')->get();

        $headers = [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => 'attachment; filename="request_logs.csv"',
        ];

        $columns = ['id', 'session_id', 'type', 'command', 'params', 'status', 'error', 'ip', 'city', 'country', 'created_at'];

        $csv = implode(',', $columns) . "\n";
        foreach ($logs as $row) {
            $values = array_map(function ($col) use ($row) {
                $val = $row->$col ?? '';
                // Wrap in quotes and escape internal quotes
                return '"' . str_replace('"', '""', (string) $val) . '"';
            }, $columns);
            $csv .= implode(',', $values) . "\n";
        }

        return response($csv, 200, $headers);
    }
}
