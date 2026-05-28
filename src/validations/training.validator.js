const { body, param } = require('express-validator');
const mongoose = require('mongoose');

exports.createTrainingValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Training title is required')
    .isLength({ max: 255 })
    .withMessage('Training title must be at most 255 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be at most 1000 characters'),

  body('sourceText')
    .optional()
    .trim()
    .isLength({ max: 200000 })
    .withMessage('Source text must be at most 200000 characters'),

  body('quizCount')
    .optional()
    .isInt({ min: 1, max: 30 })
    .withMessage('Quiz count must be between 1 and 30')
];

exports.trainingIdValidation = [
  param('trainingId')
    .notEmpty()
    .withMessage('Training ID is required')
    .custom((id) => mongoose.Types.ObjectId.isValid(id))
    .withMessage('Training ID must be a valid object ID')
];

exports.trainingVersionQuizValidation = [
  ...exports.trainingIdValidation,
  param('versionId')
    .notEmpty()
    .withMessage('Training version ID is required')
    .custom((id) => mongoose.Types.ObjectId.isValid(id))
    .withMessage('Training version ID must be a valid object ID')
];
