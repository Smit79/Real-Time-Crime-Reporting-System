const AlertSubscription = require('../models/AlertSubscription');
const Notification      = require('../models/Notification');
const AuditLog          = require('../models/AuditLog');
const ApiError          = require('../utils/apiError');
const ApiResponse       = require('../utils/apiResponse');
const asyncHandler      = require('../utils/asyncHandler');

// ─── Helper: Validate coordinates ────────────────────────────────────────────
const validateCoordinates = (longitude, latitude) => {
  const lng = Number(longitude);
  const lat = Number(latitude);

  if (isNaN(lng) || isNaN(lat)) {
    return { valid: false, message: 'Coordinates must be valid numbers' };
  }
  if (lat < -90 || lat > 90) {
    return { valid: false, message: 'Latitude must be between -90 and 90' };
  }
  if (lng < -180 || lng > 180) {
    return { valid: false, message: 'Longitude must be between -180 and 180' };
  }
  return { valid: true, lng, lat };
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

// ─── @desc    Get all subscriptions of logged in user
// ─── @route   GET /api/v1/alerts
// ─── @access  Private
const getMySubscriptions = asyncHandler(async (req, res, next) => {
  const {
    isActive,
    page  = 1,
    limit = 10,
  } = req.query;

  const filter = { user: req.user._id };
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  const skip  = (Number(page) - 1) * Number(limit);
  const total = await AlertSubscription.countDocuments(filter);

  const subscriptions = await AlertSubscription
    .find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  // Attach unread alert count per subscription
  const subscriptionsWithCount = await Promise.all(
    subscriptions.map(async (sub) => {
      const unreadCount = await Notification.countDocuments({
        recipient: req.user._id,
        type:      'crime_alert',
        isRead:    false,
      });
      return { ...sub.toObject(), unreadAlerts: unreadCount };
    })
  );

  res.status(200).json(
    new ApiResponse(200, {
      subscriptions: subscriptionsWithCount,
      pagination: {
        total,
        page:       Number(page),
        limit:      Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    }, 'Subscriptions fetched successfully')
  );
});

// ─── @desc    Get single subscription by ID
// ─── @route   GET /api/v1/alerts/:id
// ─── @access  Private
const getSubscriptionById = asyncHandler(async (req, res, next) => {
  const subscription = await AlertSubscription.findById(req.params.id);

  if (!subscription) {
    return next(new ApiError('Subscription not found', 404));
  }

  // Ensure subscription belongs to requesting user
  if (subscription.user.toString() !== req.user._id.toString()) {
    return next(new ApiError('Not authorized to access this subscription', 403));
  }

  // Get recent alerts received for this subscription zone
  const recentAlerts = await Notification
    .find({
      recipient: req.user._id,
      type:      'crime_alert',
    })
    .sort({ createdAt: -1 })
    .limit(5);

  res.status(200).json(
    new ApiResponse(200, {
      subscription,
      recentAlerts,
    }, 'Subscription fetched successfully')
  );
});

// ─── @desc    Create new alert subscription
// ─── @route   POST /api/v1/alerts
// ─── @access  Private
const createSubscription = asyncHandler(async (req, res, next) => {
  const {
    label,
    longitude,
    latitude,
    radiusKm,
    crimeTypes,
    minSeverity,
    channels,
  } = req.body;

  // Validate coordinates
  if (longitude === undefined || longitude === null || latitude === undefined || latitude === null) {
    return next(new ApiError('Longitude and latitude are required', 400));
  }

  const coordCheck = validateCoordinates(longitude, latitude);
  if (!coordCheck.valid) {
    return next(new ApiError(coordCheck.message, 400));
  }

  // Validate radius
  const radius = Number(radiusKm) || 5;
  if (radius < 1 || radius > 50) {
    return next(new ApiError('Radius must be between 1 and 50 km', 400));
  }

  // Validate crime types if provided
  const allowedTypes = [
    'theft', 'robbery', 'assault', 'murder', 'kidnapping',
    'vandalism', 'fraud', 'harassment', 'drug_related',
    'accident', 'fire', 'other',
  ];

  let parsedCrimeTypes = [];
  if (crimeTypes) {
    parsedCrimeTypes = Array.isArray(crimeTypes)
      ? crimeTypes
      : JSON.parse(crimeTypes);

    const invalidTypes = parsedCrimeTypes.filter((t) => !allowedTypes.includes(t));
    if (invalidTypes.length > 0) {
      return next(new ApiError(`Invalid crime types: ${invalidTypes.join(', ')}`, 400));
    }
  }

  // Validate severity
  const severity = Number(minSeverity) || 1;
  if (severity < 1 || severity > 5) {
    return next(new ApiError('Min severity must be between 1 and 5', 400));
  }

  // Limit subscriptions per user (max 10)
  const existingCount = await AlertSubscription.countDocuments({
    user: req.user._id,
  });
  if (existingCount >= 10) {
    return next(new ApiError('You can have a maximum of 10 alert subscriptions', 400));
  }

  // Parse channels if sent as string
  let parsedChannels = { push: true, email: false, in_app: true };
  if (channels) {
    try {
      parsedChannels = typeof channels === 'string'
        ? JSON.parse(channels)
        : channels;
    } catch {
      return next(new ApiError('Invalid channels format', 400));
    }
  }

  const subscription = await AlertSubscription.create({
    user:     req.user._id,
    label:    label || 'My Area',
    location: {
      type:        'Point',
      coordinates: [coordCheck.lng, coordCheck.lat],
    },
    radiusKm:    radius,
    crimeTypes:  parsedCrimeTypes,
    minSeverity: severity,
    channels:    parsedChannels,
    isActive:    true,
  });

  // Audit log
  await AuditLog.create({
    performedBy: req.user._id,
    action:      'admin_action',
    targetType:  'System',
    targetId:    subscription._id,
    description: `User created alert subscription: ${subscription.label}`,
    ipAddress:   req.ip,
    userAgent:   req.headers['user-agent'],
  });

  // Emit socket event — join the subscription zone room
  const io = req.app.get('io');
  if (io) {
    io.emit(`join_zone_${req.user._id}`, {
      zoneId:       `zone_${subscription._id}`,
      subscription: subscription._id,
    });
  }

  res.status(201).json(
    new ApiResponse(201, { subscription }, 'Alert subscription created successfully')
  );
});

// ─── @desc    Update alert subscription
// ─── @route   PATCH /api/v1/alerts/:id
// ─── @access  Private
const updateSubscription = asyncHandler(async (req, res, next) => {
  const subscription = await AlertSubscription.findById(req.params.id);

  if (!subscription) {
    return next(new ApiError('Subscription not found', 404));
  }

  // Ownership check
  if (subscription.user.toString() !== req.user._id.toString()) {
    return next(new ApiError('Not authorized to update this subscription', 403));
  }

  const {
    label,
    longitude,
    latitude,
    radiusKm,
    crimeTypes,
    minSeverity,
    channels,
  } = req.body;

  const updateData = {};

  if (label) updateData.label = label;

  // Update location if new coordinates provided
  if (
    longitude !== undefined && longitude !== null &&
    latitude !== undefined && latitude !== null
  ) {
    const coordCheck = validateCoordinates(longitude, latitude);
    if (!coordCheck.valid) {
      return next(new ApiError(coordCheck.message, 400));
    }
    updateData.location = {
      type:        'Point',
      coordinates: [coordCheck.lng, coordCheck.lat],
    };
  }

  // Update radius
  if (radiusKm) {
    const radius = Number(radiusKm);
    if (radius < 1 || radius > 50) {
      return next(new ApiError('Radius must be between 1 and 50 km', 400));
    }
    updateData.radiusKm = radius;
  }

  // Update crime types
  if (crimeTypes !== undefined) {
    const allowedTypes = [
      'theft', 'robbery', 'assault', 'murder', 'kidnapping',
      'vandalism', 'fraud', 'harassment', 'drug_related',
      'accident', 'fire', 'other',
    ];
    const parsed = Array.isArray(crimeTypes)
      ? crimeTypes
      : JSON.parse(crimeTypes);

    const invalidTypes = parsed.filter((t) => !allowedTypes.includes(t));
    if (invalidTypes.length > 0) {
      return next(new ApiError(`Invalid crime types: ${invalidTypes.join(', ')}`, 400));
    }
    updateData.crimeTypes = parsed;
  }

  // Update severity
  if (minSeverity) {
    const severity = Number(minSeverity);
    if (severity < 1 || severity > 5) {
      return next(new ApiError('Min severity must be between 1 and 5', 400));
    }
    updateData.minSeverity = severity;
  }

  // Update channels
  if (channels) {
    try {
      updateData.channels = typeof channels === 'string'
        ? JSON.parse(channels)
        : channels;
    } catch {
      return next(new ApiError('Invalid channels format', 400));
    }
  }

  const updated = await AlertSubscription.findByIdAndUpdate(
    req.params.id,
    { $set: updateData },
    { new: true, runValidators: true }
  );

  res.status(200).json(
    new ApiResponse(200, { subscription: updated }, 'Subscription updated successfully')
  );
});

// ─── @desc    Delete alert subscription
// ─── @route   DELETE /api/v1/alerts/:id
// ─── @access  Private
const deleteSubscription = asyncHandler(async (req, res, next) => {
  const subscription = await AlertSubscription.findById(req.params.id);

  if (!subscription) {
    return next(new ApiError('Subscription not found', 404));
  }

  // Ownership check
  if (subscription.user.toString() !== req.user._id.toString()) {
    return next(new ApiError('Not authorized to delete this subscription', 403));
  }

  await AlertSubscription.findByIdAndDelete(req.params.id);

  // Audit log
  await AuditLog.create({
    performedBy: req.user._id,
    action:      'admin_action',
    targetType:  'System',
    targetId:    subscription._id,
    description: `User deleted alert subscription: ${subscription.label}`,
    ipAddress:   req.ip,
    userAgent:   req.headers['user-agent'],
  });

  // Emit socket event — leave the zone room
  const io = req.app.get('io');
  if (io) {
    io.emit(`leave_zone_${req.user._id}`, {
      zoneId: `zone_${subscription._id}`,
    });
  }

  res.status(200).json(
    new ApiResponse(200, null, 'Subscription deleted successfully')
  );
});

// ─── @desc    Toggle subscription active/inactive
// ─── @route   PATCH /api/v1/alerts/:id/toggle
// ─── @access  Private
const toggleSubscription = asyncHandler(async (req, res, next) => {
  const subscription = await AlertSubscription.findById(req.params.id);

  if (!subscription) {
    return next(new ApiError('Subscription not found', 404));
  }

  // Ownership check
  if (subscription.user.toString() !== req.user._id.toString()) {
    return next(new ApiError('Not authorized to toggle this subscription', 403));
  }

  subscription.isActive = !subscription.isActive;
  await subscription.save();

  // Emit socket event
  const io = req.app.get('io');
  if (io) {
    const event = subscription.isActive
      ? `join_zone_${req.user._id}`
      : `leave_zone_${req.user._id}`;

    io.emit(event, { zoneId: `zone_${subscription._id}` });
  }

  res.status(200).json(
    new ApiResponse(
      200,
      { isActive: subscription.isActive },
      `Subscription ${subscription.isActive ? 'activated' : 'paused'} successfully`
    )
  );
});

module.exports = {
  getMySubscriptions,
  getSubscriptionById,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  toggleSubscription,
};