const CrimeReport  = require('../models/CrimeReport');
const User         = require('../models/User');
const Notification = require('../models/Notification');
const ApiError     = require('../utils/apiError');
const ApiResponse  = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

// ─── Helper: Get date range from period ──────────────────────────────────────
const getDateRange = (period = 30) => {
  const endDate   = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - Number(period));
  return { startDate, endDate };
};

// ─── Helper: Format bytes to MB ──────────────────────────────────────────────
const formatPeriodLabel = (period) => {
  if (period <= 1)  return 'Today';
  if (period <= 7)  return 'Last 7 days';
  if (period <= 30) return 'Last 30 days';
  if (period <= 90) return 'Last 3 months';
  return `Last ${period} days`;
};

// ─── @desc    Get heatmap data (public)
// ─── @route   GET /api/v1/analytics/heatmap
// ─── @access  Public
const getHeatmap = asyncHandler(async (req, res, next) => {
  const {
    period    = 30,
    crimeType,
    severity,
    status,
    swLat,              // bounding box — south west latitude
    swLng,              // bounding box — south west longitude
    neLat,              // bounding box — north east latitude
    neLng,              // bounding box — north east longitude
  } = req.query;

  const { startDate } = getDateRange(period);

  const matchFilter = {
    createdAt: { $gte: startDate },
  };

  if (crimeType) matchFilter.crimeType = crimeType;
  if (severity)  matchFilter.severity  = Number(severity);
  if (status)    matchFilter.status    = status;

  // Optional bounding box filter (for map viewport)
  if (swLat && swLng && neLat && neLng) {
    matchFilter.location = {
      $geoWithin: {
        $box: [
          [Number(swLng), Number(swLat)],
          [Number(neLng), Number(neLat)],
        ],
      },
    };
  }

  const heatmapData = await CrimeReport.aggregate([
    { $match: matchFilter },
    {
      $project: {
        lat:       { $arrayElemAt: ['$location.coordinates', 1] },
        lng:       { $arrayElemAt: ['$location.coordinates', 0] },
        weight:    '$severity',
        crimeType: 1,
        status:    1,
        createdAt: 1,
      },
    },
  ]);

  // Group points by crime type for frontend filtering
  const pointsByType = {};
  heatmapData.forEach((point) => {
    if (!pointsByType[point.crimeType]) {
      pointsByType[point.crimeType] = [];
    }
    pointsByType[point.crimeType].push({
      lat:    point.lat,
      lng:    point.lng,
      weight: point.weight,
    });
  });

  res.status(200).json(
    new ApiResponse(200, {
      points:       heatmapData,
      pointsByType,
      total:        heatmapData.length,
      period:       Number(period),
      periodLabel:  formatPeriodLabel(period),
    }, 'Heatmap data fetched successfully')
  );
});

// ─── @desc    Get summary stats (public)
// ─── @route   GET /api/v1/analytics/summary
// ─── @access  Public
const getSummaryStats = asyncHandler(async (req, res, next) => {
  const { period = 30 } = req.query;
  const { startDate }   = getDateRange(period);

  const [
    totalReports,
    reportsInPeriod,
    verifiedReports,
    resolvedReports,
    pendingReports,
    topCrimeTypes,
  ] = await Promise.all([

    // All time total
    CrimeReport.countDocuments(),

    // Total in period
    CrimeReport.countDocuments({ createdAt: { $gte: startDate } }),

    // Verified
    CrimeReport.countDocuments({ status: 'verified' }),

    // Resolved
    CrimeReport.countDocuments({ status: 'resolved' }),

    // Pending
    CrimeReport.countDocuments({ status: 'pending' }),

    // Top 5 crime types all time
    CrimeReport.aggregate([
      { $group: { _id: '$crimeType', count: { $sum: 1 } } },
      { $sort:  { count: -1 } },
      { $limit: 5 },
      { $project: { crimeType: '$_id', count: 1, _id: 0 } },
    ]),
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      totalReports,
      reportsInPeriod,
      verifiedReports,
      resolvedReports,
      pendingReports,
      topCrimeTypes,
      period:      Number(period),
      periodLabel: formatPeriodLabel(period),
    }, 'Summary stats fetched successfully')
  );
});

