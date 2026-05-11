module.exports = (io) => {
  // Broadcast crime alert to all users in a zone
  io.on('connection', (socket) => {
    socket.on('send_alert', ({ zoneId, alertData }) => {
      io.to(zoneId).emit('crime_alert', alertData);
    });
  });
};