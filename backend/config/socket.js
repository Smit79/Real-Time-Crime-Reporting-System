const { Server } = require('socket.io');
const { CLIENT_URL } = require('./env');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin:      CLIENT_URL,
      methods:     ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout:  60000,   // 60 seconds
    pingInterval: 25000,   // 25 seconds
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // User joins their personal notification room
    socket.on('join_user_room', (userId) => {
      socket.join(`user_${userId}`);
      console.log(`Socket ${socket.id} joined user room: user_${userId}`);
    });

    // User joins a geo alert zone room
    socket.on('join_zone', (zoneId) => {
      socket.join(`zone_${zoneId}`);
      console.log(`Socket ${socket.id} joined zone: zone_${zoneId}`);
    });

    // User leaves a geo alert zone room
    socket.on('leave_zone', (zoneId) => {
      socket.leave(`zone_${zoneId}`);
      console.log(`Socket ${socket.id} left zone: zone_${zoneId}`);
    });

    // User goes online — broadcast to others
    socket.on('user_online', (userId) => {
      socket.broadcast.emit('user_status', {
        userId,
        status: 'online',
      });
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${socket.id} — reason: ${reason}`);
    });

    // Handle errors
    socket.on('error', (err) => {
      console.error(`Socket error: ${err.message}`);
    });
  });

  return io;
};

// Get io instance anywhere in the app
const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized. Call initSocket first.');
  }
  return io;
};

module.exports = { initSocket, getIO };