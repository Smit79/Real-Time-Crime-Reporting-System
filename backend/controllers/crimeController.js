const CrimeReport      = require('../models/CrimeReport');
const User             = require('../models/User');
const AlertSubscription = require('../models/AlertSubscription');
const Notification     = require('../models/Notification');
const AuditLog         = require('../models/AuditLog');
const ApiError         = require('../utils/apiError');
const ApiResponse      = require('../utils/apiResponse');
const asyncHandler     = require('../utils/asyncHandler');
const cloudinary       = require('../config/cloudinary');

// ─── Helper: Upload files to Cloudinary ──────────────────────────────────────
const uploadFileToCloudinary = (fileBuffer, folder, resourceType = 'auto') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => {
        if (error) reject(new ApiError('File upload failed', 500));
        else resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
};

// ─── Helper: Find nearby alert subscribers & notify them ─────────────────────
const notifyNearbySubscribers = async (report, io) => {
  try {
    const notifiedUserIds = new Set();

    // Find all active subscriptions whose zone covers the crime location
    const subscriptions = await AlertSubscription.find({
      isActive: true,
      location: {
        $geoWithin: {
          $centerSphere: [
            report.location.coordinates,
            0.1,                            // ~10km search radius in radians
          ],
        },
      },
    }).populate('user', '_id fcmToken');

    for (const sub of subscriptions) {
      if (!sub.user?._id) continue;

      // Check crime type filter
      if (sub.crimeTypes.length > 0 && !sub.crimeTypes.includes(report.crimeType)) {
        continue;
      }

      // Check severity filter
      if (report.severity < sub.minSeverity) continue;

      // Check if crime is within subscription radius
      const [lng, lat]   = report.location.coordinates;
      const [sLng, sLat] = sub.location.coordinates;
      const distKm       = getDistanceKm(lat, lng, sLat, sLng);

      if (distKm > sub.radiusKm) continue;

      const targetUserId = String(sub.user._id);

      // Avoid notifying the same user about their own report.
      if (report.reportedBy && targetUserId === String(report.reportedBy)) {
        continue;
      }

      notifiedUserIds.add(targetUserId);

      // Create in-app notification
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

      // Emit real-time socket alert
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

        io.to(`user_${sub.user._id}`).emit('notification', {
          type: 'crime_alert',
          title: `${report.crimeType.toUpperCase()} nearby`,
          message: `${distKm.toFixed(1)}km away`,
        });
      }
    }

    // Fallback: users with profile location near the crime should still receive alerts
    // even if they haven't explicitly created alert subscriptions.
    const fallbackRadiusKm = 5;
    const fallbackUsers = await User.find({
      isActive: true,
      ...(report.reportedBy ? { _id: { $ne: report.reportedBy } } : {}),
      location: {
        $geoWithin: {
          $centerSphere: [
            report.location.coordinates,
            fallbackRadiusKm / 6371,
          ],
        },
      },
    }).select('_id location');

    for (const user of fallbackUsers) {
      const userId = String(user._id);
      if (notifiedUserIds.has(userId)) continue;

      const [lng, lat] = report.location.coordinates;
      const [uLng, uLat] = user.location.coordinates;
      const distKm = getDistanceKm(lat, lng, uLat, uLng);

      await Notification.create({
        recipient: user._id,
        type: 'crime_alert',
        title: `${report.crimeType.toUpperCase()} reported nearby`,
        message: `A ${report.crimeType} was reported ${distKm.toFixed(1)}km away. Stay alert!`,
        data: {
          reportId: report._id,
          crimeType: report.crimeType,
          location: report.address?.full || 'Unknown location',
        },
        channel: 'in_app',
        isSent: true,
      });

      if (io) {
        io.to(`user_${user._id}`).emit('notification', {
          type: 'crime_alert',
          title: `${report.crimeType.toUpperCase()} nearby`,
          message: `${distKm.toFixed(1)}km away`,
        });
      }
    }
  } catch (err) {
    console.error('Notification error:', err.message);
  }
};

