module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // User joins their geo-zone room
    socket.on('join_zone', (zoneId) => {
      socket.join(zoneId);
      console.log(`Socket ${socket.id} joined zone: ${zoneId}`);
    });

    socket.on('leave_zone', (zoneId) => {
      socket.leave(zoneId);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
};