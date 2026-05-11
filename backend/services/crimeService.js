const CrimeReport  = require('../models/CrimeReport');
const ApiError     = require('../utils/apiError');
const { geoWithinQuery, geoNearStage, kmToMeters } = require('../utils/geoHelper');

// ─── Get all reports with filters ─────────────────────────────────────────────
const getReports = async ({ page, limit, status, crimeType, severity, search, startDate, endDate, sortBy, order }) => {
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
    .select('-upvotes')
    .populate('reportedBy', 'fullName avatar')
    .sort(sort)
    .skip(skip)
    .limit(Number(limit));

  return { reports, total };
};

// ─── Get nearby reports ───────────────────────────────────────────────────────
const getNearbyReports = async ({ lat, lng, radiusKm, crimeType, status, page, limit }) => {
  const query = {};
  if (crimeType) query.crimeType = crimeType;
  if (status)    query.status    = status;

  const skip  = (Number(page) - 1) * Number(limit);
  const total = await CrimeReport.countDocuments({
    location: geoWithinQuery(lng, lat, radiusKm),
    ...query,
  });

  const reports = await CrimeReport.aggregate([
    geoNearStage(lng, lat, radiusKm, query),
    {
      $addFields: {
        distanceInKm: { $divide: ['$distanceInMeters', 1000] },
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
        pipeline: [{ $project: { fullName: 1, avatar: 1 } }],
      },
    },
    { $unwind: { path: '$reportedBy', preserveNullAndEmptyArrays: true } },
  ]);

  return { reports, total };
};

// ─── Create new crime report ──────────────────────────────────────────────────
const createReport = async (data) => {
  const report = await CrimeReport.create(data);
  return report;
};

// ─── Update crime report ──────────────────────────────────────────────────────
const updateReport = async (id, updateData) => {
  const report = await CrimeReport.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true, runValidators: true }
  );
  if (!report) throw new ApiError('Crime report not found', 404);
  return report;
};

// ─── Delete crime report ──────────────────────────────────────────────────────
const deleteReport = async (id) => {
  const report = await CrimeReport.findByIdAndDelete(id);
  if (!report) throw new ApiError('Crime report not found', 404);
  return report;
};

// ─── Get heatmap data ─────────────────────────────────────────────────────────
const getHeatmapData = async ({ period, crimeType, severity }) => {
  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - Number(period));

  const filter = { createdAt: { $gte: daysAgo } };
  if (crimeType) filter.crimeType = crimeType;
  if (severity)  filter.severity  = Number(severity);

  const data = await CrimeReport.aggregate([
    { $match: filter },
    {
      $project: {
        lat:       { $arrayElemAt: ['$location.coordinates', 1] },
        lng:       { $arrayElemAt: ['$location.coordinates', 0] },
        weight:    '$severity',
        crimeType: 1,
      },
    },
  ]);

  return data;
};

module.exports = {
  getReports,
  getNearbyReports,
  createReport,
  updateReport,
  deleteReport,
  getHeatmapData,
};