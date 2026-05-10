const PORTS = {
  'KWT-1': { name: 'Kuwait City',  lat: 29.48, lon: 48.34 },
  'BUS-1': { name: 'Bushehr',      lat: 28.83, lon: 50.73 },
  'DMM-1': { name: 'Dammam',       lat: 26.56, lon: 50.30 },
  'BAH-1': { name: 'Manama',       lat: 26.50, lon: 50.55 },
  'DOH-1': { name: 'Doha',         lat: 25.46, lon: 51.95 },
  'AUH-1': { name: 'Abu Dhabi',    lat: 25.22, lon: 54.18 },
  'DXB-1': { name: 'Jebel Ali',    lat: 25.50, lon: 54.75 },
  'BND-1': { name: 'Bandar Abbas', lat: 26.62, lon: 56.11 },
  'SOH-1': { name: 'Sohar',        lat: 24.72, lon: 57.02 },
  'MCT-1': { name: 'Muscat',       lat: 23.92, lon: 58.58 },
};

// [lat, lon] pairs forming navigable water boundary
const NAVIGABLE_POLYGON = [
  [29.80,48.60],[29.50,50.00],[28.80,50.80],[27.80,52.00],
  [26.70,53.50],[26.30,55.00],[26.65,56.10],[26.50,56.40],
  [26.00,56.80],[25.50,57.50],[25.50,58.50],[25.00,60.00],
  [22.00,60.00],[22.50,60.00],[23.80,58.80],[24.50,57.20],
  [25.20,56.50],[26.45,56.45],[26.30,55.90],[26.00,55.50],
  [25.30,54.50],[24.80,53.00],[25.30,52.00],[26.40,51.50],
  [26.50,50.30],[27.50,49.80],[28.50,49.00],[29.50,48.30],
  [29.80,48.60],
];

const MAX_FUEL = 9000;

const INITIAL_SHIPS = [
  { id:'MV-1',  name:'Aurora',   lat:26.55, lon:56.20, speed:14, heading:105, dest:'MCT-1', fuel:6800, cargo:'crude oil' },
  { id:'MV-2',  name:'Borealis', lat:25.50, lon:57.20, speed:19, heading:270, dest:'DXB-1', fuel:5400, cargo:'containers' },
  { id:'MV-3',  name:'Cygnus',   lat:25.70, lon:53.00, speed:16, heading:95,  dest:'MCT-1', fuel:7200, cargo:'LNG' },
  { id:'MV-4',  name:'Dragon',   lat:26.40, lon:56.00, speed:13, heading:110, dest:'SOH-1', fuel:5800, cargo:'bulk grain' },
  { id:'MV-5',  name:'Emerald',  lat:27.50, lon:51.20, speed:12, heading:165, dest:'DOH-1', fuel:8200, cargo:'crude oil' },
  { id:'MV-6',  name:'Falcon',   lat:25.40, lon:54.53, speed:22, heading:280, dest:'DOH-1', fuel:4100, cargo:'containers' },
  { id:'MV-7',  name:'Gharial',  lat:26.50, lon:53.50, speed:14, heading:270, dest:'KWT-1', fuel:750,  cargo:'crude oil' },
  { id:'MV-8',  name:'Halcyon',  lat:24.93, lon:56.94, speed:19, heading:250, dest:'DMM-1', fuel:5200, cargo:'automobiles' },
  { id:'MV-9',  name:'Iris',     lat:28.20, lon:50.30, speed:13, heading:175, dest:'BAH-1', fuel:7800, cargo:'crude oil' },
  { id:'MV-10', name:'Jade',     lat:25.02, lon:57.96, speed:20, heading:285, dest:'BND-1', fuel:6300, cargo:'containers' },
  { id:'MV-11', name:'Kite',     lat:25.64, lon:52.18, speed:18, heading:95,  dest:'MCT-1', fuel:7600, cargo:'LNG' },
  { id:'MV-12', name:'Lotus',    lat:29.10, lon:48.80, speed:12, heading:145, dest:'SOH-1', fuel:8500, cargo:'crude oil' },
  { id:'MV-13', name:'Mirage',   lat:24.60, lon:57.30, speed:21, heading:320, dest:'BAH-1', fuel:5900, cargo:'containers' },
  { id:'MV-14', name:'Nova',     lat:24.12, lon:58.43, speed:11, heading:290, dest:'DOH-1', fuel:4600, cargo:'bulk cement' },
  { id:'MV-15', name:'Orca',     lat:26.34, lon:55.91, speed:13, heading:215, dest:'MCT-1', fuel:7100, cargo:'crude oil' },
];

// Live fleet state — mutated each tick
const ships = INITIAL_SHIPS.map(s => ({
  ...s,
  status: s.fuel < 1000 ? 'low_fuel' : 'underway',
  waypoints: [],
  path: [],
  weatherPenalty: false,
}));

function getShips() { return ships; }

function getShipById(id) { return ships.find(s => s.id === id); }

function getPorts() { return PORTS; }

function getNavigablePolygon() { return NAVIGABLE_POLYGON; }

module.exports = { getShips, getShipById, getPorts, getNavigablePolygon, MAX_FUEL };
