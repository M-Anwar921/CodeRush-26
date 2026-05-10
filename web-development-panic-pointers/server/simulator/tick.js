const turf = require('@turf/turf');
const { getShips, getPorts } = require('./fleet');
const { checkGeofences, getZones } = require('./geofence');
const { checkProximity } = require('./proximity');
const { applyWeatherToShips } = require('./weather');
const { findPath, pathDistanceNm, FUEL_COST_PER_NM } = require('./pathfinder');

const KNOTS_TO_DEG_PER_SEC = 1 / 3600;
const FUEL_BURN_PER_KNOT_PER_SEC = 0.05;

let io = null;

function headingToVector(headingDeg) {
  const rad = (headingDeg * Math.PI) / 180;
  return { dLat: Math.cos(rad), dLon: Math.sin(rad) };
}

function calcEta(ship) {
  const port = getPorts()[ship.dest];
  if (!port || ship.speed <= 0) return null;
  const distNm = turf.distance(
    turf.point([ship.lon, ship.lat]),
    turf.point([port.lon, port.lat]),
    { units: 'nauticalmiles' }
  );
  const hours = distNm / ship.speed;
  return new Date(Date.now() + hours * 3600 * 1000).toISOString();
}

// BUG 3 FIX: every moving ship must have a waypoint route via pathfinder
function ensureRoute(ship) {
  if (['arrived', 'stranded', 'in_zone', 'insufficient_fuel'].includes(ship.status)) return;
  if (ship.waypoints && ship.waypoints.length > 0) return;

  const port = getPorts()[ship.dest];
  if (!port) return;

  const path = findPath([ship.lat, ship.lon], [port.lat, port.lon], getZones());

  if (!path) {
    ship.status    = 'stranded';
    ship.waypoints = [];
    return;
  }

  const fuelNeeded = pathDistanceNm(path) * FUEL_COST_PER_NM;
  if (ship.fuel < fuelNeeded) {
    ship.status    = 'insufficient_fuel';
    ship.waypoints = [];
    return;
  }

  ship.waypoints = path.slice(1); // first node is current position
}

function tickShip(ship) {
  if (['arrived', 'stranded', 'insufficient_fuel'].includes(ship.status)) return;

  // BUG 3 FIX: always ensure ship has a navigable route before moving
  ensureRoute(ship);

  // BUG 3 FIX: advance ONLY along waypoints, never on raw heading
  if (!ship.waypoints || ship.waypoints.length === 0) return;

  const next   = ship.waypoints[0];
  const from   = turf.point([ship.lon, ship.lat]);
  const to     = turf.point([next[1], next[0]]);
  const distNm = turf.distance(from, to, { units: 'nauticalmiles' });

  if (distNm < 0.5) {
    ship.waypoints.shift();
    if (ship.waypoints.length > 0) {
      const nn = ship.waypoints[0];
      ship.heading = (turf.bearing(from, turf.point([nn[1], nn[0]])) + 360) % 360;
    }
  } else {
    ship.heading = (turf.bearing(from, to) + 360) % 360;
  }

  const { dLat, dLon } = headingToVector(ship.heading);
  const stepDeg = ship.speed * KNOTS_TO_DEG_PER_SEC;
  ship.lat += dLat * stepDeg;
  ship.lon += dLon * stepDeg;

  const burnRate = ship.weatherPenalty
    ? FUEL_BURN_PER_KNOT_PER_SEC * ship.speed * 1.3
    : FUEL_BURN_PER_KNOT_PER_SEC * ship.speed;
  ship.fuel = Math.max(0, ship.fuel - burnRate);

  if (ship.fuel === 0) {
    ship.status = 'stranded';
  } else if (ship.fuel < 900 && ship.status === 'underway') {
    ship.status = 'low_fuel';
  }

  const port = getPorts()[ship.dest];
  if (port) {
    const distToPort = turf.distance(
      turf.point([ship.lon, ship.lat]),
      turf.point([port.lon, port.lat]),
      { units: 'nauticalmiles' }
    );
    if (distToPort < 5) {
      ship.status = 'arrived';
      ship.speed  = 0;
    }
  }

  ship.eta = calcEta(ship);
}

function startTick(socketIo) {
  io = socketIo;
  setInterval(() => {
    const ships = getShips();
    applyWeatherToShips(io);   // STEP 11: stamp ship.weatherPenalty + emit transition alerts
    checkGeofences(ships, io); // status first, so tick uses fresh status
    ships.forEach(tickShip);
    checkProximity(ships, io);

    io.emit('ship_update', ships.map(s => ({
      id: s.id, name: s.name,
      lat: s.lat, lon: s.lon,
      speed: s.speed, heading: s.heading,
      dest: s.dest, fuel: s.fuel,
      cargo: s.cargo, status: s.status,
      eta: s.eta, waypoints: s.waypoints,
      weatherPenalty: s.weatherPenalty,
    })));
  }, 1000);

  console.log('[tick] Ship simulator started — 1 Hz');
}

module.exports = { startTick };
