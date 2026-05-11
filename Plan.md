# Execution Plan — WEBTE2 Final Project

**Stack:** Laravel 11 (PHP 8.2) · React 19 / Vite · Node.js 20 Express (Octave bridge) · MySQL 8 · Docker Compose  
**Animations:** Canvas 2D · **Graphs:** Plotly.js · **PDF:** Puppeteer · **Geo:** ip-api.com  
**Deadline:** 21 May 2026, 23:55 MS Teams + school server deployment

---

## Scoring Table

| Category | Points |
|---|---|
| Bilingual (SK/EN, stays on current route) | 2 |
| Backend API + API key auth | 12 |
| Frontend: animations, synced graphs, CAS terminal, slowdown, responsive | 12 |
| Request logs + CSV export | 5 |
| Dynamic PDF (OpenAPI docs, header + page X/Y footer) | 5 |
| Animation statistics (geo, 10-min cooldown, cookie UUID) | 5 |
| Docker package | 7 |
| VCS usage — min 3 meaningful commits per person | 2 |
| App finalization (layout, UX, DB design, submission completeness) | 5 |
| Demo video (every feature must be shown) | 5 |
| **Total** | **60** |

---

## Repository Structure

```
FINALZ/
├── backend/            # Laravel 11 — REST API
├── frontend/           # React 19 + Vite — SPA
├── octave-bridge/      # Node.js Express — manages persistent Octave child processes
├── docker/             # Per-service Dockerfiles
├── docker-compose.yml
├── init.sql            # MySQL schema + seed data
├── .env.example        # All config keys with placeholder values — COMMITTED
├── .env                # Actual secrets — NEVER COMMITTED (.gitignore)
├── kyvadlo.txt         # Reference Octave script: inverted pendulum
├── gulicka.txt         # Reference Octave script: ball on beam
└── Plan.md
```

---

## Technical Requirements

### 1 — Version Control
- Each member: **≥ 3 meaningful commits** in shared repo
- Feature branches → PR → merge to `dev` → merge to `main` for releases

### 2 — Bilingual UI (SK + EN)
- `react-i18next` with two locale JSON files
- Language toggle stored in `localStorage`, **stays on current route** (no redirect to home)

### 3 — Fully Responsive
- Mobile / tablet / desktop
- All canvas graphics and graphs must scale
- Chrome + Firefox optimized

### 4 — REST API + Octave + Slowdown
- Full REST API wrapping GNU Octave
- If computation is too fast, a configurable delay is applied server-side
- `SIMULATION_SLOWDOWN_MS` in `.env`

### 5 — API Key Auth
- All `/api/*` routes require `Authorization: Bearer <token>`
- `API_TOKEN` in `.env`, compared with `hash_equals()` (timing-safe)
- `401` JSON response if missing or invalid

### 6 — CAS Terminal (persistent sessions)
- CodeMirror 6 textarea with Octave syntax highlighting
- Submit button + output panel (green stdout / red stderr)
- Session persistence: `a=1+1` then `a+2` works across requests
- Solved by Octave bridge keeping one `octave --no-gui` process alive per session

### 7 — Two Animations + Synced Graphs
**Inverted Pendulum** (kyvadlo.txt):
- User params: `r`, `initPozicia`, `initUhol`
- Returns: `t[]`, `position[]`, `angle[]`, `final_state[]`
- Canvas: cart on rail, rigid rod + bob

**Ball on Beam** (gulicka.txt):
- User params: `r`, `initRychlost`, `initZrychlenie`
- Returns: `t[]`, `position[]`, `beam_angle[]`, `final_state[]`
- Canvas: pivoted beam, ball rolling on it

Both: "Run" plays full time-series via `requestAnimationFrame`, "Continue" uses `final_state` as new initial conditions. Plotly.js graph advances in lockstep with canvas frame index.

### 8 — Request Logging
Every `/api/execute` and `/api/simulate/*` call logged: datetime, session, command/params, status, error, IP.

### 9 — CSV Export
`GET /api/logs/export` — full `request_logs` table as downloadable `.csv`

### 10 — OpenAPI Docs + Dynamic PDF
- All endpoints in `openapi.yaml`
- `/docs` page embeds Swagger UI
- `GET /api/docs/pdf` — Puppeteer renders Swagger UI, exports PDF with title header + "5/8" style footer

