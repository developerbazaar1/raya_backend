const { validationResult } = require('express-validator');
const AppError = require('../utils/appError');

const handleValidationResult = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const message = errors.array();
    return next(
      new AppError(message[0].msg || 'validation_error', 400)
    );
  }
  next();
};

const validate = (validations = []) => [
  ...validations,
  handleValidationResult
];

module.exports = validate;
