const { body, query } = require('express-validator');
const mongoose = require('mongoose');

exports.createRoleValidation = [
  body('roleName')
    .trim()
    .notEmpty()
    .withMessage('Role name is required')
    .isLength({ max: 100 })
    .withMessage('Role name must be at most 100 characters')
];

exports.getRolesValidation = [
  query('search').optional().trim(),
  query('fields').optional().trim(),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1 }).withMessage('Limit must be a positive integer')
];

exports.deleteRoleValidation = [
  body('roleId')
    .notEmpty()
    .withMessage('Role ID is required')
    .custom((id) => mongoose.Types.ObjectId.isValid(id))
    .withMessage('Role ID must be a valid object ID')
];

exports.addMembersToRoleValidation = [
  body('roleId')
    .notEmpty()
    .withMessage('Role ID is required')
    .custom((id) => mongoose.Types.ObjectId.isValid(id))
    .withMessage('Role ID must be a valid object ID'),
  body('userIds')
    .isArray({ min: 1 })
    .withMessage('userIds must be a non-empty array'),
  body('userIds.*')
    .custom((id) => mongoose.Types.ObjectId.isValid(id))
    .withMessage('Each user ID must be a valid object ID')
];

exports.createMemberValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Email must be valid'),
  body('roleId')
    .notEmpty()
    .withMessage('Role ID is required')
    .custom((id) => mongoose.Types.ObjectId.isValid(id))
    .withMessage('Role ID must be a valid object ID'),
  body('hiringDate')
    .notEmpty()
    .withMessage('Hiring date is required')
    .isISO8601()
    .withMessage('Hiring date must be a valid ISO date (YYYY-MM-DD)')
    .toDate()
];

exports.getMembersValidationByRole = [
  query('search').optional().trim(),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1 }).withMessage('Limit must be a positive integer')
];

exports.getMembersValidation = [
  query('search').optional().trim(),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1 }).withMessage('Limit must be a positive integer')
];

exports.deleteMemberValidation = [
  body('memberId')
    .notEmpty()
    .withMessage('Member ID is required')
    .custom((id) => mongoose.Types.ObjectId.isValid(id))
    .withMessage('Member ID must be a valid object ID')
];
