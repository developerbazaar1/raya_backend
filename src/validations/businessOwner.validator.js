const { body } = require('express-validator');

const updateBusinessOwnerSettingsValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('name cannot be empty'),
  body('phoneNumberCountryCode')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('phoneNumberCountryCode cannot be empty'),
  body('phoneNumber')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('phoneNumber cannot be empty'),
  body('businessName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('businessName cannot be empty'),
  body('businessType')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('businessType cannot be empty'),
  body('website')
    .optional()
    .trim()
    .isURL()
    .withMessage('website must be a valid URL'),
  body('address')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('address cannot be empty'),
  body('country')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('country cannot be empty'),
  body('state')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('state cannot be empty'),
  body('city')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('city cannot be empty'),
  body('zipCode')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('zipCode cannot be empty'),
  body('totalTimeOff')
    .optional()
    .isNumeric()
    .withMessage('totalTimeOff must be a number'),
  body('timeZone')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('timeZone cannot be empty'),
  body('enabledPushNotification')
    .optional()
    .isBoolean()
    .withMessage('enabledPushNotification must be true or false')
];

const updateBusinessOwnerPasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('currentPassword is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('newPassword must be at least 8 characters long')
    .matches(/[a-z]/)
    .withMessage('newPassword must contain at least one lowercase letter')
    .matches(/[A-Z]/)
    .withMessage('newPassword must contain at least one uppercase letter')
    .matches(/\d/)
    .withMessage('newPassword must contain at least one number')
    .matches(/[@$!%*?&]/)
    .withMessage('newPassword must contain at least one special character'),
  body('confirmPassword')
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage('Passwords do not match')
];

const updateBusinessOwnerFoundationValidation = [
  body('mission')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('mission cannot be empty'),
  body('vision')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('vision cannot be empty'),
  body('values')
    .optional()
    .isArray()
    .withMessage('values must be an array'),
  body('values.*')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('each value must be a non-empty string')
];

module.exports = {
  updateBusinessOwnerSettingsValidation,
  updateBusinessOwnerPasswordValidation,
  updateBusinessOwnerFoundationValidation
};
