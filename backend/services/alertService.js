const AlertSubscription = require('../models/AlertSubscription');
const Notification      = require('../models/Notification');
const { getDistanceKm } = require('../utils/geoHelper');

// ─── Find subscribers near a crime location & notify ─────────────────────────
const notifyNearbySubscribers = async (report, io) => {
  try {
    const [lng, lat] = report.location.coordinates;

    const subscriptions = await AlertSubscription.find({
      isActive: true,
      location: {
        $geoWithin: {
          $centerSphere: [[lng, lat], 50 / 6371],  // 50km search
        },
      },
    }).populate('user', '_id fcmToken email');

    for (const sub of subscriptions) {
      // Crime type filter
      if (sub.crimeTypes.length > 0 && !sub.crimeTypes.includes(report.crimeType)) continue;

      // Severity filter
      if (report.severity < sub.minSeverity) continue;

      // Precise distance check
      const [sLng, sLat] = sub.location.coordinates;
      const distKm       = getDistanceKm(lat, lng, sLat, sLng);
      if (distKm > sub.radiusKm) continue;

      // In-app notification
      if (sub.channels.in_app) {
        await Notification.create({
          recipient: sub.user._id,
          type:      'crime_alert',
          title:     `${report.crimeType.toUpperCase()} reported nearby`,
          message:   `A ${report.crimeType} was reported ${distKm.toFixed(1)}km away. Stay alert!`,
          data: {
            reportId:  report._id,
            crimeType: report.crimeType,
            location:  report.address?.full || 'Unknown location',
          },
          channel: 'in_app',
          isSent:  true,
        });
      }

      // Real-time socket alert
      if (io) {
        io.to(`zone_${sub._id}`).emit('crime_alert', {
          reportId:  report._id,
          crimeType: report.crimeType,
          severity:  report.severity,
          location:  report.address?.full,
          coords:    report.location.coordinates,
          distKm:    distKm.toFixed(1),
          time:      report.createdAt,
        });

        // Personal notification room
        io.to(`user_${sub.user._id}`).emit('notification', {
          type:    'crime_alert',
          title:   `${report.crimeType.toUpperCase()} nearby`,
          message: `${distKm.toFixed(1)}km away`,
        });
      }
    }
  } catch (err) {
    console.error('Alert notification error:', err.message);
  }
};

// ─── Get subscriptions for a user ────────────────────────────────────────────
const getUserSubscriptions = async (userId, filter = {}) => {
  return await AlertSubscription.find({ user: userId, ...filter });
};

// ─── Create subscription ──────────────────────────────────────────────────────
const createSubscription = async (data) => {
  return await AlertSubscription.create(data);
};

// ─── Delete subscription ──────────────────────────────────────────────────────
const deleteSubscription = async (id) => {
  return await AlertSubscription.findByIdAndDelete(id);
};

module.exports = {
  notifyNearbySubscribers,
  getUserSubscriptions,
  createSubscription,
  deleteSubscription,
};