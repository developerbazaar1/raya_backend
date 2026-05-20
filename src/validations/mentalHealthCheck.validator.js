const { body } = require('express-validator');

exports.createMentalHealthCheckValidation = [
  body('moodScore')
    .notEmpty()
    .withMessage('Mood score is required')
    .isInt({ min: 1, max: 10 })
    .withMessage('Mood score must be a number between 1 and 10'),
  body('note')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Note must be 1000 characters or fewer')
];
