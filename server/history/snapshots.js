// Circular snapshot buffer — records full fleet state every 30s, keeps last 120 (1 hour).
const SNAPSHOT_INTERVAL_MS = 30000;
const MAX_SNAPSHOTS        = 120;

const snapshots = []; // [{ timestamp, ships, alerts }]

function addSnapshot(ships, alerts) {
  snapshots.push({
    timestamp: new Date().toISOString(),
    ships: ships.map(s => ({
      id:      s.id,
      name:    s.name,
      lat:     s.lat,
      lon:     s.lon,
      heading: s.heading,
      speed:   s.speed,
      status:  s.status,
      fuel:    s.fuel,
      dest:    s.dest,
    })),
    alerts: alerts.slice(0, 50).map(a => ({
      id:       a.id,
      type:     a.type,
      shipId:   a.shipId,
      shipName: a.shipName,
      message:  a.message,
      severity: a.severity,
    })),
  });
  while (snapshots.length > MAX_SNAPSHOTS) snapshots.shift();
}

function getSnapshots() { return snapshots; }

function startSnapshotLoop(getShips, getAlerts) {
  // First snapshot immediately so playback is non-empty
  addSnapshot(getShips(), getAlerts());
  setInterval(() => addSnapshot(getShips(), getAlerts()), SNAPSHOT_INTERVAL_MS);
  console.log(`[snapshots] started — every ${SNAPSHOT_INTERVAL_MS / 1000}s, retain ${MAX_SNAPSHOTS}`);
}

module.exports = { addSnapshot, getSnapshots, startSnapshotLoop };
