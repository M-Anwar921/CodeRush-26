const turf = require('@turf/turf');
const { addAlert } = require('../alerts');

const THRESHOLD_KM = 2;

// "shipA|shipB" (sorted) → bool — true while pair currently within threshold
const warned = new Map();

function pairKey(a, b) {
  return [a, b].sort().join('|');
}

function checkProximity(ships, io) {
  const seen      = new Set();
  const livePairs = [];

  for (let i = 0; i < ships.length; i++) {
    for (let j = i + 1; j < ships.length; j++) {
      const a = ships[i];
      const b = ships[j];

      if (['arrived', 'stranded'].includes(a.status)) continue;
      if (['arrived', 'stranded'].includes(b.status)) continue;

      const distKm = turf.distance(
        turf.point([a.lon, a.lat]),
        turf.point([b.lon, b.lat]),
        { units: 'kilometers' }
      );

      if (distKm <= THRESHOLD_KM) {
        const key = pairKey(a.id, b.id);
        seen.add(key);
        livePairs.push({
          a:  { id: a.id, lat: a.lat, lon: a.lon },
          b:  { id: b.id, lat: b.lat, lon: b.lon },
          km: Number(distKm.toFixed(2)),
        });

        if (!warned.has(key)) {
          warned.set(key, true);
          const alert = addAlert(io, {
            type:          'proximity',
            shipId:        a.id,
            shipName:      a.name,
            otherShipId:   b.id,
            otherShipName: b.name,
            distanceKm:    Number(distKm.toFixed(2)),
            message:       `${a.name} and ${b.name} within ${distKm.toFixed(2)} km`,
          });
          io.emit('proximity_warning', alert);
          console.log(`[proximity] ${a.name} ⇄ ${b.name} ${distKm.toFixed(2)} km`);
        }
      }
    }
  }

  // Drop pairs that are no longer close
  for (const key of warned.keys()) {
    if (!seen.has(key)) warned.delete(key);
  }

  io.emit('proximity_pairs', livePairs);
}

module.exports = { checkProximity, THRESHOLD_KM };
