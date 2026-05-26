const mongoose = require('mongoose');
const body = require('express-validator').body;
const param = require('express-validator').param;
const query = require('express-validator').query;

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
    .optional({ nullable: true, checkFalsy: true })
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

exports.kpiAssignmentUpdateValidation = [
  body('assignedUserId').isMongoId().withMessage('Invalid Assigned User ID format'),
  body('goalValue')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Goal Value must be a number greater than zero'),
  body('resetFrequency').optional().isMongoId().withMessage('Invalid Reset Frequency ID reference'),
  body('isRepeat').optional().isBoolean().withMessage('isRepeat must be a boolean value'),
  body('progress')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Progress must be a number greater than or equal to zero')
];

/**
 * Validation rules for fetching KPIs under a specific category.
 * Supports optional assignedUserId query parameter.
 *
 * Path Parameters:
 * - categoryId: String (Valid MongoDB ObjectId) - Target category ID.
 *
 * Query Parameters:
 * - assignedUserId: String (Optional, Valid MongoDB ObjectId) - Target user to filter by.
 */
exports.getKpisByCategoryValidation = [
  param('categoryId').isMongoId().withMessage('Invalid Category ID format'),
  query('assignedUserId').optional().isMongoId().withMessage('Invalid Assigned User ID format'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be an integer greater than or equal to 1'),
  query('limit')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Limit must be an integer greater than or equal to 1')
];

/**
 * Validation rules for fetching all assigned KPIs for an employee (across all categories).
 *
 * Query Parameters:
 * - assignedUserId: String (Valid MongoDB ObjectId, Required) - Target employee User ID.
 * - page: String (Optional, Positive Integer)
 * - limit: String (Optional, Positive Integer)
 */
exports.getAssignedKpisValidation = [
  query('assignedUserId')
    .notEmpty()
    .withMessage('assignedUserId is required')
    .isMongoId()
    .withMessage('Invalid Assigned User ID format'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be an integer greater than or equal to 1'),
  query('limit')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Limit must be an integer greater than or equal to 1')
];

/**
 * Validation rules for team members fetching their own assigned KPIs.
 * Only page and limit query parameters are supported as the user ID is resolved from auth token.
 */
exports.getEmployeeAssignedKpisValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be an integer greater than or equal to 1'),
  query('limit')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Limit must be an integer greater than or equal to 1')
];

/**
 * Validation rules for fetching the leaderboard for a specific KPI.
 *
 * Path Parameters:
 * - kpiId: String (Valid MongoDB ObjectId) - Target KPI ID to query.
 */
exports.getKpiLeaderboardValidation = [
  param('kpiId').isMongoId().withMessage('Invalid KPI ID format')
];