// ─── @desc    Get crime trends over time
// ─── @route   GET /api/v1/analytics/trends
// ─── @access  Private
const getTrends = asyncHandler(async (req, res, next) => {
  const {
    period    = 30,
    crimeType,
    groupBy   = 'day',    // day | week | month
  } = req.query;

  const { startDate } = getDateRange(period);

  const matchFilter = { createdAt: { $gte: startDate } };
  if (crimeType) matchFilter.crimeType = crimeType;

  // Date format based on groupBy
  const dateFormats = {
    day:   '%Y-%m-%d',
    week:  '%Y-W%V',
    month: '%Y-%m',
  };

  const dateFormat = dateFormats[groupBy] || dateFormats.day;

  const trends = await CrimeReport.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: {
          date:      { $dateToString: { format: dateFormat, date: '$createdAt' } },
          crimeType: '$crimeType',
        },
        count:       { $sum: 1 },
        avgSeverity: { $avg: '$severity' },
      },
    },
    { $sort: { '_id.date': 1 } },
    {
      $group: {
        _id:    '$_id.date',
        total:  { $sum: '$count' },
        crimes: {
          $push: {
            crimeType:   '$_id.crimeType',
            count:       '$count',
            avgSeverity: { $round: ['$avgSeverity', 1] },
          },
        },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        date:   '$_id',
        total:  1,
        crimes: 1,
        _id:    0,
      },
    },
  ]);

  // Overall trend direction (up / down / stable)
  let trendDirection = 'stable';
  if (trends.length >= 2) {
    const firstHalf  = trends.slice(0, Math.floor(trends.length / 2));
    const secondHalf = trends.slice(Math.floor(trends.length / 2));
    const firstAvg   = firstHalf.reduce((s, d)  => s + d.total, 0) / firstHalf.length;
    const secondAvg  = secondHalf.reduce((s, d) => s + d.total, 0) / secondHalf.length;
    if (secondAvg > firstAvg * 1.1)      trendDirection = 'increasing';
    else if (secondAvg < firstAvg * 0.9) trendDirection = 'decreasing';
  }

  res.status(200).json(
    new ApiResponse(200, {
      trends,
      trendDirection,
      period:      Number(period),
      periodLabel: formatPeriodLabel(period),
      groupBy,
    }, 'Crime trends fetched successfully')
  );
});

// ─── @desc    Get crime breakdown by type
// ─── @route   GET /api/v1/analytics/by-type
// ─── @access  Private
const getByType = asyncHandler(async (req, res, next) => {
  const { period = 30 } = req.query;
  const { startDate }   = getDateRange(period);

  const byType = await CrimeReport.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id:            '$crimeType',
        count:          { $sum: 1 },
        avgSeverity:    { $avg: '$severity' },
        resolved:       { $sum: { $cond: [{ $eq: ['$status', 'resolved']  }, 1, 0] } },
        verified:       { $sum: { $cond: [{ $eq: ['$status', 'verified']  }, 1, 0] } },
        pending:        { $sum: { $cond: [{ $eq: ['$status', 'pending']   }, 1, 0] } },
        investigating:  { $sum: { $cond: [{ $eq: ['$status', 'investigating'] }, 1, 0] } },
        rejected:       { $sum: { $cond: [{ $eq: ['$status', 'rejected']  }, 1, 0] } },
        anonymous:      { $sum: { $cond: ['$isAnonymous', 1, 0] } },
      },
    },
    { $sort: { count: -1 } },
    {
      $project: {
        crimeType:     '$_id',
        count:         1,
        avgSeverity:   { $round: ['$avgSeverity', 1] },
        resolved:      1,
        verified:      1,
        pending:       1,
        investigating: 1,
        rejected:      1,
        anonymous:     1,
        resolutionRate: {
          $round: [
            {
              $multiply: [
                { $divide: ['$resolved', { $max: ['$count', 1] }] },
                100,
              ],
            },
            1,
          ],
        },
        _id: 0,
      },
    },
  ]);

  // Total for percentage calculation
  const totalInPeriod = byType.reduce((sum, t) => sum + t.count, 0);

  const byTypeWithPercent = byType.map((t) => ({
    ...t,
    percentage: totalInPeriod > 0
      ? Number(((t.count / totalInPeriod) * 100).toFixed(1))
      : 0,
  }));

  res.status(200).json(
    new ApiResponse(200, {
      byType:      byTypeWithPercent,
      total:       totalInPeriod,
      period:      Number(period),
      periodLabel: formatPeriodLabel(period),
    }, 'Crime breakdown by type fetched successfully')
  );
});

