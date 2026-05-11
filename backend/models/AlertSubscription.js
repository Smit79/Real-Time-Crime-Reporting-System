const mongoose = require('mongoose');

const alertSubscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    label: {
      type: String,
      trim: true,
      default: 'My Area',    // user-defined name e.g. "Home", "Office"
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],       // [longitude, latitude] — center of alert zone
        required: true,
      },
    },
    radiusKm: {
      type: Number,
      default: 5,             // alert radius in kilometers
      min: [1, 'Radius must be at least 1 km'],
      max: [50, 'Radius cannot exceed 50 km'],
    },
    crimeTypes: {
      type: [String],
      enum: [
        'theft', 'robbery', 'assault', 'murder', 'kidnapping',
        'vandalism', 'fraud', 'harassment', 'drug_related',
        'accident', 'fire', 'other',
      ],
      default: [],            // empty means subscribe to ALL crime types
    },
    minSeverity: {
      type: Number,
      min: 1,
      max: 5,
      default: 1,             // only alert if severity >= this value
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    channels: {
      push:   { type: Boolean, default: true },
      email:  { type: Boolean, default: false },
      in_app: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  }
);

// Geo index for finding subscriptions near a crime location
alertSubscriptionSchema.index({ location: '2dsphere' });

// One user should not have too many duplicate zones
alertSubscriptionSchema.index({ user: 1 });

module.exports = mongoose.model('AlertSubscription', alertSubscriptionSchema);