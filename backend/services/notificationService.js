const Notification = require('../models/Notification');
const User         = require('../models/User');
const sendEmail    = require('../utils/sendEmail');

// ─── Create in-app notification ───────────────────────────────────────────────
const createNotification = async ({ recipient, type, title, message, data, channel }) => {
  return await Notification.create({
    recipient,
    type,
    title,
    message,
    data:    data    || {},
    channel: channel || 'in_app',
    isSent:  true,
  });
};

// ─── Send email notification ──────────────────────────────────────────────────
const sendEmailNotification = async ({ userId, subject, html }) => {
  const user = await User.findById(userId);
  if (!user || !user.email) return;

  await sendEmail({ to: user.email, subject, html });

  await Notification.create({
    recipient: userId,
    type:      'system',
    title:     subject,
    message:   html.replace(/<[^>]*>/g, ''),
    channel:   'email',
    isSent:    true,
  });
};

// ─── Send real-time socket notification ───────────────────────────────────────
const sendSocketNotification = async ({ io, userId, event, data }) => {
  if (!io) return;
  io.to(`user_${userId}`).emit(event, data);
};

// ─── Mark notifications as read ───────────────────────────────────────────────
const markAsRead = async (userId, notificationIds = []) => {
  const filter = { recipient: userId, isRead: false };
  if (notificationIds.length > 0) filter._id = { $in: notificationIds };

  await Notification.updateMany(filter, {
    $set: { isRead: true, readAt: new Date() },
  });
};

// ─── Get unread count for user ────────────────────────────────────────────────
const getUnreadCount = async (userId) => {
  return await Notification.countDocuments({
    recipient: userId,
    isRead:    false,
  });
};

// ─── Delete old notifications (cleanup) ───────────────────────────────────────
const deleteOldNotifications = async (daysOld = 30) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await Notification.deleteMany({
    createdAt: { $lt: cutoffDate },
    isRead:    true,
  });

  return result.deletedCount;
};

module.exports = {
  createNotification,
  sendEmailNotification,
  sendSocketNotification,
  markAsRead,
  getUnreadCount,
  deleteOldNotifications,
};