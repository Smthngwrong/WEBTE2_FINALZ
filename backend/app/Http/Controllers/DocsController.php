<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class DocsController extends Controller
{
    public function yaml(): Response|JsonResponse
    {
        $path = base_path('openapi.yaml');

        if (!file_exists($path)) {
            return response()->json(['error' => 'openapi.yaml not found'], 404);
        }

        return response(file_get_contents($path), 200, [
            'Content-Type' => 'application/yaml',
        ]);
    }

    public function pdf(): Response|JsonResponse
    {
        $frontendUrl = rtrim(config('app.frontend_url'), '/');
        $chromium    = config('app.chromium_path');
        $scriptPath  = base_path('scripts/generate-pdf.js');
        $outputPath  = storage_path('app/api-docs.pdf');

        $docsUrl = "{$frontendUrl}/docs";

        $cmd = 'node'
            . ' ' . escapeshellarg($scriptPath)
            . ' ' . escapeshellarg($docsUrl)
            . ' ' . escapeshellarg($outputPath)
            . ' ' . escapeshellarg($chromium)
            . ' 2>&1';

        exec($cmd, $output, $exitCode);

        if ($exitCode !== 0 || !file_exists($outputPath)) {
            return response()->json(
                ['error' => 'PDF generation failed: ' . implode("\n", $output)],
                500
            );
        }

        $pdf = file_get_contents($outputPath);
        @unlink($outputPath);

        return response($pdf, 200, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="api-docs.pdf"',
        ]);
    }
}
