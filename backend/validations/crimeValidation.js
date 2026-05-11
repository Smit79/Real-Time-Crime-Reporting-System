const { body, param, query } = require('express-validator');

const CRIME_TYPES = [
  'theft', 'robbery', 'assault', 'murder', 'kidnapping',
  'vandalism', 'fraud', 'harassment', 'drug_related',
  'accident', 'fire', 'other',
];

const createReportRules = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 5, max: 100 }).withMessage('Title must be 5–100 characters'),

  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ min: 10, max: 1000 }).withMessage('Description must be 10–1000 characters'),

  body('crimeType')
    .notEmpty().withMessage('Crime type is required')
    .isIn(CRIME_TYPES).withMessage('Invalid crime type'),

  body('latitude')
    .notEmpty().withMessage('Latitude is required')
    .isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),

  body('longitude')
    .notEmpty().withMessage('Longitude is required')
    .isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),

  body('severity')
    .optional()
    .isInt({ min: 1, max: 5 }).withMessage('Severity must be 1–5'),

  body('witnesses')
    .optional()
    .isInt({ min: 0 }).withMessage('Witnesses must be 0 or more'),

  body('isAnonymous')
    .optional()
    .isBoolean().withMessage('isAnonymous must be true or false'),
];

const updateReportRules = [
  param('id')
    .isMongoId().withMessage('Invalid report ID'),

  body('title')
    .optional().trim()
    .isLength({ min: 5, max: 100 }).withMessage('Title must be 5–100 characters'),

  body('description')
    .optional().trim()
    .isLength({ min: 10, max: 1000 }).withMessage('Description must be 10–1000 characters'),

  body('crimeType')
    .optional()
    .isIn(CRIME_TYPES).withMessage('Invalid crime type'),

  body('severity')
    .optional()
    .isInt({ min: 1, max: 5 }).withMessage('Severity must be 1–5'),
];

const updateStatusRules = [
  param('id')
    .isMongoId().withMessage('Invalid report ID'),

  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['pending', 'verified', 'investigating', 'resolved', 'rejected'])
    .withMessage('Invalid status'),
];

const nearbyQueryRules = [
  query('lat')
    .notEmpty().withMessage('Latitude is required')
    .isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),

  query('lng')
    .notEmpty().withMessage('Longitude is required')
    .isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),

  query('radius')
    .optional()
    .isFloat({ min: 1, max: 100 }).withMessage('Radius must be 1–100 km'),
];

module.exports = {
  createReportRules,
  updateReportRules,
  updateStatusRules,
  nearbyQueryRules,
};