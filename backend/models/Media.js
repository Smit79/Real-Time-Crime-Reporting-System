const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema(
  {
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    report: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CrimeReport',
      default: null,          // linked report (null if uploaded before submit)
    },
    url: {
      type: String,
      required: true,         // public URL from Cloudinary / S3
    },
    publicId: {
      type: String,
      required: true,         // Cloudinary public_id (needed for deletion)
    },
    fileType: {
      type: String,
      enum: ['image', 'video', 'audio'],
      required: true,
    },
    mimeType: {
      type: String,           // e.g. image/jpeg, video/mp4
    },
    sizeBytes: {
      type: Number,           // file size in bytes
    },
    originalName: {
      type: String,           // original file name from user device
      trim: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,         // soft delete flag
    },
  },
  {
    timestamps: true,
  }
);

// Index to fetch all media of a specific report
mediaSchema.index({ report: 1 });

module.exports = mongoose.model('Media', mediaSchema);