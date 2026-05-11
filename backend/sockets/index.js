const crimeSocket = require('./crimeSocket');
const alertSocket = require('./alertSocket');

module.exports = (io) => {
  crimeSocket(io);
  alertSocket(io);
};