[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/ncRwI7td)

# Maritime Crisis Command System

Real-time fleet tracking for 15 cargo ships navigating the Strait of Hormuz during a geopolitical crisis. Two roles share a live map: **Command** sees the whole fleet and draws restricted zones; **Captain** controls a single ship and reports distress.

## Features

- 1 Hz simulator with A* pathfinding through navigable waypoints (no land crossings)
- Restricted zone drawing (geofence breach + path-cross detection)
- Proximity warnings (2 km between any two ships → live yellow line + alert)
- AI-parsed distress messages (Groq + llama-3.3-70b → severity / issue / injured / damage / action)
- Unified alert queue with acknowledge + history
- 30 s circular snapshot buffer (1 hour of replay) with timeline scrubber
- Command ⇄ Captain directives with accept / escalate flow
- Live weather grid (Open-Meteo) — adverse cells trigger +30% fuel burn and a map overlay
- Audible alarm on critical alerts (Web Audio API)
- Fleet summary bar (counts of normal / warn / danger ships)

## Tech stack

- **Frontend**: React 19 + Vite + Tailwind + Leaflet + React-Leaflet + leaflet-geoman + Socket.io-client
- **Backend**: Node.js + Express + Socket.io + Turf.js + Groq SDK
- **Map**: CartoDB Dark Matter
- **AI**: Groq API — `llama-3.3-70b-versatile`

## Setup

### Prerequisites

- Node.js 18+
- A Groq API key — [console.groq.com](https://console.groq.com)

### Environment

```bash
cp .env.example .env
# fill in GROQ_API_KEY
```

Variables used:

| Variable          | Used by  | Default                  |
|-------------------|----------|--------------------------|
| `GROQ_API_KEY`    | server   | —  (required for AI)     |
| `PORT`            | server   | `3001`                   |
| `VITE_SERVER_URL` | client   | `http://localhost:3001`  |

### Local development

```bash
# Terminal 1 — backend
cd server && npm install && npm run dev

# Terminal 2 — frontend
cd client && npm install && npm run dev
```

Open http://localhost:5173.

### Docker

```bash
cp .env.example .env   # set GROQ_API_KEY
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend:  http://localhost:3001

## Routes

| Path                  | View                                |
|-----------------------|-------------------------------------|
| `/`                   | Login (pick role + ship)            |
| `/command`            | Fleet overview, zones, alerts, playback |
| `/captain/:shipId`    | Single-ship view + distress + directives |

## Socket events

| Event                 | Direction              | Purpose                              |
|-----------------------|------------------------|--------------------------------------|
| `ship_update`         | server → all           | Tick broadcast                       |
| `zone_added`          | client → server → all  | New restricted polygon               |
| `zone_removed`        | client → server → all  | Remove polygon, reset ships          |
| `alert`               | server → all           | Unified alert (geofence/proximity/distress) |
| `alert_ack`           | client ⇄ server        | Acknowledge an alert                 |
| `alerts_sync`         | server → client        | Full queue on connect                |
| `geofence_breach`     | server → all           | Specific geofence event              |
| `proximity_warning`   | server → all           | Two ships within 2 km                |
| `proximity_pairs`     | server → all           | Live close-pair list (for map lines) |
| `distress_message`    | client → server        | Captain free-form text               |
| `distress_result`     | server → all           | Parsed distress JSON                 |
| `directive_sent`      | command → all          | Order to captain                     |
| `directive_response`  | captain → all          | Accept / escalate                    |

## REST endpoints

- `GET /api/health`
- `GET /api/fleet`
- `GET /api/alerts`
- `GET /api/snapshots`
- `GET /api/weather`

## Deployment

Backend → Railway (or Render):

1. New service → connect this repo, root `server/`
2. Build: `npm install`
3. Start: `npm start`
4. Env vars: `GROQ_API_KEY`, `PORT` (Railway provides)

Frontend → Vercel:

1. Import repo, root `client/`
2. Framework: Vite
3. Build: `npm run build`, Output: `dist`
4. Env var: `VITE_SERVER_URL` = the Railway URL

## Live URLs

- Frontend: _add Vercel URL after deploy_
- Backend:  _add Railway URL after deploy_
