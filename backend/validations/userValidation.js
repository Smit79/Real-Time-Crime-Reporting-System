const { body, query } = require('express-validator');

const updateProfileRules = [
  body('fullName')
    .optional().trim()
    .isLength({ min: 2, max: 50 }).withMessage('Full name must be 2–50 characters'),

  body('phone')
    .optional()
    .isMobilePhone().withMessage('Enter a valid phone number'),
];

const updateLocationRules = [
  body('latitude')
    .notEmpty().withMessage('Latitude is required')
    .isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),

  body('longitude')
    .notEmpty().withMessage('Longitude is required')
    .isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
];

const updateFcmTokenRules = [
  body('fcmToken')
    .notEmpty().withMessage('FCM token is required')
    .isString().withMessage('FCM token must be a string'),
];

const paginationRules = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
];

module.exports = {
  updateProfileRules,
  updateLocationRules,
  updateFcmTokenRules,
  paginationRules,
};