const turf = require('@turf/turf');
const { findPath, pathDistanceNm, FUEL_COST_PER_NM } = require('./pathfinder');
const { getPorts } = require('./fleet');
const { addAlert, ackAllByZone } = require('../alerts');

// id → { id, coordinates: [[lat,lon],...], createdAt }
const zones = new Map();

// shipId → Set<zoneId> for ships physically inside polygons
const shipZoneState = new Map();

// shipId → Set<zoneId> for ships whose direct path crosses polygons
const shipReroutingFor = new Map();

function addZone(zone)  { zones.set(zone.id, zone); }
function getZones()     { return Array.from(zones.values()); }

function mapShip(s) {
  return {
    id: s.id, name: s.name, lat: s.lat, lon: s.lon,
    speed: s.speed, heading: s.heading, dest: s.dest,
    fuel: s.fuel, cargo: s.cargo, status: s.status,
    eta: s.eta, waypoints: s.waypoints, weatherPenalty: s.weatherPenalty,
  };
}

function zonePolygon(zone) {
  const ring = zone.coordinates.map(c => [c[1], c[0]]);
  ring.push(ring[0]);
  return turf.polygon([ring]);
}

function normalStatusFor(ship) {
  if (ship.fuel === 0) return 'stranded';
  return ship.fuel < 900 ? 'low_fuel' : 'underway';
}

// BUG 1 FIX: clean separation between "inside zone" and "path crosses zone"
function checkGeofences(ships, io) {
  const zoneList = Array.from(zones.values());
  const ports    = getPorts();

  for (const ship of ships) {
    if (['arrived', 'stranded', 'insufficient_fuel'].includes(ship.status)) continue;

    const pt     = turf.point([ship.lon, ship.lat]);
    const prevIn = shipZoneState.get(ship.id) || new Set();
    const nowIn  = new Set();

    // 1. Inside polygon → in_zone (red)
    for (const zone of zoneList) {
      const poly = zonePolygon(zone);
      if (turf.booleanPointInPolygon(pt, poly)) {
        nowIn.add(zone.id);
        if (!prevIn.has(zone.id)) {
          const alert = addAlert(io, {
            type:     'geofence',
            shipId:   ship.id,
            shipName: ship.name,
            zoneId:   zone.id,
            message:  `${ship.name} entered restricted zone`,
          });
          io.emit('geofence_breach', alert);
          console.log(`[geofence] ${ship.name} breached zone ${zone.id}`);
        }
      }
    }
    shipZoneState.set(ship.id, nowIn);

    if (nowIn.size > 0) {
      ship.status = 'in_zone';
      continue;
    }

    // 2. Path crosses polygon (line intersects) → rerouting (amber)
    const port = ports[ship.dest];
    const reroutingFor = new Set();
    if (port && zoneList.length > 0) {
      const direct = turf.lineString([[ship.lon, ship.lat], [port.lon, port.lat]]);
      for (const zone of zoneList) {
        try {
          if (turf.booleanIntersects(direct, zonePolygon(zone))) {
            reroutingFor.add(zone.id);
          }
        } catch (_) {}
      }
    }
    shipReroutingFor.set(ship.id, reroutingFor);

    if (reroutingFor.size > 0) {
      if (ship.status !== 'rerouting') {
        ship.status   = 'rerouting';
        ship.waypoints = []; // force pathfinder to recompute around current zones
      }
      continue;
    }

    // 3. No relationship to any zone → restore normal
    if (['in_zone', 'rerouting'].includes(ship.status)) {
      ship.status   = normalStatusFor(ship);
      ship.waypoints = []; // recompute direct route
    } else if (ship.status === 'underway' && ship.fuel < 900) {
      ship.status = 'low_fuel';
    }
  }
}

// BUG 2 FIX: zone removal — reset affected ships, do NOT pathfind
function removeZoneAndReset(zoneId, ships, io) {
  if (!zones.has(zoneId)) return;
  zones.delete(zoneId);

  const resetIds = [];
  for (const ship of ships) {
    let touched = false;

    const inSet = shipZoneState.get(ship.id);
    if (inSet && inSet.has(zoneId)) {
      inSet.delete(zoneId);
      touched = true;
    }

    const rrSet = shipReroutingFor.get(ship.id);
    if (rrSet && rrSet.has(zoneId)) {
      rrSet.delete(zoneId);
      touched = true;
    }

    // Any ship in a zone-affected status — reset and let next tick re-evaluate
    if (touched || ['in_zone', 'rerouting', 'stranded', 'insufficient_fuel'].includes(ship.status)) {
      if (ship.status === 'stranded' && ship.fuel === 0) continue; // truly out of fuel
      ship.status    = normalStatusFor(ship);
      ship.waypoints = [];
      resetIds.push(ship.id);
    }
  }

  // BUG 6 FIX: auto-acknowledge any alerts associated with this zone
  ackAllByZone(io, zoneId);

  if (resetIds.length > 0) {
    io.emit('ship_update', ships.map(mapShip));
  }
  io.emit('zone_removed_alerts', { zoneId, resetShipIds: resetIds });
}

// Compute waypoints for ships flagged rerouting (used on zone_added)
function rerouteShips(ships, io) {
  const zoneList = Array.from(zones.values());
  const ports    = getPorts();

  for (const ship of ships) {
    if (['arrived', 'stranded', 'in_zone', 'insufficient_fuel'].includes(ship.status)) continue;

    const port = ports[ship.dest];
    if (!port) continue;

    const path = findPath([ship.lat, ship.lon], [port.lat, port.lon], zoneList);

    if (!path) {
      ship.status    = 'stranded';
      ship.waypoints = [];
      const alert = addAlert(io, {
        type: 'geofence', shipId: ship.id, shipName: ship.name,
        message: `${ship.name} has no navigable path — stranded`,
      });
      io.emit('geofence_breach', alert);
      continue;
    }

    const fuelNeeded = pathDistanceNm(path) * FUEL_COST_PER_NM;
    if (ship.fuel < fuelNeeded) {
      ship.status    = 'insufficient_fuel';
      ship.waypoints = [];
      const alert = addAlert(io, {
        type: 'geofence', shipId: ship.id, shipName: ship.name,
        message: `${ship.name} has insufficient fuel for rerouting`,
      });
      io.emit('geofence_breach', alert);
      continue;
    }

    ship.waypoints = path.slice(1);
    if (path.length > 2 && ship.status !== 'rerouting') {
      ship.status = 'rerouting';
    }
  }
}

module.exports = {
  addZone, removeZoneAndReset, getZones,
  checkGeofences, rerouteShips,
};
