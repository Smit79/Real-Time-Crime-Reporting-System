const { validationResult, body, param, query } = require('express-validator');
const ApiError = require('../utils/apiError');

// ─── Run validation results ───────────────────────────────────────────────────
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg).join(', ');
    return next(new ApiError(messages, 400));
  }
  next();
};

// ─── Auth Validators ──────────────────────────────────────────────────────────
const registerValidator = [
  body('fullName')
    .trim()
    .notEmpty().withMessage('Full name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Full name must be 2–50 characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/\d/).withMessage('Password must contain at least one number'),

  body('phone')
    .optional()
    .isMobilePhone().withMessage('Please enter a valid phone number'),

  validate,
];

const loginValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email'),

  body('password')
    .notEmpty().withMessage('Password is required'),

  validate,
];

const forgotPasswordValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email'),

  validate,
];

const resetPasswordValidator = [
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/\d/).withMessage('Password must contain at least one number'),

  param('token')
    .notEmpty().withMessage('Reset token is required'),

  validate,
];

const updatePasswordValidator = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),

  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
    .matches(/\d/).withMessage('Password must contain at least one number'),

  validate,
];

// ─── Crime Report Validators ──────────────────────────────────────────────────
const createReportValidator = [
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
    .isIn([
      'theft', 'robbery', 'assault', 'murder', 'kidnapping',
      'vandalism', 'fraud', 'harassment', 'drug_related',
      'accident', 'fire', 'other',
    ]).withMessage('Invalid crime type'),

  body('latitude')
    .notEmpty().withMessage('Latitude is required')
    .isFloat({ min: -90,  max: 90  }).withMessage('Latitude must be between -90 and 90'),

  body('longitude')
    .notEmpty().withMessage('Longitude is required')
    .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),

  body('severity')
    .optional()
    .isInt({ min: 1, max: 5 }).withMessage('Severity must be between 1 and 5'),

  body('witnesses')
    .optional()
    .isInt({ min: 0 }).withMessage('Witnesses must be a positive number'),

  validate,
];

const updateReportValidator = [
  param('id')
    .isMongoId().withMessage('Invalid report ID'),

  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 100 }).withMessage('Title must be 5–100 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 }).withMessage('Description must be 10–1000 characters'),

  body('severity')
    .optional()
    .isInt({ min: 1, max: 5 }).withMessage('Severity must be between 1 and 5'),

  validate,
];

const updateStatusValidator = [
  param('id')
    .isMongoId().withMessage('Invalid report ID'),

  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['pending', 'verified', 'investigating', 'resolved', 'rejected'])
    .withMessage('Invalid status value'),

  validate,
];

// ─── User Validators ──────────────────────────────────────────────────────────
const updateProfileValidator = [
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Full name must be 2–50 characters'),

  body('phone')
    .optional()
    .isMobilePhone().withMessage('Please enter a valid phone number'),

  validate,
];

const updateLocationValidator = [
  body('latitude')
    .notEmpty().withMessage('Latitude is required')
    .isFloat({ min: -90,  max: 90  }).withMessage('Latitude must be between -90 and 90'),

  body('longitude')
    .notEmpty().withMessage('Longitude is required')
    .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),

  validate,
];

// ─── Alert Validators ─────────────────────────────────────────────────────────
const createAlertValidator = [
  body('latitude')
    .notEmpty().withMessage('Latitude is required')
    .isFloat({ min: -90,  max: 90  }).withMessage('Invalid latitude'),

  body('longitude')
    .notEmpty().withMessage('Longitude is required')
    .isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),

  body('radiusKm')
    .optional()
    .isFloat({ min: 1, max: 50 }).withMessage('Radius must be between 1 and 50 km'),

  body('minSeverity')
    .optional()
    .isInt({ min: 1, max: 5 }).withMessage('Min severity must be between 1 and 5'),

  body('label')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Label cannot exceed 50 characters'),

  validate,
];

// ─── Pagination Validator (reusable) ─────────────────────────────────────────
const paginationValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),

  validate,
];

// ─── MongoID param validator (reusable) ───────────────────────────────────────
const mongoIdValidator = [
  param('id')
    .isMongoId().withMessage('Invalid ID format'),

  validate,
];

module.exports = {
  validate,
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  updatePasswordValidator,
  createReportValidator,
  updateReportValidator,
  updateStatusValidator,
  updateProfileValidator,
  updateLocationValidator,
  createAlertValidator,
  paginationValidator,
  mongoIdValidator,
};