require('dotenv').config();
const express = require('express');
const http    = require('http');
const cors    = require('cors');
const { Server } = require('socket.io');

const { startTick }         = require('./simulator/tick');
const { getShips }          = require('./simulator/fleet');
const { registerHandlers }  = require('./socket/handlers');
const { startSnapshotLoop } = require('./history/snapshots');
const { startWeatherLoop }  = require('./simulator/weather');
const { getAlerts }         = require('./alerts');
const apiRouter             = require('./routes/api');

const app    = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

app.use(cors());
app.use(express.json());
app.use('/api', apiRouter);

io.on('connection', (socket) => {
  console.log(`[socket] Client connected: ${socket.id}`);
  socket.emit('ship_update', getShips());
  registerHandlers(io, socket);
  socket.on('disconnect', () => console.log(`[socket] Client disconnected: ${socket.id}`));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`[server] Listening on port ${PORT}`);
  startTick(io);
  startSnapshotLoop(getShips, getAlerts);
  startWeatherLoop(io);
});
