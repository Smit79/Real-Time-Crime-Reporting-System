const User             = require('../models/User');
const CrimeReport      = require('../models/CrimeReport');
const Notification     = require('../models/Notification');
const AlertSubscription = require('../models/AlertSubscription');
const AuditLog         = require('../models/AuditLog');
const ApiError         = require('../utils/apiError');
const ApiResponse      = require('../utils/apiResponse');
const asyncHandler     = require('../utils/asyncHandler');
const cloudinary       = require('../config/cloudinary');

// ─── Helper: Upload avatar to Cloudinary ─────────────────────────────────────
const uploadToCloudinary = async (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error) reject(new ApiError('Image upload failed', 500));
        else resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
};

// ─── @desc    Get logged in user profile
// ─── @route   GET /api/v1/users/profile
// ─── @access  Private
const getProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return next(new ApiError('User not found', 404));
  }

  res.status(200).json(
    new ApiResponse(200, { user }, 'Profile fetched successfully')
  );
});

// ─── @desc    Update logged in user profile
// ─── @route   PATCH /api/v1/users/profile
// ─── @access  Private
const updateProfile = asyncHandler(async (req, res, next) => {
  const { fullName, phone } = req.body;

  // Build update object — only allow safe fields
  const updateData = {};
  if (fullName) updateData.fullName = fullName;
  if (phone)    updateData.phone    = phone;

  // Handle avatar upload
  if (req.file) {
    const user = await User.findById(req.user._id);

    // Delete old avatar from cloudinary if exists
    if (user.avatar) {
      const publicId = user.avatar.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`avatars/${publicId}`);
    }

    const result = await uploadToCloudinary(req.file.buffer, 'avatars');
    updateData.avatar = result.secure_url;
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updateData },
    { new: true, runValidators: true }
  );

  // Audit log
  await AuditLog.create({
    performedBy: req.user._id,
    action:      'user_updated',
    targetType:  'User',
    targetId:    req.user._id,
    description: 'User updated their profile',
    ipAddress:   req.ip,
    userAgent:   req.headers['user-agent'],
  });

  res.status(200).json(
    new ApiResponse(200, { user: updatedUser }, 'Profile updated successfully')
  );
});

// ─── @desc    Delete logged in user account
// ─── @route   DELETE /api/v1/users/profile
// ─── @access  Private
const deleteAccount = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return next(new ApiError('User not found', 404));
  }

  // Soft delete — just deactivate account
  user.isActive = false;
  await user.save();

  // Audit log
  await AuditLog.create({
    performedBy: req.user._id,
    action:      'user_deleted',
    targetType:  'User',
    targetId:    req.user._id,
    description: 'User deactivated their account',
    ipAddress:   req.ip,
    userAgent:   req.headers['user-agent'],
  });

  // Clear cookie
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');

  res.status(200).json(
    new ApiResponse(200, null, 'Account deactivated successfully')
  );
});

// ─── @desc    Get all reports submitted by logged in user
// ─── @route   GET /api/v1/users/my-reports
// ─── @access  Private
const getMyReports = asyncHandler(async (req, res, next) => {
  const {
    page     = 1,
    limit    = 10,
    status,
    crimeType,
    sortBy   = 'createdAt',
    order    = 'desc',
  } = req.query;

  const filter = { reportedBy: req.user._id };
  if (status)    filter.status    = status;
  if (crimeType) filter.crimeType = crimeType;

  const skip  = (Number(page) - 1) * Number(limit);
  const sort  = { [sortBy]: order === 'asc' ? 1 : -1 };
  const total = await CrimeReport.countDocuments(filter);

  const reports = await CrimeReport
    .find(filter)
    .sort(sort)
    .skip(skip)
    .limit(Number(limit))
    .populate('verifiedBy', 'fullName email');

  res.status(200).json(
    new ApiResponse(200, {
      reports,
      pagination: {
        total,
        page:       Number(page),
        limit:      Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    }, 'My reports fetched successfully')
  );
});

// ─── @desc    Get all notifications for logged in user
// ─── @route   GET /api/v1/users/my-notifications
// ─── @access  Private
const getMyNotifications = asyncHandler(async (req, res, next) => {
  const {
    page   = 1,
    limit  = 20,
    isRead,
    type,
  } = req.query;

  const filter = { recipient: req.user._id };
  if (isRead !== undefined) filter.isRead = isRead === 'true';
  if (type)                 filter.type   = type;

  const skip  = (Number(page) - 1) * Number(limit);
  const total = await Notification.countDocuments(filter);

  const notifications = await Notification
    .find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  // Unread count
  const unreadCount = await Notification.countDocuments({
    recipient: req.user._id,
    isRead:    false,
  });

  res.status(200).json(
    new ApiResponse(200, {
      notifications,
      unreadCount,
      pagination: {
        total,
        page:       Number(page),
        limit:      Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    }, 'Notifications fetched successfully')
  );
});

// ─── @desc    Mark notifications as read
// ─── @route   PATCH /api/v1/users/notifications/read
// ─── @access  Private
const markNotificationsRead = asyncHandler(async (req, res, next) => {
  const { notificationIds } = req.body;  // array of IDs, or empty to mark all

  const filter = { recipient: req.user._id, isRead: false };

  // If specific IDs provided, only mark those
  if (notificationIds?.length) {
    filter._id = { $in: notificationIds };
  }

  await Notification.updateMany(filter, {
    $set: { isRead: true, readAt: new Date() },
  });

  res.status(200).json(
    new ApiResponse(200, null, 'Notifications marked as read')
  );
});

// ─── @desc    Update user's current location
// ─── @route   PATCH /api/v1/users/location
// ─── @access  Private
const updateLocation = asyncHandler(async (req, res, next) => {
  const { longitude, latitude } = req.body;

  if (longitude === undefined || longitude === null || latitude === undefined || latitude === null) {
    return next(new ApiError('Longitude and latitude are required', 400));
  }

  const lng = Number(longitude);
  const lat = Number(latitude);

  if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
    return next(new ApiError('Invalid coordinates provided', 400));
  }

  const updatedUser = await User.findByIdAndUpdate(req.user._id, {
    $set: {
      location: {
        type:        'Point',
        coordinates: [lng, lat],
      },
    },
  }, { new: true }).select('location');

  // Keep one default location-based alert subscription in sync with profile location.
  await AlertSubscription.findOneAndUpdate(
    {
      user: req.user._id,
      label: 'My Current Location',
    },
    {
      $set: {
        location: {
          type: 'Point',
          coordinates: [lng, lat],
        },
        radiusKm: 5,
        crimeTypes: [],
        minSeverity: 1,
        isActive: true,
        channels: {
          push: true,
          email: false,
          in_app: true,
        },
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  res.status(200).json(
    new ApiResponse(200, { user: updatedUser }, 'Location updated successfully')
  );
});

// ─── @desc    Update Firebase FCM token for push notifications
// ─── @route   PATCH /api/v1/users/fcm-token
// ─── @access  Private
const updateFcmToken = asyncHandler(async (req, res, next) => {
  const { fcmToken } = req.body;

  if (!fcmToken) {
    return next(new ApiError('FCM token is required', 400));
  }

  await User.findByIdAndUpdate(req.user._id, {
    $set: { fcmToken },
  });

  res.status(200).json(
    new ApiResponse(200, null, 'FCM token updated successfully')
  );
});

module.exports = {
  getProfile,
  updateProfile,
  deleteAccount,
  getMyReports,
  getMyNotifications,
  markNotificationsRead,
  updateLocation,
  updateFcmToken,
};