// ─── Helper: Haversine distance in km ────────────────────────────────────────
const getDistanceKm = (lat1, lng1, lat2, lng2) => {
  const R    = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ─── @desc    Get all crime reports (public) with filters & pagination
// ─── @route   GET /api/v1/crimes
// ─── @access  Public
const getAllReports = asyncHandler(async (req, res, next) => {
  const {
    page       = 1,
    limit      = 10,
    status,
    crimeType,
    severity,
    startDate,
    endDate,
    search,
    sortBy     = 'createdAt',
    order      = 'desc',
  } = req.query;

  const filter = {};

  if (status)    filter.status    = status;
  if (crimeType) filter.crimeType = crimeType;
  if (severity)  filter.severity  = Number(severity);

  if (search) {
    filter.$or = [
      { title:       { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate)   filter.createdAt.$lte = new Date(endDate);
  }

  const skip  = (Number(page) - 1) * Number(limit);
  const sort  = { [sortBy]: order === 'asc' ? 1 : -1 };
  const total = await CrimeReport.countDocuments(filter);

  const reports = await CrimeReport
    .find(filter)
    .populate('reportedBy', 'fullName avatar')
    .populate('verifiedBy', 'fullName')
    .sort(sort)
    .skip(skip)
    .limit(Number(limit));

  res.status(200).json(
    new ApiResponse(200, {
      reports,
      pagination: {
        total,
        page:       Number(page),
        limit:      Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    }, 'Reports fetched successfully')
  );
});

// ─── @desc    Get nearby crime reports using geo query
// ─── @route   GET /api/v1/crimes/nearby?lat=&lng=&radius=&crimeType=
// ─── @access  Public
const getNearbyReports = asyncHandler(async (req, res, next) => {
  const {
    lat,
    lng,
    radius    = 5,          // km
    crimeType,
    status,
    limit     = 20,
    page      = 1,
  } = req.query;

  if (!lat || !lng) {
    return next(new ApiError('Latitude and longitude are required', 400));
  }

  const latitude   = Number(lat);
  const longitude  = Number(lng);
  const radiusInKm = Number(radius);

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return next(new ApiError('Invalid coordinates provided', 400));
  }

  const filter = {
    location: {
      $geoWithin: {
        $centerSphere: [
          [longitude, latitude],
          radiusInKm / 6371,              // convert km to radians
        ],
      },
    },
  };

  if (crimeType) filter.crimeType = crimeType;
  if (status)    filter.status    = status;

  const skip  = (Number(page) - 1) * Number(limit);
  const total = await CrimeReport.countDocuments(filter);

  // Use $geoNear for distance-sorted results
  const reports = await CrimeReport.aggregate([
    {
      $geoNear: {
        near: {
          type:        'Point',
          coordinates: [longitude, latitude],
        },
        distanceField:    'distanceInMeters',
        maxDistance:      radiusInKm * 1000,   // metres
        spherical:        true,
        ...(crimeType && { query: { crimeType } }),
        ...(status    && { query: { status } }),
      },
    },
    {
      $addFields: {
        distanceInKm: {
          $divide: ['$distanceInMeters', 1000],
        },
      },
    },
    { $skip:  skip          },
    { $limit: Number(limit) },
    {
      $lookup: {
        from:         'users',
        localField:   'reportedBy',
        foreignField: '_id',
        as:           'reportedBy',
        pipeline: [
          { $project: { fullName: 1, avatar: 1 } },
        ],
      },
    },
    { $unwind: { path: '$reportedBy', preserveNullAndEmptyArrays: true } },
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      reports,
      center: { latitude, longitude },
      radiusKm: radiusInKm,
      pagination: {
        total,
        page:       Number(page),
        limit:      Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    }, 'Nearby reports fetched successfully')
  );
});

// ─── @desc    Get heatmap data (clustered coordinates)
// ─── @route   GET /api/v1/crimes/heatmap?period=7&crimeType=
// ─── @access  Public
const getHeatmapData = asyncHandler(async (req, res, next) => {
  const {
    period    = 30,         // days
    crimeType,
    severity,
  } = req.query;

  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - Number(period));

  const filter = { createdAt: { $gte: daysAgo } };
  if (crimeType) filter.crimeType = crimeType;
  if (severity)  filter.severity  = Number(severity);

  const heatmapData = await CrimeReport.aggregate([
    { $match: filter },
    {
      $project: {
        coordinates: '$location.coordinates',
        crimeType:   1,
        severity:    1,
        weight: {
          $multiply: ['$severity', 1],  // severity acts as weight
        },
      },
    },
  ]);

  // Format for frontend heatmap libraries
  const points = heatmapData.map((d) => ({
    lat:      d.coordinates[1],
    lng:      d.coordinates[0],
    weight:   d.weight,
    type:     d.crimeType,
  }));

  res.status(200).json(
    new ApiResponse(200, {
      points,
      total:  points.length,
      period: Number(period),
    }, 'Heatmap data fetched successfully')
  );
});

// ─── @desc    Get single report by ID
// ─── @route   GET /api/v1/crimes/:id
// ─── @access  Public
const getReportById = asyncHandler(async (req, res, next) => {
  const report = await CrimeReport
    .findById(req.params.id)
    .populate('reportedBy', 'fullName avatar')
    .populate('verifiedBy', 'fullName email');

  if (!report) {
    return next(new ApiError('Crime report not found', 404));
  }

  res.status(200).json(
    new ApiResponse(200, { report }, 'Report fetched successfully')
  );
});

// ─── @desc    Create new crime report
// ─── @route   POST /api/v1/crimes
// ─── @access  Private
const createReport = asyncHandler(async (req, res, next) => {
  const {
    crimeType,
    title,
    description,
    longitude,
    latitude,
    contactEmail,
    contactPhone,
    address,
    severity,
    isAnonymous,
    witnesses,
    incidentTime,
  } = req.body;

  // Validate coordinates
  if (longitude === undefined || longitude === null || latitude === undefined || latitude === null) {
    return next(new ApiError('Location coordinates are required', 400));
  }

  const lng = Number(longitude);
  const lat = Number(latitude);

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return next(new ApiError('Invalid coordinates provided', 400));
  }

  const normalizedEmail = String(contactEmail || '').trim().toLowerCase();
  const normalizedPhone = String(contactPhone || '').trim();
  const emailRegex = /^\S+@\S+\.\S+$/;
  const phoneRegex = /^[0-9+()\-\s]{7,20}$/;

  if (!normalizedEmail || !emailRegex.test(normalizedEmail)) {
    return next(new ApiError('Valid contact email is required', 400));
  }

  if (!normalizedPhone || !phoneRegex.test(normalizedPhone)) {
    return next(new ApiError('Valid contact phone is required', 400));
  }

  // Upload media files to cloudinary
  const mediaUrls = [];
  if (req.files?.length > 0) {
    for (const file of req.files) {
      const resourceType = file.mimetype.startsWith('video') ? 'video' : 'image';
      const result = await uploadFileToCloudinary(
        file.buffer,
        'crime-reports',
        resourceType
      );
      mediaUrls.push({
        url:      result.secure_url,
        fileType: file.mimetype.startsWith('video') ? 'video' : 'image',
        publicId: result.public_id,
      });
    }
  }

  // Parse address if sent as string
  let parsedAddress = address;
  if (typeof address === 'string') {
    try { parsedAddress = JSON.parse(address); } catch { parsedAddress = { full: address }; }
  }

  const report = await CrimeReport.create({
    reportedBy:   isAnonymous === 'true' ? null : req.user._id,
    isAnonymous:  isAnonymous === 'true',
    crimeType,
    title,
    description,
    location: {
      type:        'Point',
      coordinates: [lng, lat],
    },
    address:      parsedAddress,
    contactDetails: {
      email: normalizedEmail,
      phone: normalizedPhone,
    },
    severity:     Number(severity) || 3,
    mediaUrls,
    witnesses:    Number(witnesses) || 0,
    incidentTime: incidentTime ? new Date(incidentTime) : new Date(),
  });

  // Audit log
  await AuditLog.create({
    performedBy: req.user._id,
    action:      'report_created',
    targetType:  'CrimeReport',
    targetId:    report._id,
    description: `New crime report created: ${report.title}`,
    ipAddress:   req.ip,
    userAgent:   req.headers['user-agent'],
  });

  // Notify nearby subscribers in background
  const io = req.app.get('io');
  notifyNearbySubscribers(report, io);

  res.status(201).json(
    new ApiResponse(201, { report }, 'Crime report submitted successfully')
  );
});

// ─── @desc    Update a crime report
// ─── @route   PATCH /api/v1/crimes/:id
// ─── @access  Private (owner only)
const updateReport = asyncHandler(async (req, res, next) => {
  const report = await CrimeReport.findById(req.params.id);

  if (!report) {
    return next(new ApiError('Crime report not found', 404));
  }

  // Only owner can update (unless admin — handled in admin routes)
  if (report.reportedBy?.toString() !== req.user._id.toString()) {
    return next(new ApiError('Not authorized to update this report', 403));
  }

  // Only pending reports can be updated
  if (report.status !== 'pending') {
    return next(new ApiError('Only pending reports can be edited', 400));
  }

  const {
    title,
    description,
    crimeType,
    severity,
    address,
    witnesses,
    incidentTime,
  } = req.body;

  const updateData = {};
  if (title)        updateData.title        = title;
  if (description)  updateData.description  = description;
  if (crimeType)    updateData.crimeType    = crimeType;
  if (severity)     updateData.severity     = Number(severity);
  if (witnesses)    updateData.witnesses    = Number(witnesses);
  if (incidentTime) updateData.incidentTime = new Date(incidentTime);

  if (address) {
    let parsedAddress = address;
    if (typeof address === 'string') {
      try { parsedAddress = JSON.parse(address); } catch { parsedAddress = { full: address }; }
    }
    updateData.address = parsedAddress;
  }

  // Upload new media files
  if (req.files?.length > 0) {
    const newMedia = [];
    for (const file of req.files) {
      const resourceType = file.mimetype.startsWith('video') ? 'video' : 'image';
      const result = await uploadFileToCloudinary(
        file.buffer,
        'crime-reports',
        resourceType
      );
      newMedia.push({
        url:      result.secure_url,
        fileType: file.mimetype.startsWith('video') ? 'video' : 'image',
        publicId: result.public_id,
      });
    }
    // Append to existing media
    updateData.$push = { mediaUrls: { $each: newMedia } };
  }

  const updatedReport = await CrimeReport.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  );

  await AuditLog.create({
    performedBy: req.user._id,
    action:      'report_updated',
    targetType:  'CrimeReport',
    targetId:    report._id,
    description: `Crime report updated: ${report.title}`,
    ipAddress:   req.ip,
    userAgent:   req.headers['user-agent'],
  });

  res.status(200).json(
    new ApiResponse(200, { report: updatedReport }, 'Report updated successfully')
  );
});

