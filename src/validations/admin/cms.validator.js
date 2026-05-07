const { body } = require('express-validator');

exports.cmsCreateValidation = [
  body('page_name')
    .notEmpty()
    .withMessage('Page name is required')
    .isLength({ max: 50 })
    .withMessage('page name must be at most 50 characters'),
  body('slug')
    .notEmpty()
    .withMessage('Slug is required')
    .isLength({ max: 50 })
    .withMessage('slug must be at most 50 characters'),
  body('description').notEmpty().withMessage('Description is required')
];

exports.cmsUpdateValidation = [
  body('page_name')
    .optional()
    .notEmpty()
    .withMessage('Page name is required')
    .isLength({ max: 50 })
    .withMessage('page name must be at most 50 characters'),
  body('slug')
    .optional()
    .notEmpty()
    .withMessage('Slug is required')
    .isLength({ max: 50 })
    .withMessage('slug must be at most 50 characters'),
  body('description').optional().notEmpty().withMessage('Description is required')
];
