<?php

namespace App\Http\Controllers;

use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class DocsController extends Controller
{
    public function yaml(): Response
    {
        $path = base_path('openapi.yaml');

        if (!file_exists($path)) {
            return response()->json(['error' => 'openapi.yaml not found'], 404);
        }

        return response(file_get_contents($path), 200, [
            'Content-Type' => 'application/yaml',
        ]);
    }

    public function pdf(): Response
    {
        $frontendUrl = rtrim(env('FRONTEND_URL', 'http://nginx:80'), '/');
        $chromium    = env('CHROMIUM_PATH', '/usr/bin/chromium');
        $outputPath  = storage_path('app/api-docs.pdf');

        $docsUrl = "{$frontendUrl}/docs";

        $cmd = escapeshellcmd($chromium)
            . ' --headless'
            . ' --no-sandbox'
            . ' --disable-gpu'
            . ' --disable-dev-shm-usage'
            . ' --print-to-pdf=' . escapeshellarg($outputPath)
            . ' --print-to-pdf-no-header'
            . ' ' . escapeshellarg($docsUrl)
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