// ─── @desc    Delete a crime report
// ─── @route   DELETE /api/v1/crimes/:id
// ─── @access  Private (owner only)
const deleteReport = asyncHandler(async (req, res, next) => {
  const report = await CrimeReport.findById(req.params.id);

  if (!report) {
    return next(new ApiError('Crime report not found', 404));
  }

  // Only owner or admin can delete
  if (
    report.reportedBy?.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    return next(new ApiError('Not authorized to delete this report', 403));
  }

  // Delete media from cloudinary
  for (const media of report.mediaUrls) {
    if (media.publicId) {
      await cloudinary.uploader.destroy(media.publicId, {
        resource_type: media.fileType === 'video' ? 'video' : 'image',
      });
    }
  }

  await CrimeReport.findByIdAndDelete(req.params.id);

  await AuditLog.create({
    performedBy: req.user._id,
    action:      'report_deleted',
    targetType:  'CrimeReport',
    targetId:    report._id,
    description: `Crime report deleted: ${report.title}`,
    ipAddress:   req.ip,
    userAgent:   req.headers['user-agent'],
  });

  res.status(200).json(
    new ApiResponse(200, null, 'Report deleted successfully')
  );
});

// ─── @desc    Upvote / un-upvote a crime report
// ─── @route   POST /api/v1/crimes/:id/upvote
// ─── @access  Private
const upvoteReport = asyncHandler(async (req, res, next) => {
  const report = await CrimeReport.findById(req.params.id);

  if (!report) {
    return next(new ApiError('Crime report not found', 404));
  }

  const alreadyUpvoted = report.upvotes.includes(req.user._id);

  if (alreadyUpvoted) {
    // Remove upvote
    await CrimeReport.findByIdAndUpdate(req.params.id, {
      $pull: { upvotes: req.user._id },
    });
  } else {
    // Add upvote
    await CrimeReport.findByIdAndUpdate(req.params.id, {
      $addToSet: { upvotes: req.user._id },
    });
  }

  const updatedReport = await CrimeReport.findById(req.params.id);

  res.status(200).json(
    new ApiResponse(200, {
      upvoteCount:  updatedReport.upvotes.length,
      hasUpvoted:   !alreadyUpvoted,
    }, alreadyUpvoted ? 'Upvote removed' : 'Report upvoted successfully')
  );
});

