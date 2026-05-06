const { body } = require('express-validator');

const createBusinessTypeValidation = [
  body('name').notEmpty().withMessage('Business Type Name is required')
];

const updateBusinessTypeValidation = [
  body('name').optional().notEmpty().withMessage('Business Type Name cannot be empty')
];

module.exports = {
  createBusinessTypeValidation,
  updateBusinessTypeValidation
};
