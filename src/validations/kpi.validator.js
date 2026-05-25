const mongoose = require('mongoose');
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

/**
 * Payload validation for KPI assignment API.
 *
 * Required Request Payload:
 * - categoryId: String (Valid MongoDB ObjectId) - The KPI category ID.
 * - kpiId: String (Valid MongoDB ObjectId) - The specific KPI ID.
 * - goalValue: Number (Positive value) - Target numeric goal for the KPI.
 * - resetFrequency: String (Valid MongoDB ObjectId) - MongoDB ID of the frequency (Weekly, Monthly, Yearly).
 * - roleId: String (Valid MongoDB ObjectId OR 'all') - Target role for assignment.
 * - assignedUserIds: Array of Strings (Valid MongoDB ObjectIds OR ['all']) - Users to assign this KPI.
 * - isRepeat: Boolean (Optional, defaults to false) - Flag indicating if the KPI repeats in cycles.
 */
exports.kpiAssignValidation = [
  body('categoryId').isMongoId().withMessage('Invalid Category ID format'),

  body('kpiId').isMongoId().withMessage('Invalid KPI ID Format'),

  body('goalValue')
    .isFloat({ min: 0.01 })
    .withMessage('Goal Value must be a number greater than zero'),

  body('resetFrequency').isMongoId().withMessage('Invalid Reset Frequency ID reference'),

  body('isRepeat').optional().isBoolean().withMessage('isRepeat must be a boolean value'),

  body('roleId')
    .custom((val) => val === 'all' || mongoose.Types.ObjectId.isValid(val))
    .withMessage('Role ID must be a valid ObjectID or "all"'),

  body('assignedUserIds')
    .isArray()
    .withMessage('assignedUserIds must be an array')
    .custom((arr) => {
      const allValid = arr.every((val) => val === 'all' || mongoose.Types.ObjectId.isValid(val));
      if (!allValid) {
        throw new Error('Each assignee ID must be a valid ObjectID or "all"');
      }
      return true;
    })
];
