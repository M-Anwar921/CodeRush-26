const { addZone, removeZoneAndReset, getZones, rerouteShips } = require('../simulator/geofence');
const { getShips, getShipById } = require('../simulator/fleet');
const { parseDistress } = require('../ai/distress');
const { addAlert, getAlerts, ackAlert, clearAlerts } = require('../alerts');
const { getGrid, getStep } = require('../simulator/weather');

function broadcastShips(io) {
  io.emit('ship_update', getShips().map(s => ({
    id: s.id, name: s.name, lat: s.lat, lon: s.lon,
    speed: s.speed, heading: s.heading, dest: s.dest,
    fuel: s.fuel, cargo: s.cargo, status: s.status,
    eta: s.eta, waypoints: s.waypoints, weatherPenalty: s.weatherPenalty,
  })));
}

const directives = new Map();

function registerHandlers(io, socket) {
  socket.emit('zones_sync',   getZones());
  socket.emit('alerts_sync',  getAlerts());
  socket.emit('weather_grid', { cells: getGrid(), step: getStep() });

  socket.on('request_zones',  () => socket.emit('zones_sync',  getZones()));
  socket.on('request_alerts', () => socket.emit('alerts_sync', getAlerts()));

  socket.on('zone_added', (zone) => {
    const enriched = { ...zone, createdAt: zone.createdAt || new Date().toISOString() };
    addZone(enriched);
    io.emit('zone_added', enriched);
    rerouteShips(getShips(), io);
    broadcastShips(io);
    console.log(`[zone] Added zone ${enriched.id} (${enriched.coordinates.length} pts)`);
  });

  socket.on('zone_removed', (zoneId) => {
    removeZoneAndReset(zoneId, getShips(), io);
    io.emit('zone_removed', zoneId);
    console.log(`[zone] Removed zone ${zoneId}`);
  });

  // STEP 9: AI distress message — Captain sends free-form text, server runs it
  // through Groq, returns structured analysis to all clients.
  socket.on('distress_message', async (payload) => {
    const { shipId, shipName, text, timestamp } = payload || {};
    if (!shipId || !text) return;

    const ship = getShipById(shipId);
    try {
      const analysis = await parseDistress(text);

      const alert = addAlert(io, {
        type:      'distress',
        shipId,
        shipName:  shipName || ship?.name || shipId,
        message:   `Distress from ${shipName || shipId}: ${analysis.issueType}`,
        severity:  analysis.severity,
        analysis,
        rawText:   text,
        sentAt:    timestamp || new Date().toISOString(),
      });

      io.emit('distress_result', {
        ...alert,
        ...analysis, // expose top-level fields for DistressPanel convenience
        shipId, shipName: alert.shipName,
      });

      // Visually flag the ship
      if (ship) {
        ship.status = 'distress';
        broadcastShips(io);
      }

      console.log(`[distress] ${shipId} → ${analysis.severity} / ${analysis.issueType}`);
    } catch (err) {
      console.error('[distress] failed:', err);
      io.emit('distress_error', { shipId, message: err.message || 'Distress parse failed' });
    }
  });

  socket.on('directive_sent', (directive) => {
    directives.set(directive.id, directive);
    io.emit('directive_sent', directive);
    console.log(`[directive] Command → ${directive.shipId}: ${directive.text}`);
  });

  socket.on('directive_response', ({ directiveId, shipId, response }) => {
    const ship      = getShipById(shipId);
    const directive = directives.get(directiveId);
    if (ship && directive && response === 'accept') {
      if (directive.heading != null) ship.heading = Number(directive.heading);
      if (directive.dest)            ship.dest    = directive.dest;
      ship.waypoints = [];
    }
    directives.delete(directiveId);
    io.emit('directive_response', { directiveId, shipId, response, timestamp: new Date().toISOString() });
    if (ship) broadcastShips(io);
    console.log(`[directive] ${shipId} ${response}ed directive ${directiveId}`);
  });

  // STEP 10: alert acknowledge / clear — single source of truth on the server
  socket.on('alert_ack',    ({ alertId }) => ackAlert(io, alertId));
  socket.on('alerts_clear', ()            => clearAlerts(io));
}

module.exports = { registerHandlers };
