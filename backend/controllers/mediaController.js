const Media        = require('../models/Media');
const CrimeReport  = require('../models/CrimeReport');
const AuditLog     = require('../models/AuditLog');
const ApiError     = require('../utils/apiError');
const ApiResponse  = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const cloudinary   = require('../config/cloudinary');

// ─── Helper: Detect resource type from mimetype ───────────────────────────────
const getResourceType = (mimetype) => {
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('audio/')) return 'raw';
  return 'image';
};

// ─── Helper: Detect file type label from mimetype ────────────────────────────
const getFileType = (mimetype) => {
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('audio/')) return 'audio';
  return 'image';
};

// ─── Helper: Upload single file buffer to Cloudinary ─────────────────────────
const uploadToCloudinary = (fileBuffer, folder, resourceType) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type:  resourceType,
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'mp4', 'mov', 'mp3'],
        transformation: resourceType === 'image'
          ? [{ quality: 'auto', fetch_format: 'auto' }]  // auto compress images
          : [],
      },
      (error, result) => {
        if (error) reject(new ApiError(`Upload failed: ${error.message}`, 500));
        else resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
};

// ─── Helper: Delete file from Cloudinary ─────────────────────────────────────
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (err) {
    console.error(`Cloudinary delete error: ${err.message}`);
  }
};

// ─── @desc    Upload one or more files
// ─── @route   POST /api/v1/media/upload
// ─── @access  Private
const uploadFiles = asyncHandler(async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next(new ApiError('No files provided', 400));
  }

  const { reportId } = req.body;

  // Validate reportId if provided
  if (reportId) {
    const report = await CrimeReport.findById(reportId);
    if (!report) {
      return next(new ApiError('Crime report not found', 404));
    }
    // Only report owner can attach media
    if (report.reportedBy?.toString() !== req.user._id.toString()) {
      return next(new ApiError('Not authorized to attach media to this report', 403));
    }
  }

  const uploadedFiles = [];
  const failedFiles   = [];

  // Upload each file
  for (const file of req.files) {
    try {
      const resourceType = getResourceType(file.mimetype);
      const fileType     = getFileType(file.mimetype);
      const folder       = `crime-reporting/${fileType}s`;

      const result = await uploadToCloudinary(
        file.buffer,
        folder,
        resourceType
      );

      // Save media record in DB
      const media = await Media.create({
        uploadedBy:   req.user._id,
        report:       reportId || null,
        url:          result.secure_url,
        publicId:     result.public_id,
        fileType,
        mimeType:     file.mimetype,
        sizeBytes:    file.size,
        originalName: file.originalname,
      });

      uploadedFiles.push(media);

      // If reportId given — attach media URL to the report too
      if (reportId) {
        await CrimeReport.findByIdAndUpdate(reportId, {
          $push: {
            mediaUrls: {
              url:      result.secure_url,
              fileType,
              publicId: result.public_id,
            },
          },
        });
      }
    } catch (err) {
      failedFiles.push({
        filename: file.originalname,
        error:    err.message,
      });
    }
  }

  // Audit log
  await AuditLog.create({
    performedBy: req.user._id,
    action:      'media_uploaded',
    targetType:  reportId ? 'CrimeReport' : 'System',
    targetId:    reportId || null,
    description: `User uploaded ${uploadedFiles.length} file(s)`,
    ipAddress:   req.ip,
    userAgent:   req.headers['user-agent'],
    metadata: {
      uploadedCount: uploadedFiles.length,
      failedCount:   failedFiles.length,
    },
  });

  res.status(201).json(
    new ApiResponse(201, {
      uploaded: uploadedFiles,
      failed:   failedFiles,
      summary: {
        total:    req.files.length,
        success:  uploadedFiles.length,
        failed:   failedFiles.length,
      },
    }, `${uploadedFiles.length} file(s) uploaded successfully`)
  );
});

