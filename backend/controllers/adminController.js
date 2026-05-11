const User         = require('../models/User');
const CrimeReport  = require('../models/CrimeReport');
const Notification = require('../models/Notification');
const AuditLog     = require('../models/AuditLog');
const ApiError     = require('../utils/apiError');
const ApiResponse  = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

// ─── Helper: Create Audit Log ─────────────────────────────────────────────────
const createAuditLog = async ({ performedBy, action, targetType, targetId, description, metadata = {}, req }) => {
  await AuditLog.create({
    performedBy,
    action,
    targetType,
    targetId,
    description,
    metadata,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });
};

// ─── @desc    Get all users with filters & pagination
// ─── @route   GET /api/v1/admin/users
// ─── @access  Admin
const getAllUsers = asyncHandler(async (req, res, next) => {
  const {
    page      = 1,
    limit     = 10,
    role,
    isActive,
    isVerified,
    search,
    sortBy    = 'createdAt',
    order     = 'desc',
  } = req.query;

  const filter = {};

  if (role) filter.role = role;
  if (isActive === 'true' || isActive === 'false') {
    filter.isActive = isActive === 'true';
  }
  if (isVerified === 'true' || isVerified === 'false') {
    filter.isVerified = isVerified === 'true';
  }

  // Search by name or email
  if (search) {
    filter.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { email:    { $regex: search, $options: 'i' } },
      { phone:    { $regex: search, $options: 'i' } },
    ];
  }

  const skip  = (Number(page) - 1) * Number(limit);
  const sort  = { [sortBy]: order === 'asc' ? 1 : -1 };
  const total = await User.countDocuments(filter);

  const users = await User
    .find(filter)
    .select('-password -refreshToken -passwordResetToken -passwordResetExpires')
    .sort(sort)
    .skip(skip)
    .limit(Number(limit));

  res.status(200).json(
    new ApiResponse(200, {
      users,
      pagination: {
        total,
        page:       Number(page),
        limit:      Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    }, 'Users fetched successfully')
  );
});

// ─── @desc    Get single user by ID
// ─── @route   GET /api/v1/admin/users/:id
// ─── @access  Admin
const getUserById = asyncHandler(async (req, res, next) => {
  const user = await User
    .findById(req.params.id)
    .select('-password -refreshToken -passwordResetToken -passwordResetExpires');

  if (!user) {
    return next(new ApiError('User not found', 404));
  }

  // Get user's report stats
  const reportStats = await CrimeReport.aggregate([
    { $match: { reportedBy: user._id } },
    {
      $group: {
        _id:      '$status',
        count:    { $sum: 1 },
      },
    },
  ]);

  res.status(200).json(
    new ApiResponse(200, { user, reportStats }, 'User fetched successfully')
  );
});

// ─── @desc    Update user role
// ─── @route   PATCH /api/v1/admin/users/:id/role
// ─── @access  Admin
const updateUserRole = asyncHandler(async (req, res, next) => {
  const { role } = req.body;

  if (!role) {
    return next(new ApiError('Role is required', 400));
  }

  const allowedRoles = ['citizen', 'officer', 'admin'];
  if (!allowedRoles.includes(role)) {
    return next(new ApiError(`Role must be one of: ${allowedRoles.join(', ')}`, 400));
  }

  // Prevent admin from changing their own role
  if (req.params.id === req.user._id.toString()) {
    return next(new ApiError('You cannot change your own role', 403));
  }

  const existingUser = await User.findById(req.params.id);

  if (!existingUser) {
    return next(new ApiError('User not found', 404));
  }

  const previousRole = existingUser.role;

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { $set: { role } },
    { new: true, runValidators: true }
  ).select('-password -refreshToken');

  await createAuditLog({
    performedBy: req.user._id,
    action:      'user_updated',
    targetType:  'User',
    targetId:    user._id,
    description: `Admin changed user role to '${role}'`,
    metadata: {
      before: { role: previousRole },
      after: { role: user.role },
    },
    req,
  });

  res.status(200).json(
    new ApiResponse(200, { user }, 'User role updated successfully')
  );
});

// ─── @desc    Toggle user active/inactive status
// ─── @route   PATCH /api/v1/admin/users/:id/status
// ─── @access  Admin
const toggleUserStatus = asyncHandler(async (req, res, next) => {
  // Prevent admin from deactivating themselves
  if (req.params.id === req.user._id.toString()) {
    return next(new ApiError('You cannot deactivate your own account', 403));
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ApiError('User not found', 404));
  }

  const previousStatus = user.isActive;
  user.isActive = !user.isActive;
  await user.save();

  await createAuditLog({
    performedBy: req.user._id,
    action:      'user_updated',
    targetType:  'User',
    targetId:    user._id,
    description: `Admin ${user.isActive ? 'activated' : 'deactivated'} user account`,
    metadata: {
      before: { isActive: previousStatus },
      after: { isActive: user.isActive },
    },
    req,
  });

  res.status(200).json(
    new ApiResponse(
      200,
      { isActive: user.isActive },
      `User account ${user.isActive ? 'activated' : 'deactivated'} successfully`
    )
  );
});

// ─── @desc    Hard delete user account
// ─── @route   DELETE /api/v1/admin/users/:id
// ─── @access  Admin
const deleteUser = asyncHandler(async (req, res, next) => {
  // Prevent admin from deleting themselves
  if (req.params.id === req.user._id.toString()) {
    return next(new ApiError('You cannot delete your own account', 403));
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ApiError('User not found', 404));
  }

  // Delete all reports by this user
  await CrimeReport.deleteMany({ reportedBy: user._id });

  // Delete all notifications for this user
  await Notification.deleteMany({ recipient: user._id });

  // Delete user
  await User.findByIdAndDelete(req.params.id);

  await createAuditLog({
    performedBy: req.user._id,
    action:      'user_deleted',
    targetType:  'User',
    targetId:    user._id,
    description: `Admin permanently deleted user: ${user.email}`,
    metadata: {
      before: {
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
      after: { deleted: true },
    },
    req,
  });

  res.status(200).json(
    new ApiResponse(200, null, 'User deleted successfully')
  );
});

