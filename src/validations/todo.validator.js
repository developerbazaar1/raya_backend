const { body } = require('express-validator');

exports.todoCreateValidation = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 200 })
    .withMessage('Name must be less than 200 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),

  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid ISO date (YYYY-MM-DD)')
    .toDate(),

  body('repetition')
    .optional()
    .isIn(['daily', 'weekly', 'monthly', 'one-time'])
    .withMessage('Invalid repetition value'),

  body('assignedUsers')
    .optional()
    .isArray()
    .withMessage('Assigned users must be an array')
];