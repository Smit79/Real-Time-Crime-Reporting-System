const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'crime_alert',        // new crime reported near user
        'report_verified',    // user's report was verified
        'report_investigating', // user's report is under investigation
        'report_resolved',    // user's report was resolved
        'report_rejected',    // user's report was rejected
        'system',             // general system notification
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    data: {
      reportId:  { type: mongoose.Schema.Types.ObjectId, ref: 'CrimeReport', default: null },
      crimeType: { type: String, default: null },
      location:  { type: String, default: null },
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
    channel: {
      type: String,
      enum: ['push', 'email', 'in_app', 'sms'],
      default: 'in_app',
    },
    isSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for fetching unread notifications of a user fast
notificationSchema.index({ recipient: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);