const express = require('express');
const { getShips, getPorts } = require('../simulator/fleet');
const { getSnapshots }       = require('../history/snapshots');
const { getAlerts }          = require('../alerts');
const { getGrid, getStep }   = require('../simulator/weather');

const router = express.Router();

router.get('/health',    (req, res) => res.json({ status: 'ok', ships: getShips().length }));
router.get('/fleet',     (req, res) => res.json({ ships: getShips(), ports: getPorts() }));
router.get('/snapshots', (req, res) => res.json({ snapshots: getSnapshots() }));
router.get('/alerts',    (req, res) => res.json({ alerts:    getAlerts() }));
router.get('/weather',   (req, res) => res.json({ cells: getGrid(), step: getStep() }));

module.exports = router;
