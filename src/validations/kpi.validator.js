const body = require('express-validator').body;

exports.kpiCategoryCreateValidation = [
  body('categoryName')
    .trim()
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ max: 150 })
    .withMessage('Category name must be less than 150 characters')
];

exports.kpiCategoryUpdateValidation = [
  body('categoryName')
    .trim()
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ max: 150 })
    .withMessage('Category name must be less than 150 characters')
];

exports.kpiCreateValidation = [
  body('categoryId').isMongoId().withMessage('Invalid Category ID'),
  body('measurementType').isMongoId().withMessage('Invalid Measurement Type ID'),
  body('kpiName')
    .trim()
    .notEmpty()
    .withMessage('KPI name is required')
    .isLength({ max: 150 })
    .withMessage('KPI name must be less than 150 characters')
];

exports.kpiUpdateValidation = [
  body('kpiName')
    .trim()
    .notEmpty()
    .withMessage('KPI name is required')
    .isLength({ max: 150 })
    .withMessage('KPI name must be less than 150 characters')
];
