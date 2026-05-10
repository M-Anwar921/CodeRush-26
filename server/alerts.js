// Unified alert queue — every alert (geofence, proximity, distress) flows through here.
const queue = []; // newest first
const MAX = 200;

function makeAlertId() {
  return 'alert_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
}

function addAlert(io, alert) {
  const enriched = {
    id:           makeAlertId(),
    timestamp:    new Date().toISOString(),
    acknowledged: false,
    ...alert,
  };
  queue.unshift(enriched);
  while (queue.length > MAX) queue.pop();
  io.emit('alert', enriched);
  return enriched;
}

function getAlerts() {
  return queue;
}

function ackAlert(io, alertId) {
  const a = queue.find(x => x.id === alertId);
  if (a) {
    a.acknowledged = true;
    io.emit('alert_ack', { alertId });
  }
}

function ackAllByZone(io, zoneId) {
  const ids = [];
  for (const a of queue) {
    if (a.zoneId === zoneId && !a.acknowledged) {
      a.acknowledged = true;
      ids.push(a.id);
    }
  }
  if (ids.length) io.emit('alerts_ack_bulk', { ids });
}

function clearAlerts(io) {
  queue.length = 0;
  io.emit('alerts_cleared');
}

module.exports = { addAlert, getAlerts, ackAlert, ackAllByZone, clearAlerts };
