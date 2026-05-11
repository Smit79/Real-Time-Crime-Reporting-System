const CrimeReport = require('../models/CrimeReport');
const {
  getDistanceKm,
  kmToRadians,
  kmToMeters,
  getBoundingBox,
  geoNearStage,
} = require('../utils/geoHelper');

// ─── Find reports within radius ───────────────────────────────────────────────
const findReportsNearLocation = async (lat, lng, radiusKm, filters = {}) => {
  return await CrimeReport.aggregate([
    geoNearStage(lng, lat, radiusKm, filters),
    {
      $addFields: {
        distanceInKm: {
          $round: [{ $divide: ['$distanceInMeters', 1000] }, 2],
        },
      },
    },
  ]);
};

// ─── Get crime density in a bounding box ──────────────────────────────────────
const getCrimeDensity = async (swLat, swLng, neLat, neLng) => {
  return await CrimeReport.aggregate([
    {
      $match: {
        location: {
          $geoWithin: {
            $box: [
              [Number(swLng), Number(swLat)],
              [Number(neLng), Number(neLat)],
            ],
          },
        },
      },
    },
    {
      $group: {
        _id: {
          lat: { $round: [{ $arrayElemAt: ['$location.coordinates', 1] }, 2] },
          lng: { $round: [{ $arrayElemAt: ['$location.coordinates', 0] }, 2] },
        },
        count:     { $sum: 1 },
        crimeTypes: { $addToSet: '$crimeType' },
      },
    },
    { $sort: { count: -1 } },
  ]);
};

// ─── Get hotspots (most active crime areas) ───────────────────────────────────
const getHotspots = async (period = 30, limit = 10) => {
  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - period);

  return await CrimeReport.aggregate([
    { $match: { createdAt: { $gte: daysAgo } } },
    {
      $group: {
        _id: {
          city:  '$address.city',
          state: '$address.state',
        },
        count:       { $sum: 1 },
        avgSeverity: { $avg: '$severity' },
        coordinates: { $first: '$location.coordinates' },
        crimeTypes:  { $addToSet: '$crimeType' },
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
        coordinates: 1,
        crimeTypes:  1,
        _id:         0,
      },
    },
  ]);
};

// ─── Check if a point is inside a radius ──────────────────────────────────────
const isWithinRadius = (pointLat, pointLng, centerLat, centerLng, radiusKm) => {
  const distance = getDistanceKm(pointLat, pointLng, centerLat, centerLng);
  return distance <= radiusKm;
};

module.exports = {
  findReportsNearLocation,
  getCrimeDensity,
  getHotspots,
  isWithinRadius,
};