// ─── @desc    Get all crime reports with filters & pagination
// ─── @route   GET /api/v1/admin/reports
// ─── @access  Admin
const getAllReports = asyncHandler(async (req, res, next) => {
  const {
    page       = 1,
    limit      = 10,
    status,
    crimeType,
    severity,
    isAnonymous,
    search,
    startDate,
    endDate,
    sortBy     = 'createdAt',
    order      = 'desc',
  } = req.query;

  const filter = {};

  if (status)                   filter.status      = status;
  if (crimeType)                filter.crimeType   = crimeType;
  if (severity)                 filter.severity    = Number(severity);
  if (isAnonymous !== undefined) filter.isAnonymous = isAnonymous === 'true';

  // Search in title or description
  if (search) {
    filter.$or = [
      { title:       { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  // Date range filter
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
    .populate('reportedBy', 'fullName email phone')
    .populate('verifiedBy', 'fullName email')
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

// ─── @desc    Hard delete a crime report
// ─── @route   DELETE /api/v1/admin/reports/:id
// ─── @access  Admin
const deleteReport = asyncHandler(async (req, res, next) => {
  const report = await CrimeReport.findById(req.params.id);

  if (!report) {
    return next(new ApiError('Report not found', 404));
  }

  await CrimeReport.findByIdAndDelete(req.params.id);

  await createAuditLog({
    performedBy: req.user._id,
    action:      'report_deleted',
    targetType:  'CrimeReport',
    targetId:    report._id,
    description: `Admin deleted crime report: ${report.title}`,
    metadata: {
      before: {
        title: report.title,
        status: report.status,
        severity: report.severity,
        crimeType: report.crimeType,
      },
      after: { deleted: true },
    },
    req,
  });

  res.status(200).json(
    new ApiResponse(200, null, 'Report deleted successfully')
  );
});

// ─── @desc    Get audit logs with filters & pagination
// ─── @route   GET /api/v1/admin/audit-logs
// ─── @access  Admin
const getAuditLogs = asyncHandler(async (req, res, next) => {
  const {
    page       = 1,
    limit      = 20,
    action,
    targetType,
    performedBy,
    startDate,
    endDate,
    sortBy     = 'createdAt',
    order      = 'desc',
  } = req.query;

  const filter = {};

  if (action)      filter.action     = action;
  if (targetType)  filter.targetType = targetType;
  if (performedBy) filter.performedBy = performedBy;

  // Date range
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate)   filter.createdAt.$lte = new Date(endDate);
  }

  const skip  = (Number(page) - 1) * Number(limit);
  const sort  = { [sortBy]: order === 'asc' ? 1 : -1 };
  const total = await AuditLog.countDocuments(filter);

  const logs = await AuditLog
    .find(filter)
    .populate('performedBy', 'fullName email role')
    .sort(sort)
    .skip(skip)
    .limit(Number(limit));

  res.status(200).json(
    new ApiResponse(200, {
      logs,
      pagination: {
        total,
        page:       Number(page),
        limit:      Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    }, 'Audit logs fetched successfully')
  );
});

// ─── @desc    Get admin dashboard stats
// ─── @route   GET /api/v1/admin/stats
// ─── @access  Admin
const getDashboardStats = asyncHandler(async (req, res, next) => {
  const { period = '7' } = req.query;  // days

  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - Number(period));

  // Run all queries in parallel for speed
  const [
    totalUsers,
    newUsers,
    activeUsers,
    totalReports,
    newReports,
    reportsByStatus,
    reportsByType,
    reportsBySeverity,
    totalNotifications,
  ] = await Promise.all([

    // Total users
    User.countDocuments(),

    // New users in period
    User.countDocuments({ createdAt: { $gte: daysAgo } }),

    // Active users
    User.countDocuments({ isActive: true }),

    // Total reports
    CrimeReport.countDocuments(),

    // New reports in period
    CrimeReport.countDocuments({ createdAt: { $gte: daysAgo } }),

    // Reports grouped by status
    CrimeReport.aggregate([
      {
        $group: {
          _id:   '$status',
          count: { $sum: 1 },
        },
      },
    ]),

    // Reports grouped by crime type
    CrimeReport.aggregate([
      {
        $group: {
          _id:   '$crimeType',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },              // top 5 crime types
    ]),

    // Reports grouped by severity
    CrimeReport.aggregate([
      {
        $group: {
          _id:   '$severity',
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    // Total notifications sent
    Notification.countDocuments(),
  ]);

  // Daily report trend for the period
  const dailyTrend = await CrimeReport.aggregate([
    {
      $match: { createdAt: { $gte: daysAgo } },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // User role breakdown
  const usersByRole = await User.aggregate([
    {
      $group: {
        _id:   '$role',
        count: { $sum: 1 },
      },
    },
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      overview: {
        totalUsers,
        newUsers,
        activeUsers,
        totalReports,
        newReports,
        totalNotifications,
      },
      reportsByStatus,
      reportsByType,
      reportsBySeverity,
      usersByRole,
      dailyTrend,
      period: Number(period),
    }, 'Dashboard stats fetched successfully')
  );
});

module.exports = {
  getAllUsers,
  getUserById,
  updateUserRole,
  toggleUserStatus,
  deleteUser,
  getAllReports,
  deleteReport,
  getAuditLogs,
  getDashboardStats,
};