// ─── @desc    Get all media uploaded by logged in user
// ─── @route   GET /api/v1/media
// ─── @access  Private
const getMyMedia = asyncHandler(async (req, res, next) => {
  const {
    page      = 1,
    limit     = 12,
    fileType,
    reportId,
    isDeleted = false,
    sortBy    = 'createdAt',
    order     = 'desc',
  } = req.query;

  const filter = {
    uploadedBy: req.user._id,
    isDeleted:  isDeleted === 'true',
  };

  if (fileType) filter.fileType = fileType;
  if (reportId) filter.report   = reportId;

  const skip  = (Number(page) - 1) * Number(limit);
  const sort  = { [sortBy]: order === 'asc' ? 1 : -1 };
  const total = await Media.countDocuments(filter);

  const mediaFiles = await Media
    .find(filter)
    .populate('report', 'title crimeType status')
    .sort(sort)
    .skip(skip)
    .limit(Number(limit));

  // Calculate total storage used
  const storageStats = await Media.aggregate([
    {
      $match: {
        uploadedBy: req.user._id,
        isDeleted:  false,
      },
    },
    {
      $group: {
        _id:           null,
        totalBytes:    { $sum: '$sizeBytes' },
        totalFiles:    { $sum: 1 },
        imageCount:    { $sum: { $cond: [{ $eq: ['$fileType', 'image'] }, 1, 0] } },
        videoCount:    { $sum: { $cond: [{ $eq: ['$fileType', 'video'] }, 1, 0] } },
        audioCount:    { $sum: { $cond: [{ $eq: ['$fileType', 'audio'] }, 1, 0] } },
      },
    },
  ]);

  const stats = storageStats[0] || {
    totalBytes: 0,
    totalFiles: 0,
    imageCount: 0,
    videoCount: 0,
    audioCount: 0,
  };

  // Convert bytes to MB
  stats.totalMB = (stats.totalBytes / (1024 * 1024)).toFixed(2);

  res.status(200).json(
    new ApiResponse(200, {
      mediaFiles,
      stats,
      pagination: {
        total,
        page:       Number(page),
        limit:      Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    }, 'Media files fetched successfully')
  );
});

// ─── @desc    Get single media file by ID
// ─── @route   GET /api/v1/media/:id
// ─── @access  Private
const getMediaById = asyncHandler(async (req, res, next) => {
  const media = await Media
    .findById(req.params.id)
    .populate('uploadedBy', 'fullName email avatar')
    .populate('report',     'title crimeType status location');

  if (!media) {
    return next(new ApiError('Media file not found', 404));
  }

  // Only owner or admin can view
  if (
    media.uploadedBy._id.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    return next(new ApiError('Not authorized to view this file', 403));
  }

  res.status(200).json(
    new ApiResponse(200, { media }, 'Media file fetched successfully')
  );
});

// ─── @desc    Delete a media file (soft delete + cloudinary remove)
// ─── @route   DELETE /api/v1/media/:id
// ─── @access  Private
const deleteMedia = asyncHandler(async (req, res, next) => {
  const media = await Media.findById(req.params.id);

  if (!media) {
    return next(new ApiError('Media file not found', 404));
  }

  // Only owner or admin can delete
  if (
    media.uploadedBy.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    return next(new ApiError('Not authorized to delete this file', 403));
  }

  // Already deleted
  if (media.isDeleted) {
    return next(new ApiError('Media file already deleted', 400));
  }

  // Delete from Cloudinary
  const resourceType = getResourceType(media.mimeType);
  await deleteFromCloudinary(media.publicId, resourceType);

  // Remove from linked crime report if attached
  if (media.report) {
    await CrimeReport.findByIdAndUpdate(media.report, {
      $pull: {
        mediaUrls: { publicId: media.publicId },
      },
    });
  }

  // Soft delete in DB
  media.isDeleted = true;
  await media.save();

  // Audit log
  await AuditLog.create({
    performedBy: req.user._id,
    action:      'media_uploaded',
    targetType:  'CrimeReport',
    targetId:    media.report || null,
    description: `Media file deleted: ${media.originalName}`,
    ipAddress:   req.ip,
    userAgent:   req.headers['user-agent'],
  });

  res.status(200).json(
    new ApiResponse(200, null, 'Media file deleted successfully')
  );
});

module.exports = {
  uploadFiles,
  getMyMedia,
  getMediaById,
  deleteMedia,
};