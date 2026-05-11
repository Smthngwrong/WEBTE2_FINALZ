# API Contract

This document defines the full interface between the frontend and backend.
The other developer should use this as the reference for all API calls.

## Base URL

All requests go to `http://localhost:8080/api/...` in development.

---

## Authentication

Every request must include the API token as a Bearer token:

```
Authorization: Bearer webte2-dev-secret
```

The frontend stores this token in `localStorage` on first load (hardcoded for this project).

---

## User Identity (anonymous)

On first visit, the frontend generates a UUID and stores it in `localStorage`.
Send it on any request that involves tracking (animation plays):

```
X-User-Token: <uuid>
```

The backend registers the token in `user_tokens` if it does not exist yet.

---

## Endpoints

### Health check

```
GET /api/ping
```

Response `200`:
```json
{ "ok": true }
```

---

### CAS Terminal — Octave session

**Create session**
```
POST /api/session/create
```

Response `200`:
```json
{ "sessionId": "uuid" }
```

---

**Execute command**
```
POST /api/execute
```

Request body:
```json
{ "sessionId": "uuid", "command": "a = 1 + 1" }
```

Response `200`:
```json
{ "stdout": "a = 2", "stderr": "", "success": true }
```

---

**Destroy session**
```
DELETE /api/session/{id}
```

Response `200`:
```json
{ "ok": true }
```

---

### Simulations

**Inverted pendulum**
```
POST /api/simulate/pendulum
```

Request body:
```json
{ "angle0": 0.1, "velocity0": 0, "duration": 10 }
```

Response `200`:
```json
{
  "t": [0.0, 0.01, ...],
  "angle": [0.1, 0.102, ...],
  "position": [0.0, 0.001, ...],
  "final_state": [0.105, 0.03, 0.002, 0.01]
}
```

`final_state` can be sent back as initial conditions on a "Continue" run.

---

**Ball on beam**
```
POST /api/simulate/ballbeam
```

Request body:
```json
{ "ball_position0": 0.1, "beam_angle0": 0, "duration": 10 }
```

Response `200`:
```json
{
  "t": [0.0, 0.01, ...],
  "ball_position": [0.1, 0.099, ...],
  "beam_angle": [0.0, 0.001, ...],
  "final_state": [0.095, -0.01, 0.002, 0.0]
}
```

---

### Statistics

```
GET /api/stats
```

Headers required: `X-User-Token: <uuid>`

Response `200`:
```json
{
  "executions": {
    "total": 42,
    "by_country": { "SK": 10, "CZ": 5 }
  },
  "animations": {
    "pendulum": { "total": 20, "by_country": { "SK": 8, "CZ": 4 } },
    "ballbeam":  { "total": 15, "by_country": { "SK": 6, "CZ": 3 } }
  }
}
```

---

### PDF Documentation

```
GET /api/docs/pdf
```

Response: PDF file download (`Content-Type: application/pdf`).

---

## Error Format

All errors return the same shape:

```json
{ "error": "Human readable message" }
```

| Status | Meaning |
|---|---|
| `400` | Bad request / missing parameters |
| `401` | Missing or invalid API token |
| `404` | Resource not found (e.g. session expired) |
| `500` | Server error |

---

## Frontend Routes

| Path | Page |
|---|---|
| `/` | Home / landing |
| `/terminal` | CAS Octave terminal |
| `/simulate/pendulum` | Pendulum animation + graph |
| `/simulate/ballbeam` | Ball-beam animation + graph |
| `/stats` | Statistics |
| `/docs` | API documentation (Swagger UI) |