// ─── @desc    Update report status (officer / admin)
// ─── @route   PATCH /api/v1/crimes/:id/status
// ─── @access  Officer, Admin
const updateReportStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;

  const allowedStatuses = ['pending', 'verified', 'investigating', 'resolved', 'rejected'];
  if (!allowedStatuses.includes(status)) {
    return next(new ApiError(`Status must be one of: ${allowedStatuses.join(', ')}`, 400));
  }

  const report = await CrimeReport.findById(req.params.id);

  if (!report) {
    return next(new ApiError('Crime report not found', 404));
  }

  const previousStatus = report.status;
  const updateData = { status };

  // Set verified info
  if (status === 'verified') {
    updateData.verifiedBy = req.user._id;
    updateData.verifiedAt = new Date();
  }

  // Set resolved time
  if (status === 'resolved') {
    updateData.resolvedAt = new Date();
  }

  const updatedReport = await CrimeReport.findByIdAndUpdate(
    req.params.id,
    { $set: updateData },
    { new: true }
  ).populate('reportedBy', 'fullName email');

  // Notify report owner about status change (if not anonymous)
  if (updatedReport.reportedBy && !updatedReport.isAnonymous) {
    const notifMessages = {
      verified:      'Your crime report has been verified by our team.',
      investigating: 'Your crime report is now under investigation.',
      resolved:      'Your crime report has been resolved.',
      rejected:      'Your crime report has been reviewed and rejected.',
    };

    if (notifMessages[status]) {
      await Notification.create({
        recipient: updatedReport.reportedBy._id,
        type:      `report_${status}`,
        title:     `Report ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message:   notifMessages[status],
        data: {
          reportId:  updatedReport._id,
          crimeType: updatedReport.crimeType,
        },
        channel: 'in_app',
        isSent:  true,
      });
    }

    // Emit socket notification
    const io = req.app.get('io');
    if (io) {
      io.emit(`notification_${updatedReport.reportedBy._id}`, {
        type:    `report_${status}`,
        message: notifMessages[status],
        reportId: updatedReport._id,
      });
    }
  }

  await AuditLog.create({
    performedBy: req.user._id,
    action:      `report_${status}`,
    targetType:  'CrimeReport',
    targetId:    report._id,
    description: `Report status updated to '${status}' by ${req.user.role}`,
    metadata: {
      before: {
        status: previousStatus,
      },
      after: {
        status,
      },
    },
    ipAddress:   req.ip,
    userAgent:   req.headers['user-agent'],
  });

  res.status(200).json(
    new ApiResponse(200, { report: updatedReport }, `Report marked as ${status}`)
  );
});

module.exports = {
  getAllReports,
  getNearbyReports,
  getHeatmapData,
  getReportById,
  createReport,
  updateReport,
  deleteReport,
  upvoteReport,
  updateReportStatus,
};