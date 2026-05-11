const CrimeReport  = require('../models/CrimeReport');
const User         = require('../models/User');
const Notification = require('../models/Notification');

// ─── Get date from period (days) ──────────────────────────────────────────────
const getStartDate = (period) => {
  const date = new Date();
  date.setDate(date.getDate() - Number(period));
  return date;
};

// ─── Summary stats ────────────────────────────────────────────────────────────
const getSummary = async (period = 30) => {
  const startDate = getStartDate(period);

  const [total, inPeriod, verified, resolved, pending] = await Promise.all([
    CrimeReport.countDocuments(),
    CrimeReport.countDocuments({ createdAt: { $gte: startDate } }),
    CrimeReport.countDocuments({ status: 'verified'  }),
    CrimeReport.countDocuments({ status: 'resolved'  }),
    CrimeReport.countDocuments({ status: 'pending'   }),
  ]);

  return { total, inPeriod, verified, resolved, pending };
};

// ─── Crime trends ─────────────────────────────────────────────────────────────
const getTrends = async (period = 30, groupBy = 'day') => {
  const startDate = getStartDate(period);

  const formats = { day: '%Y-%m-%d', week: '%Y-W%V', month: '%Y-%m' };
  const format  = formats[groupBy] || formats.day;

  return await CrimeReport.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id:   { $dateToString: { format, date: '$createdAt' } },
        count: { $sum: 1 },
        avgSeverity: { $avg: '$severity' },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { date: '$_id', count: 1, avgSeverity: { $round: ['$avgSeverity', 1] }, _id: 0 } },
  ]);
};

// ─── Breakdown by crime type ──────────────────────────────────────────────────
const getByType = async (period = 30) => {
  const startDate = getStartDate(period);

  return await CrimeReport.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id:         '$crimeType',
        count:       { $sum: 1 },
        avgSeverity: { $avg: '$severity' },
        resolved:    { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
      },
    },
    { $sort: { count: -1 } },
    {
      $project: {
        crimeType:   '$_id',
        count:       1,
        avgSeverity: { $round: ['$avgSeverity', 1] },
        resolved:    1,
        _id:         0,
      },
    },
  ]);
};

// ─── Breakdown by area ────────────────────────────────────────────────────────
const getByArea = async (period = 30, limit = 10) => {
  const startDate = getStartDate(period);

  return await CrimeReport.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id:         { city: '$address.city', state: '$address.state' },
        count:       { $sum: 1 },
        avgSeverity: { $avg: '$severity' },
        crimeTypes:  { $addToSet: '$crimeType' },
        coordinates: { $first: '$location.coordinates' },
      },
    },
    { $sort:  { count: -1 } },
    { $limit: limit },
    {
      $project: {
        city:        '$_id.city',
        state:       '$_id.state',
        count:       1,
        avgSeverity: { $round: ['$avgSeverity', 1] },
        crimeTypes:  1,
        coordinates: 1,
        _id:         0,
      },
    },
  ]);
};

module.exports = {
  getSummary,
  getTrends,
  getByType,
  getByArea,
};