// ─── @desc    Get crime breakdown by area
// ─── @route   GET /api/v1/analytics/by-area
// ─── @access  Private
const getByArea = asyncHandler(async (req, res, next) => {
  const {
    period  = 30,
    lat,
    lng,
    radius  = 50,         // km
    limit   = 10,
  } = req.query;

  const { startDate } = getDateRange(period);

  const matchFilter = { createdAt: { $gte: startDate } };

  // If coords given — limit to that radius
  if (lat && lng) {
    matchFilter.location = {
      $geoWithin: {
        $centerSphere: [
          [Number(lng), Number(lat)],
          Number(radius) / 6371,
        ],
      },
    };
  }

  const byArea = await CrimeReport.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: {
          city:  '$address.city',
          state: '$address.state',
        },
        count:       { $sum: 1 },
        avgSeverity: { $avg: '$severity' },
        crimeTypes:  { $addToSet: '$crimeType' },
        resolved:    { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
        coordinates: { $first: '$location.coordinates' },
      },
    },
    { $sort:  { count: -1 } },
    { $limit: Number(limit) },
    {
      $project: {
        city:        '$_id.city',
        state:       '$_id.state',
        count:       1,
        avgSeverity: { $round: ['$avgSeverity', 1] },
        crimeTypes:  1,
        resolved:    1,
        coordinates: 1,
        resolutionRate: {
          $round: [
            {
              $multiply: [
                { $divide: ['$resolved', { $max: ['$count', 1] }] },
                100,
              ],
            },
            1,
          ],
        },
        _id: 0,
      },
    },
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      byArea,
      period:      Number(period),
      periodLabel: formatPeriodLabel(period),
    }, 'Crime breakdown by area fetched successfully')
  );
});

