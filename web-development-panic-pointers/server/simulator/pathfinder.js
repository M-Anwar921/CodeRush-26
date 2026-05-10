const turf = require('@turf/turf');
const { getNavigablePolygon } = require('./fleet');

// Waypoint graph: navigable polygon vertices + port positions [lat, lon]
const BASE_NODES = [
  [29.80,48.60],[29.50,50.00],[28.80,50.80],[27.80,52.00],
  [26.70,53.50],[26.30,55.00],[26.65,56.10],[26.50,56.40],
  [26.00,56.80],[25.50,57.50],[25.50,58.50],[25.00,60.00],
  [22.00,60.00],[22.50,60.00],[23.80,58.80],[24.50,57.20],
  [25.20,56.50],[26.45,56.45],[26.30,55.90],[26.00,55.50],
  [25.30,54.50],[24.80,53.00],[25.30,52.00],[26.40,51.50],
  [26.50,50.30],[27.50,49.80],[28.50,49.00],[29.50,48.30],
  // Port nodes
  [29.48,48.34],[28.83,50.73],[26.56,50.30],[26.50,50.55],
  [25.46,51.95],[25.22,54.18],[25.50,54.75],[26.62,56.11],
  [24.72,57.02],[23.92,58.58],
];

// Fuel cost: 0.05 L/kn/s × 3600 s/h ÷ 60 NM/deg ≈ 3 fuel units per NM
const FUEL_COST_PER_NM = 3;

// Cache the navigable polygon turf object
let _navPoly = null;
function navPoly() {
  if (_navPoly) return _navPoly;
  const raw  = getNavigablePolygon();
  const ring = raw.map(c => [c[1], c[0]]); // [lon, lat]
  if (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1]) {
    ring.push(ring[0]);
  }
  _navPoly = turf.polygon([ring]);
  return _navPoly;
}

// BUG 3 FIX: reject edges whose interior passes through land
function edgeInWater(a, b) {
  const poly = navPoly();
  for (const t of [0.25, 0.5, 0.75]) {
    const pt = turf.point([
      a[1] + t * (b[1] - a[1]),
      a[0] + t * (b[0] - a[0]),
    ]);
    if (!turf.booleanPointInPolygon(pt, poly)) return false;
  }
  return true;
}

function edgeClearsZones(a, b, zones) {
  if (!zones.length) return true;
  const line = turf.lineString([[a[1], a[0]], [b[1], b[0]]]);
  for (const zone of zones) {
    const ring = zone.coordinates.map(c => [c[1], c[0]]);
    ring.push(ring[0]);
    try {
      if (turf.booleanIntersects(line, turf.polygon([ring]))) return false;
    } catch (_) {}
  }
  return true;
}

function edgeValid(a, b, zones) {
  return edgeInWater(a, b) && edgeClearsZones(a, b, zones);
}

function dist(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

// Returns [[lat,lon], ...] or null. zones is passed in to avoid circular import.
function findPath(fromLatLon, toLatLon, zones) {
  if (edgeValid(fromLatLon, toLatLon, zones)) {
    return [fromLatLon, toLatLon];
  }

  const nodes = [...BASE_NODES, fromLatLon, toLatLon];
  const START = nodes.length - 2;
  const END   = nodes.length - 1;
  const n     = nodes.length;

  const open     = new Set([START]);
  const cameFrom = new Array(n).fill(-1);
  const g        = new Array(n).fill(Infinity);
  const f        = new Array(n).fill(Infinity);
  g[START] = 0;
  f[START] = dist(nodes[START], nodes[END]);

  while (open.size > 0) {
    let current = -1, bestF = Infinity;
    for (const i of open) { if (f[i] < bestF) { bestF = f[i]; current = i; } }

    if (current === END) {
      const path = [];
      for (let c = END; c !== -1; c = cameFrom[c]) path.unshift(nodes[c]);
      return path;
    }

    open.delete(current);

    for (let i = 0; i < n; i++) {
      if (i === current) continue;
      if (!edgeValid(nodes[current], nodes[i], zones)) continue;
      const tentG = g[current] + dist(nodes[current], nodes[i]);
      if (tentG < g[i]) {
        cameFrom[i] = current;
        g[i]        = tentG;
        f[i]        = tentG + dist(nodes[i], nodes[END]);
        open.add(i);
      }
    }
  }

  return null;
}

function pathDistanceNm(path) {
  let total = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const a = turf.point([path[i][1],   path[i][0]]);
    const b = turf.point([path[i+1][1], path[i+1][0]]);
    total += turf.distance(a, b, { units: 'nauticalmiles' });
  }
  return total;
}

module.exports = { findPath, pathDistanceNm, FUEL_COST_PER_NM };
