const { body } = require('express-validator');

exports.createBusinessFoundationValidation = [
  body('mission')
    .trim()
    .notEmpty()
    .withMessage('Mission is required')
    .isLength({ max: 2000 })
    .withMessage('Mission must be at most 2000 characters long'),
  body('vision')
    .trim()
    .notEmpty()
    .withMessage('Vision is required')
    .isLength({ max: 500 })
    .withMessage('Vision must be at most 500 characters long'),
  body('values')
    .notEmpty()
    .withMessage('Values is required')
    .isArray()
    .withMessage('Values must be an array')
    .isLength({ min: 1, max: 500 })
    .withMessage('Values must be between 1 and 500 characters long')
];

exports.updateBusinessFoundationValidation = [
  body('mission')
    .trim()
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Mission must be at most 2000 characters long'),
  body('vision')
    .trim()
    .optional()
    .isLength({ max: 500 })
    .withMessage('Vision must be at most 500 characters long'),
  body('values')
    .optional()
    .isArray()
    .withMessage('Values must be an array')
    .isLength({ min: 1, max: 500 })
    .withMessage('Values must be between 1 and 500 characters long')
];
