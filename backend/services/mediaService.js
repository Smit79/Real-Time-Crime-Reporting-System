const cloudinary = require('../config/cloudinary');
const Media      = require('../models/Media');
const ApiError   = require('../utils/apiError');

// ─── Upload file buffer to Cloudinary ────────────────────────────────────────
const uploadFile = (buffer, folder, resourceType = 'auto') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type:   resourceType,
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'mp4', 'mov', 'mp3'],
        transformation:  resourceType === 'image'
          ? [{ quality: 'auto', fetch_format: 'auto' }]
          : [],
      },
      (error, result) => {
        if (error) reject(new ApiError(`Upload failed: ${error.message}`, 500));
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
};

// ─── Delete file from Cloudinary ─────────────────────────────────────────────
const deleteFile = async (publicId, resourceType = 'image') => {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (err) {
    console.error(`Cloudinary delete failed: ${err.message}`);
  }
};

// ─── Get file type from mimetype ──────────────────────────────────────────────
const getFileType = (mimetype) => {
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('audio/')) return 'audio';
  return 'image';
};

// ─── Get cloudinary resource type ────────────────────────────────────────────
const getResourceType = (mimetype) => {
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('audio/')) return 'raw';
  return 'image';
};

// ─── Save media record to DB ──────────────────────────────────────────────────
const saveMediaRecord = async ({ uploadedBy, report, result, file }) => {
  return await Media.create({
    uploadedBy,
    report:       report || null,
    url:          result.secure_url,
    publicId:     result.public_id,
    fileType:     getFileType(file.mimetype),
    mimeType:     file.mimetype,
    sizeBytes:    file.size,
    originalName: file.originalname,
  });
};

// ─── Get storage usage for a user ────────────────────────────────────────────
const getUserStorageStats = async (userId) => {
  const stats = await Media.aggregate([
    { $match: { uploadedBy: userId, isDeleted: false } },
    {
      $group: {
        _id:        null,
        totalBytes: { $sum: '$sizeBytes' },
        totalFiles: { $sum: 1 },
        images:     { $sum: { $cond: [{ $eq: ['$fileType', 'image'] }, 1, 0] } },
        videos:     { $sum: { $cond: [{ $eq: ['$fileType', 'video'] }, 1, 0] } },
        audios:     { $sum: { $cond: [{ $eq: ['$fileType', 'audio'] }, 1, 0] } },
      },
    },
  ]);

  const data = stats[0] || {
    totalBytes: 0,
    totalFiles: 0,
    images:     0,
    videos:     0,
    audios:     0,
  };

  return {
    ...data,
    totalMB: (data.totalBytes / (1024 * 1024)).toFixed(2),
  };
};

module.exports = {
  uploadFile,
  deleteFile,
  getFileType,
  getResourceType,
  saveMediaRecord,
  getUserStorageStats,
};