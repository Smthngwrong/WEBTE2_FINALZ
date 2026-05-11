# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WEBTE2 university final assignment. A full-stack web app that exposes two physics simulations (inverted pendulum, ball-on-beam) via a REST API backed by GNU Octave. Users can run arbitrary Octave commands through a browser terminal with persistent sessions, view synchronized 2D animations + live graphs, and download auto-generated API documentation as PDF.

## Repository Structure

```
backend/          # Laravel 11 (PHP 8.2) — REST API
frontend/         # React 19 + Vite — SPA
octave-bridge/    # Node.js Express daemon — manages persistent Octave child processes
docker/           # Per-service Dockerfiles
docker-compose.yml
init.sql          # MySQL schema + seed
.env.example
Plan.md           # Full phase-by-phase execution plan
```

## Development Commands

### Full stack (Docker)
```bash
docker compose up --build       # Start all services
docker compose down -v          # Tear down including volumes
```

### Backend (Laravel)
```bash
cd backend
composer install
cp ../.env.example .env && php artisan key:generate
php artisan migrate
php artisan serve                # Dev server on :8000

php artisan test                          # All tests
php artisan test --filter TestClassName   # Single test class
php artisan test --filter test_method     # Single test method
./vendor/bin/pint                         # Code style (Laravel Pint)
```

### Frontend (React/Vite)
```bash
cd frontend
npm install
npm run dev       # Dev server on :5173
npm run build
npm run preview
npm run lint      # ESLint
```

### Octave Bridge (Node.js)
```bash
cd octave-bridge
npm install
npm run dev       # nodemon watch
npm start         # Production
npm test          # Jest
```

## Architecture

### Request Flow
```
Browser → Nginx (frontend container)
            ├── /api/* → backend (Laravel, :8000)
            │               └── /bridge/* → octave-bridge (:3001, internal network only)
            └── /* → React static build
```

Nginx reverse-proxies `/api/*` to Laravel so there is a single origin — no CORS headers needed.

### Octave Session Persistence
The hardest architectural constraint: the CAS terminal must persist variables across requests (e.g. `a=1+1` then `a+2`). This is solved by the **octave-bridge** daemon:
- Each browser session maps to one long-lived `octave --no-gui` child process
- Laravel calls the bridge's `POST /session/:id/execute` with a raw Octave command string
- The bridge writes to the process stdin and reads stdout until the next prompt
- Sessions auto-expire after an idle TTL defined in the bridge's config
- The bridge is **not exposed publicly** — only reachable from `backend` on the internal Docker network, protected by a shared secret header

### API Authentication
All `/api/*` routes are protected by an API key middleware in Laravel. The key is set in `.env` as `API_TOKEN` and compared with `hash_equals()`. The frontend stores the key in `localStorage` and sends it as `Authorization: Bearer <token>`.

### Simulation Endpoints
`POST /api/simulate/pendulum` and `POST /api/simulate/ballbeam` send parameterized Octave scripts (derived from `kyvadlo.txt` and `gulicka.txt`) through the bridge and return full time-series arrays: `{ t[], position[], angle[], final_state[] }`. The `final_state` is sent back as initial conditions on a "Continue" run.

### Frontend State for Animations
Each animation page fetches the full time-series array on "Run", then plays it client-side frame by frame using `requestAnimationFrame`. The Canvas 2D renderer and Plotly.js graph share the same frame index — they advance together. No streaming or WebSocket is used; all simulation data arrives in one response.

### Logging & Statistics
Every `/api/execute` and `/api/simulate/*` call is written to `request_logs` (session, command, status, IP, city, country). Animation plays are recorded in `animation_stats` with a per-user 10-minute cooldown (configurable in `.env` as `STATS_COOLDOWN_MINUTES`). Users are identified anonymously by a UUID stored in a browser cookie.

### PDF Generation
`GET /api/docs/pdf` launches a headless Puppeteer instance inside the backend container, navigates to the frontend `/docs` route (Swagger UI), and exports it as PDF with header + paginated footer. This means the PDF always reflects the current `openapi.yaml`.

## Key Configuration (`.env`)
| Key | Purpose |
|---|---|
| `API_TOKEN` | Bearer token required on all `/api/*` requests |
| `OCTAVE_BRIDGE_URL` | Internal URL of the Node.js bridge (e.g. `http://bridge:3001`) |
| `BRIDGE_SECRET` | Shared secret between Laravel and the bridge |
| `SIMULATION_SLOWDOWN_MS` | Extra delay added server-side before returning simulation results |
| `STATS_COOLDOWN_MINUTES` | Minimum minutes between counting repeat animation plays from the same user |
| `FRONTEND_URL` | Used by Puppeteer to render the docs page for PDF export |

## Database Tables
- `request_logs` — every API call (command, params, status, geo, timestamp)
- `animation_stats` — animation play events with user token + geolocation
- `user_tokens` — anonymous UUID tokens issued to browsers via cookie
