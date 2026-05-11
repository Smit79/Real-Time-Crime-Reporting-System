// ─── Haversine distance between two coordinates (in km) ──────────────────────
const getDistanceKm = (lat1, lng1, lat2, lng2) => {
  const R    = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2);

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ─── Convert degrees to radians ───────────────────────────────────────────────
const toRad = (degrees) => (degrees * Math.PI) / 180;

// ─── Convert km to radians (for MongoDB $centerSphere) ───────────────────────
const kmToRadians = (km) => km / 6371;

// ─── Convert radians to km ────────────────────────────────────────────────────
const radiansToKm = (radians) => radians * 6371;

// ─── Convert km to meters ─────────────────────────────────────────────────────
const kmToMeters = (km) => km * 1000;

// ─── Convert meters to km ─────────────────────────────────────────────────────
const metersToKm = (meters) => meters / 1000;

// ─── Check if coordinates are valid ──────────────────────────────────────────
const isValidCoordinates = (lat, lng) => {
  const latitude  = Number(lat);
  const longitude = Number(lng);

  if (isNaN(latitude) || isNaN(longitude)) return false;
  if (latitude  < -90  || latitude  > 90)  return false;
  if (longitude < -180 || longitude > 180)  return false;

  return true;
};

// ─── Get bounding box around a center point ───────────────────────────────────
const getBoundingBox = (lat, lng, radiusKm) => {
  const latDelta = radiusKm / 111;              // 1 degree lat ≈ 111 km
  const lngDelta = radiusKm / (111 * Math.cos(toRad(lat)));

  return {
    swLat: lat - latDelta,
    swLng: lng - lngDelta,
    neLat: lat + latDelta,
    neLng: lng + lngDelta,
  };
};

// ─── Format coordinates for display ──────────────────────────────────────────
const formatCoordinates = (lat, lng, decimals = 6) => ({
  latitude:  Number(lat.toFixed(decimals)),
  longitude: Number(lng.toFixed(decimals)),
});

// ─── Get midpoint between two coordinates ────────────────────────────────────
const getMidpoint = (lat1, lng1, lat2, lng2) => ({
  latitude:  (lat1 + lat2) / 2,
  longitude: (lng1 + lng2) / 2,
});

// ─── MongoDB GeoJSON Point format ────────────────────────────────────────────
const toGeoJSONPoint = (lng, lat) => ({
  type:        'Point',
  coordinates: [Number(lng), Number(lat)],
});

// ─── MongoDB $geoWithin $centerSphere query ───────────────────────────────────
const geoWithinQuery = (lng, lat, radiusKm) => ({
  $geoWithin: {
    $centerSphere: [
      [Number(lng), Number(lat)],
      kmToRadians(radiusKm),
    ],
  },
});

// ─── MongoDB $geoNear pipeline stage ─────────────────────────────────────────
const geoNearStage = (lng, lat, maxDistanceKm, query = {}) => ({
  $geoNear: {
    near: {
      type:        'Point',
      coordinates: [Number(lng), Number(lat)],
    },
    distanceField: 'distanceInMeters',
    maxDistance:   kmToMeters(maxDistanceKm),
    spherical:     true,
    query,
  },
});

module.exports = {
  getDistanceKm,
  toRad,
  kmToRadians,
  radiansToKm,
  kmToMeters,
  metersToKm,
  isValidCoordinates,
  getBoundingBox,
  formatCoordinates,
  getMidpoint,
  toGeoJSONPoint,
  geoWithinQuery,
  geoNearStage,
};