const mongoose = require('mongoose');

const crimeReportSchema = new mongoose.Schema(
  {
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,          // null if anonymous
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    crimeType: {
      type: String,
      required: [true, 'Crime type is required'],
      enum: [
        'theft',
        'robbery',
        'assault',
        'murder',
        'kidnapping',
        'vandalism',
        'fraud',
        'harassment',
        'drug_related',
        'accident',
        'fire',
        'other',
      ],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],       // [longitude, latitude]
        required: [true, 'Location coordinates are required'],
      },
    },
    address: {
      street:  { type: String, trim: true },
      city:    { type: String, trim: true },
      state:   { type: String, trim: true },
      pincode: { type: String, trim: true },
      full:    { type: String, trim: true }, // full readable address
    },
    contactDetails: {
      email: {
        type: String,
        required: [true, 'Contact email is required'],
        lowercase: true,
        trim: true,
      },
      phone: {
        type: String,
        required: [true, 'Contact phone is required'],
        trim: true,
      },
    },
    severity: {
      type: Number,
      min: [1, 'Severity must be at least 1'],
      max: [5, 'Severity cannot exceed 5'],
      default: 3,
    },
    status: {
      type: String,
      enum: ['pending', 'verified', 'investigating', 'resolved', 'rejected'],
      default: 'pending',
    },
    mediaUrls: [
      {
        url:      { type: String },
        fileType: { type: String, enum: ['image', 'video', 'audio'] },
        publicId: { type: String }, // cloudinary public_id for deletion
      },
    ],
    witnesses: {
      type: Number,
      default: 0,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,          // officer who verified
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    upvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',          // users who confirmed this report is real
      },
    ],
    incidentTime: {
      type: Date,
      default: Date.now,      // when crime actually happened
    },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Geo index — required for $geoNear and $geoWithin queries
crimeReportSchema.index({ location: '2dsphere' });

// Index for faster status and type filtering
crimeReportSchema.index({ status: 1, crimeType: 1 });

// Virtual: upvote count
crimeReportSchema.virtual('upvoteCount').get(function () {
  return this.upvotes?.length ?? 0;
});

module.exports = mongoose.model('CrimeReport', crimeReportSchema);