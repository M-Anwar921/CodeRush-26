// STEP 11: Open-Meteo integration. Fetches current wind/precip across the
// operational bbox every 5 minutes; ships sitting on adverse cells get
// weatherPenalty=true (tick.js applies the +30% fuel burn).
const { getShips } = require('./fleet');
const { addAlert } = require('../alerts');

// Per-ship cooldown so a ship oscillating across a cell boundary doesn't spam.
const ALERT_COOLDOWN_MS = 10 * 60 * 1000;
const lastAlertAt = new Map(); // shipId → timestamp ms

const BBOX = { north: 30.5, south: 22.0, east: 60.0, west: 47.5 };
const STEP_DEG          = 2;
const FETCH_INTERVAL_MS = 5 * 60 * 1000;
const ADVERSE_WIND_KT   = 20;
const ADVERSE_PRECIP_MM = 0.5;

let grid = []; // [{ lat, lon, windKt, precipMm, adverse }]

function buildGridPoints() {
  const points = [];
  for (let lat = BBOX.south; lat <= BBOX.north + 1e-9; lat += STEP_DEG) {
    for (let lon = BBOX.west; lon <= BBOX.east + 1e-9; lon += STEP_DEG) {
      points.push({ lat: Number(lat.toFixed(2)), lon: Number(lon.toFixed(2)) });
    }
  }
  return points;
}

const POINTS = buildGridPoints();

async function fetchWeather() {
  if (typeof fetch !== 'function') {
    console.warn('[weather] global fetch not available — Node 18+ required');
    return;
  }

  const lats = POINTS.map(p => p.lat).join(',');
  const lons = POINTS.map(p => p.lon).join(',');
  const url  = `https://api.open-meteo.com/v1/forecast`
             + `?latitude=${lats}&longitude=${lons}`
             + `&current=wind_speed_10m,precipitation`
             + `&wind_speed_unit=kn`;

  try {
    const res  = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const arr  = Array.isArray(json) ? json : [json];

    grid = arr.map((d, i) => {
      const cur      = d.current || {};
      const windKt   = Number(cur.wind_speed_10m) || 0;
      const precipMm = Number(cur.precipitation)  || 0;
      return {
        lat:      POINTS[i].lat,
        lon:      POINTS[i].lon,
        windKt:   Number(windKt.toFixed(1)),
        precipMm: Number(precipMm.toFixed(2)),
        adverse:  windKt > ADVERSE_WIND_KT || precipMm > ADVERSE_PRECIP_MM,
      };
    });
    const adv = grid.filter(c => c.adverse).length;
    console.log(`[weather] ${grid.length} cells, ${adv} adverse`);
  } catch (err) {
    console.error('[weather] fetch failed:', err.message);
  }
}

function nearestCell(lat, lon) {
  if (!grid.length) return null;
  let best = grid[0];
  let bestD = Infinity;
  for (const c of grid) {
    const d = Math.hypot(c.lat - lat, c.lon - lon);
    if (d < bestD) { bestD = d; best = c; }
  }
  return best;
}

// io is optional — weather alerts only fire when a socket server is provided.
function applyWeatherToShips(io = null) {
  if (!grid.length) return;
  const now = Date.now();
  for (const ship of getShips()) {
    if (['arrived', 'stranded'].includes(ship.status)) {
      ship.weatherPenalty = false;
      continue;
    }
    const cell  = nearestCell(ship.lat, ship.lon);
    const prev  = !!ship.weatherPenalty;
    const next  = !!(cell && cell.adverse);
    ship.weatherPenalty = next;

    // Transition into adverse weather → fire one alert (rate-limited per ship).
    if (io && next && !prev) {
      const last = lastAlertAt.get(ship.id) || 0;
      if (now - last >= ALERT_COOLDOWN_MS) {
        lastAlertAt.set(ship.id, now);
        addAlert(io, {
          type:     'weather',
          shipId:   ship.id,
          shipName: ship.name,
          windKt:   cell.windKt,
          precipMm: cell.precipMm,
          message:  `${ship.name} entered adverse weather (${cell.windKt} kt`
                  + (cell.precipMm > 0 ? `, ${cell.precipMm} mm rain)` : ')'),
        });
      }
    }
  }
}

function getGrid() { return grid; }
function getStep() { return STEP_DEG; }

function startWeatherLoop(io) {
  fetchWeather().then(() => {
    applyWeatherToShips();
    io.emit('weather_grid', { cells: grid, step: STEP_DEG });
  });
  setInterval(async () => {
    await fetchWeather();
    applyWeatherToShips();
    io.emit('weather_grid', { cells: grid, step: STEP_DEG });
  }, FETCH_INTERVAL_MS);
  console.log(`[weather] started — every ${FETCH_INTERVAL_MS / 60000} min`);
}

module.exports = { startWeatherLoop, applyWeatherToShips, getGrid, getStep };