### 11 — Animation Statistics
- Per-animation play count + detail table (timestamp, city, country)
- Users identified by UUID cookie (set on first visit)
- Same user re-counts only after **10-minute cooldown** (`STATS_COOLDOWN_MINUTES` in `.env`)
- Geolocation via `ip-api.com` (from user's real IP forwarded by Nginx)

### 12 — Docker
```
services:
  db        MySQL 8
  backend   PHP 8.2 + Laravel (depends on db)
  bridge    Node.js 20 + Octave installed — INTERNAL ONLY, not exposed
  frontend  Nginx: serves React build + reverse-proxies /api/* to backend
```

### 13 — Demo Video
Every feature must appear in the video or it is considered unimplemented.

---

## Key Technical Risks

| Risk | Mitigation |
|---|---|
| Octave prompt detection in bridge | Detect `>> ` after each command to know output is complete |
| Canvas animation timing | `requestAnimationFrame` at 60fps must play at real-time speed; control with a frame timer based on `t[]` intervals |
| Puppeteer in Docker | Use `puppeteer-core` + `chromium` package; add `--no-sandbox` flag for container environment |
| Geolocation gets container IP | Nginx must forward `X-Forwarded-For`; Laravel reads it via `request()->ip()` with trusted proxy config |

---

## Database Schema

```sql
-- Every CAS execute and simulate call
CREATE TABLE request_logs (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(64),
  type       ENUM('execute','simulate_pendulum','simulate_ballbeam'),
  command    TEXT,
  params     JSON,
  status     ENUM('success','error'),
  error      TEXT,
  ip         VARCHAR(45),
  city       VARCHAR(100),
  country    VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Animation play events
CREATE TABLE animation_stats (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  animation  ENUM('pendulum','ballbeam'),
  user_token VARCHAR(64),
  ip         VARCHAR(45),
  city       VARCHAR(100),
  country    VARCHAR(100),
  used_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Anonymous browser identities
CREATE TABLE user_tokens (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  token      VARCHAR(64) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/session` | Create Octave session, returns `session_id` |
| DELETE | `/api/session/:id` | Destroy Octave session |
| POST | `/api/execute` | Run Octave command in session |
| POST | `/api/simulate/pendulum` | Run pendulum simulation, return time-series |
| POST | `/api/simulate/ballbeam` | Run ball-beam simulation, return time-series |
| GET | `/api/logs` | Paginated request log list |
| GET | `/api/logs/export` | Download full logs as CSV |
| POST | `/api/stats/record` | Record animation play event |
| GET | `/api/stats` | Get animation usage statistics |
| GET | `/api/openapi.yaml` | Serve OpenAPI spec |
| GET | `/api/docs/pdf` | Generate and return PDF of API docs |

---

## Frontend Routes

| Route | Page |
|---|---|
| `/` | Home / landing |
| `/cas` | CAS terminal (CodeMirror + persistent session) |
| `/pendulum` | Inverted pendulum simulation |
| `/ballbeam` | Ball on beam simulation |
| `/stats` | Animation usage statistics |
| `/docs` | API documentation (Swagger UI + PDF download) |

---

## 2-Person Execution Plan

### Member A — Backend + Infrastructure

| Phase | Tasks |
|---|---|
| **0 — Scaffolding** | Init GitHub repo; scaffold Laravel; scaffold octave-bridge; write `.env.example`; write `init.sql` |
| **1 — Octave Bridge** | Spawn/kill `octave --no-gui` processes; stdin/stdout with prompt detection; session TTL; `BRIDGE_SECRET` auth |
| **2 — Laravel Core** | API key middleware; MySQL migrations; config values from `.env` |
| **3 — CAS Endpoints** | `POST /api/session`, `DELETE /api/session/:id`, `POST /api/execute` (slowdown + logging) |
| **4 — Simulate Endpoints** | Parameterize `kyvadlo.txt` + `gulicka.txt`; send to bridge; return time-series JSON |
| **5 — Logs + Stats** | `GET /api/logs`, `GET /api/logs/export` (CSV); `POST /api/stats/record` (geo + cooldown); `GET /api/stats` |
| **6 — Docs + PDF** | Write `openapi.yaml`; `GET /api/docs/pdf` Puppeteer with header/footer |
| **7 — Docker** | Dockerfiles for all 4 services; `docker-compose.yml`; Nginx config; internal network for bridge |

### Member B — Frontend + UX

| Phase | Tasks |
|---|---|
| **0 — Scaffolding** | Scaffold React/Vite; install dependencies; base layout; routing; i18n setup (SK/EN locale files) |
| **1 — Auth + Cookie** | API key input → `localStorage`; UUID cookie generation on first visit; `axios` instance with Bearer header |
| **2 — CAS Page** | CodeMirror 6 with Octave highlighting; session lifecycle; output panel |
| **3 — Animation Pages** | Parameter forms; "Run"/"Continue" logic; `requestAnimationFrame` loop with timing control |
| **4 — Canvas Renderers** | Pendulum canvas (cart, rod, bob); Ball-beam canvas (beam, ball) |
| **5 — Plotly Graphs** | Dual-trace charts per animation; `Plotly.react()` per frame; synced with canvas frame index |
| **6 — Stats + Docs Pages** | Stats page (cards + detail table); Docs page (Swagger UI embed + PDF download button) |
| **7 — Finalization** | Full responsive audit; Chrome+Firefox test; all strings in i18n; design polish |

### Shared Final Tasks

| Task | Owner |
|---|---|
| Record demo video | Both |
| Technical documentation | Both |
| ZIP + SQL + git link for submission | A |
| Deploy to `node11.webte.fei.stuba.sk` | A |
| MS Teams submission | B |

---

## Git Cooperation Strategy

### What IS committed
- All source code (`backend/`, `frontend/`, `octave-bridge/`)
- `docker-compose.yml` and all `docker/Dockerfile.*`
- `init.sql`
- `.env.example` — template with all keys, **no real values** (placeholder like `your-secret-here`)
- `openapi.yaml`
- `Plan.md`, `CLAUDE.md`, reference `.txt` files

### What is NOT committed (in `.gitignore`)
- `.env` — real secrets, DB passwords, API tokens
- `backend/vendor/` — Composer packages (restored via `composer install`)
- `frontend/node_modules/`, `octave-bridge/node_modules/`
- `frontend/dist/` — built output (built inside Docker)
- `backend/storage/logs/`

### Branch Strategy
```
main        production-ready, tagged releases only
dev         integration branch — PRs merge here first
feature/*   short-lived feature branches, one per task
```
Workflow: create `feature/my-task` → commit work → open PR to `dev` → other person reviews → merge.

### How the other person gets your work
```bash
git pull origin dev          # get latest
git checkout -b feature/xyz  # new branch
# ... do work ...
git add specific-files
git commit -m "feat: description"
git push origin feature/xyz
# open PR on GitHub
```

### Running locally after a fresh clone
```bash
cp .env.example .env
# fill in .env with real values (share privately, e.g. via WhatsApp/Teams)
docker compose up --build
```
The entire app starts from one command. No local PHP or Node needed.
