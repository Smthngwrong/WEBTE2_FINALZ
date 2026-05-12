<?php

namespace App\Http\Controllers;

use App\Services\BridgeService;
use App\Services\GeoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class SimulateController extends Controller
{
    public function __construct(
        private BridgeService $bridge,
        private GeoService $geo,
    ) {}

    public function pendulum(Request $request): JsonResponse
    {
        $v = $request->validate([
            'angle0'      => 'required|numeric',
            'velocity0'   => 'required|numeric',
            'duration'    => 'required|numeric|min:1|max:30',
            'final_state' => 'nullable|array|size:4',
            'r'           => 'nullable|numeric',
        ]);

        $angle0    = (float) $v['angle0'];
        $velocity0 = (float) $v['velocity0'];
        $duration  = (float) $v['duration'];
        $r         = isset($v['r']) ? (float) $v['r'] : 0.2;

        if (!empty($v['final_state'])) {
            $x0 = $this->formatVec($v['final_state']);
        } else {
            $x0 = "[0;0;{$angle0};{$velocity0}]";
        }

        $script = $this->pendulumScript($r, $duration, $x0);

        return $this->runSimulation($request, $script, 'simulate_pendulum', $v, function (array $raw) {
            return [
                't'           => $raw['t'],
                'angle'       => $raw['y_col2'],
                'position'    => $raw['y_col1'],
                'final_state' => $raw['final_state'],
            ];
        });
    }

    public function ballbeam(Request $request): JsonResponse
    {
        $v = $request->validate([
            'ball_position0' => 'required|numeric',
            'beam_angle0'    => 'required|numeric',
            'duration'       => 'required|numeric|min:1|max:30',
            'final_state'    => 'nullable|array|size:4',
            'r'              => 'nullable|numeric',
        ]);

        $ball0    = (float) $v['ball_position0'];
        $beam0    = (float) $v['beam_angle0'];
        $duration = (float) $v['duration'];
        $r        = isset($v['r']) ? (float) $v['r'] : 0.25;

        if (!empty($v['final_state'])) {
            $x0 = $this->formatVec($v['final_state']);
        } else {
            $x0 = "[{$ball0};0;{$beam0};0]";
        }

        $script = $this->ballbeamScript($r, $duration, $x0);

        return $this->runSimulation($request, $script, 'simulate_ballbeam', $v, function (array $raw) {
            return [
                't'            => $raw['t'],
                'ball_position' => $raw['y_col1'],
                'beam_angle'   => $raw['y_col2'],
                'final_state'  => $raw['final_state'],
            ];
        });
    }

    // -------------------------------------------------------------------------

    private function runSimulation(
        Request $request,
        string $script,
        string $type,
        array $params,
        callable $reshape,
    ): JsonResponse {
        $ip = $request->ip();
        $status = 'success';
        $error = null;
        $result = null;

        try {
            $sessionId = $this->bridge->createSession();

            try {
                $raw = $this->executeScript($sessionId, $script);
                $result = $reshape($raw);
            } finally {
                $this->bridge->destroySession($sessionId);
            }

            $slowdown = (int) env('SIMULATION_SLOWDOWN_MS', 0);
            if ($slowdown > 0) {
                usleep($slowdown * 1000);
            }
        } catch (RuntimeException $e) {
            $status = 'error';
            $error = $e->getMessage();
        }

        $geo = $this->geo->lookup($ip);

        DB::table('request_logs')->insert([
            'session_id' => null,
            'type'       => $type,
            'command'    => null,
            'params'     => json_encode($params),
            'status'     => $status,
            'error'      => $error,
            'ip'         => $ip,
            'city'       => $geo['city'],
            'country'    => $geo['country'],
            'created_at' => now(),
        ]);

        if ($status === 'error') {
            return response()->json(['error' => $error], 500);
        }

        return response()->json($result);
    }

    private function executeScript(string $sessionId, string $script): array
    {
        // Send each line separately so the bridge can track the prompt correctly
        $lines = array_filter(array_map('trim', explode("\n", $script)));
        foreach ($lines as $line) {
            $this->bridge->execute($sessionId, $line);
        }

        // Read back the serialised result
        $tJson     = $this->readVar($sessionId, '__t__');
        $y1Json    = $this->readVar($sessionId, '__y1__');
        $y2Json    = $this->readVar($sessionId, '__y2__');
        $fsJson    = $this->readVar($sessionId, '__fs__');

        return [
            't'           => json_decode($tJson, true),
            'y_col1'      => json_decode($y1Json, true),
            'y_col2'      => json_decode($y2Json, true),
            'final_state' => json_decode($fsJson, true),
        ];
    }

    private function readVar(string $sessionId, string $var): string
    {
        $res = $this->bridge->execute($sessionId, "fprintf('%s\n', jsonencode({$var}))");
        return trim($res['stdout']);
    }

    // -------------------------------------------------------------------------

    private function pendulumScript(float $r, float $duration, string $x0): string
    {
        return <<<OCT
        M = .5; m = 0.2; b = 0.1; I = 0.006; g = 9.8; l = 0.3;
        p = I*(M+m)+M*m*l^2;
        A = [0 1 0 0; 0 -(I+m*l^2)*b/p (m^2*g*l^2)/p 0; 0 0 0 1; 0 -(m*l*b)/p m*g*l*(M+m)/p 0];
        B = [0; (I+m*l^2)/p; 0; m*l/p];
        C = [1 0 0 0; 0 0 1 0];
        D = [0; 0];
        K = lqr(A,B,C'*C,1);
        Ac = (A-B*K);
        N = -inv(C(1,:)*inv(A-B*K)*B);
        sys = ss(Ac,B*N,C,D);
        t = (0:0.05:{$duration})';
        [y,t,x] = lsim(sys,{$r}*ones(size(t)),t,{$x0});
        __t__ = t;
        __y1__ = y(:,1);
        __y2__ = y(:,2);
        __fs__ = x(end,:)';
        OCT;
    }

    private function ballbeamScript(float $r, float $duration, string $x0): string
    {
        return <<<OCT
        m = 0.111; R = 0.015; g = -9.8; J = 9.99e-6;
        H = -m*g/(J/(R^2)+m);
        A = [0 1 0 0; 0 0 H 0; 0 0 0 1; 0 0 0 0];
        B = [0;0;0;1];
        C = [1 0 0 0];
        D = [0];
        K = place(A,B,[-2+2i,-2-2i,-20,-80]);
        N = -inv(C*inv(A-B*K)*B);
        sys = ss(A-B*K,B,C,D);
        t = (0:0.01:{$duration})';
        [y,t,x] = lsim(N*sys,{$r}*ones(size(t)),t,{$x0});
        __t__ = t;
        __y1__ = y(:,1);
        __y2__ = x(:,3);
        __fs__ = x(end,:)';
        OCT;
    }

    private function formatVec(array $vals): string
    {
        return '[' . implode(';', array_map('floatval', $vals)) . ']';
    }
}
