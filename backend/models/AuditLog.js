const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'user_registered',
        'user_login',
        'user_logout',
        'user_updated',
        'user_deleted',
        'report_created',
        'report_updated',
        'report_pending',
        'report_verified',
        'report_investigating',
        'report_resolved',
        'report_rejected',
        'report_deleted',
        'media_uploaded',
        'alert_sent',
        'admin_action',
      ],
    },
    targetType: {
      type: String,
      enum: ['User', 'CrimeReport', 'Notification', 'System'],
      default: 'System',
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,          // ID of the affected document
    },
    description: {
      type: String,
      trim: true,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed, // any extra info as key-value
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Index for admin dashboard queries
auditLogSchema.index({ performedBy: 1, createdAt: -1 });
auditLogSchema.index({ action: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);