// ─── @desc    Get detailed analytics report (officer / admin)
// ─── @route   GET /api/v1/analytics/detailed
// ─── @access  Officer, Admin
const getDetailedReport = asyncHandler(async (req, res, next) => {
  const { period = 30 } = req.query;
  const { startDate }   = getDateRange(period);

  // Run all aggregations in parallel
  const [
    totalUsers,
    newUsers,
    activeUsers,
    totalReports,
    newReports,
    reportsByStatus,
    reportsBySeverity,
    reportsByHour,
    reportsByDayOfWeek,
    avgResolutionTime,
    topReporters,
    anonymousVsNamed,
    notificationStats,
    recentActivity,
  ] = await Promise.all([

    // Total users
    User.countDocuments(),

    // New users in period
    User.countDocuments({ createdAt: { $gte: startDate } }),

    // Active users
    User.countDocuments({ isActive: true }),

    // Total reports all time
    CrimeReport.countDocuments(),

    // New reports in period
    CrimeReport.countDocuments({ createdAt: { $gte: startDate } }),

    // Reports by status
    CrimeReport.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { status: '$_id', count: 1, _id: 0 } },
    ]),

    // Reports by severity
    CrimeReport.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$severity', count: { $sum: 1 } } },
      { $sort:  { _id: 1 } },
      { $project: { severity: '$_id', count: 1, _id: 0 } },
    ]),

    // Reports by hour of day (peak hours)
    CrimeReport.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $addFields: {
          analyticsTime: { $ifNull: ['$incidentTime', '$createdAt'] },
        },
      },
      {
        $group: {
          _id: {
            $hour: {
              date: '$analyticsTime',
              timezone: 'Asia/Kolkata',
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort:    { _id: 1 } },
      { $project: { hour: '$_id', count: 1, _id: 0 } },
    ]),

    // Reports by day of week
    CrimeReport.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $addFields: {
          analyticsTime: { $ifNull: ['$incidentTime', '$createdAt'] },
        },
      },
      {
        $group: {
          _id: {
            $dayOfWeek: {
              date: '$analyticsTime',
              timezone: 'Asia/Kolkata',
            },
          },  // 1=Sun, 7=Sat
          count: { $sum: 1 },
        },
      },
      { $sort:    { _id: 1 } },
      { $project: { dayOfWeek: '$_id', count: 1, _id: 0 } },
    ]),

    // Avg resolution time (hours)
    CrimeReport.aggregate([
      {
        $match: {
          status:     'resolved',
          resolvedAt: { $exists: true },
          createdAt:  { $gte: startDate },
        },
      },
      {
        $project: {
          resolutionHours: {
            $max: [
              0,
              {
                $divide: [
                  { $subtract: ['$resolvedAt', '$createdAt'] },
                  1000 * 60 * 60,                         // ms to hours
                ],
              },
            ],
          },
        },
      },
      {
        $group: {
          _id:             null,
          avgHours:        { $avg: '$resolutionHours' },
          minHours:        { $min: '$resolutionHours' },
          maxHours:        { $max: '$resolutionHours' },
          totalResolved:   { $sum: 1 },
        },
      },
      {
        $project: {
          avgHours:      { $round: ['$avgHours', 1] },
          minHours:      { $round: ['$minHours', 1] },
          maxHours:      { $round: ['$maxHours', 1] },
          totalResolved: 1,
          _id:           0,
        },
      },
    ]),

    // Top 5 reporters (non-anonymous)
    CrimeReport.aggregate([
      {
        $match: {
          isAnonymous: false,
          createdAt:   { $gte: startDate },
        },
      },
      {
        $group: {
          _id:   '$reportedBy',
          count: { $sum: 1 },
        },
      },
      { $sort:  { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from:         'users',
          localField:   '_id',
          foreignField: '_id',
          as:           'user',
          pipeline: [
            { $project: { fullName: 1, email: 1, avatar: 1, role: 1 } },
          ],
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          count: 1,
          user:  1,
          _id:   0,
        },
      },
    ]),

    // Anonymous vs named reports
    CrimeReport.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id:   '$isAnonymous',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          type:  { $cond: ['$_id', 'anonymous', 'named'] },
          count: 1,
          _id:   0,
        },
      },
    ]),

    // Notification stats
    Notification.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id:       '$type',
          total:     { $sum: 1 },
          readCount: { $sum: { $cond: ['$isRead', 1, 0] } },
        },
      },
      {
        $project: {
          type:     '$_id',
          total:    1,
          readCount: 1,
          readRate: {
            $round: [
              {
                $multiply: [
                  { $divide: ['$readCount', { $max: ['$total', 1] }] },
                  100,
                ],
              },
              1,
            ],
          },
          _id: 0,
        },
      },
    ]),

    // Recent 5 reports for activity feed
    CrimeReport
      .find({ createdAt: { $gte: startDate } })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('reportedBy', 'fullName avatar')
      .select('title crimeType status severity createdAt address isAnonymous'),
  ]);

  // Map day numbers to names
  const dayNames = ['', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const reportsByDayNamed = reportsByDayOfWeek.map((d) => ({
    day:   dayNames[d.dayOfWeek],
    count: d.count,
  }));

  res.status(200).json(
    new ApiResponse(200, {
      overview: {
        totalUsers,
        newUsers,
        activeUsers,
        totalReports,
        newReports,
      },
      reportsByStatus,
      reportsBySeverity,
      peakHours:         reportsByHour,
      reportsByDay:      reportsByDayNamed,
      resolutionTime:    avgResolutionTime[0] || null,
      topReporters,
      anonymousVsNamed,
      notificationStats,
      recentActivity,
      period:            Number(period),
      periodLabel:       formatPeriodLabel(period),
    }, 'Detailed analytics report fetched successfully')
  );
});

module.exports = {
  getHeatmap,
  getSummaryStats,
  getTrends,
  getByType,
  getByArea,
  getDetailedReport,
};