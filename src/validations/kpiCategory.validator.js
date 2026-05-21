const { body } = require('express-validator');
exports.createKpiCategoryValidation = [
  body('categoryName')
    .trim()
    .notEmpty()
    .withMessage('KPI Category Name is required')
    .isLength({ max: 150 })
    .withMessage('KPI Category Name must be less than 150 characters')
];
