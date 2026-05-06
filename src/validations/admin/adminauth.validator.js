const { body } = require('express-validator');

const EMAIL_RULES = body('email')
  .trim()
  .isEmail()
  .withMessage('Valid email is required')
  .normalizeEmail();


exports.adminLoginValidation = [
  EMAIL_RULES,
  body('password').notEmpty().withMessage('Password is required')
];

exports.resendOtpValidation = [
  EMAIL_RULES
];

exports.verifyOtpValidation = [
  EMAIL_RULES,
  body('otp').notEmpty().withMessage('Otp is required')
];

exports.forgotPasswordValidation = [
  EMAIL_RULES
];

exports.resetPasswordValidation = [
  EMAIL_RULES,
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/[a-z]/)
    .withMessage('New password must contain at least one lowercase letter')
    .matches(/[A-Z]/)
    .withMessage('New password must contain at least one uppercase letter')
    .matches(/\d/)
    .withMessage('New password must contain at least one number')
    .matches(/[@$!%*?&]/)
    .withMessage('New password must contain at least one special character'),
  body('confirmPassword')
    .notEmpty().withMessage('Confirm password is required')
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage('Passwords do not match')
];
