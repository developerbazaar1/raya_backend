const { body } = require('express-validator');

const createBusinessTypeValidation = [
  body('name').trim().notEmpty().withMessage('Business Type Name is required').isLength({ max: 50 }).withMessage('Business Type Name must be at most 255 characters'),
];

const updateBusinessTypeValidation = [
  body('name').trim().optional().notEmpty().withMessage('Business Type Name cannot be empty').isLength({ max: 50 }).withMessage('Business Type Name must be at most 255 characters'),
];

module.exports = {
  createBusinessTypeValidation,
  updateBusinessTypeValidation
};
