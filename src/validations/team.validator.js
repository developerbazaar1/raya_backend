const { body, query } = require('express-validator');
const mongoose = require('mongoose');
const { GENDER } = require('../config/constant');

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
  body('userIds').isArray({ min: 1 }).withMessage('userIds must be a non-empty array'),
  body('userIds.*')
    .custom((id) => mongoose.Types.ObjectId.isValid(id))
    .withMessage('Each user ID must be a valid object ID')
];

exports.createMemberValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
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

exports.updateMemberValidation = [
  body('name').optional().trim(),
  body('email').optional({ values: 'falsy' }).trim().isEmail().withMessage('Email must be valid'),
  body('dateOfBirth').optional({ values: 'falsy' }).isISO8601().withMessage('Invalid DOB format').toDate(),
  body('hiringDate').optional({ values: 'falsy' }).isISO8601().withMessage('Invalid hiring date format').toDate(),
  body('address').optional().trim(),
  body('profilePicture').optional().trim().notEmpty().withMessage('Profile picture cannot be empty'),
  body('roleId')
    .optional()
    .custom((id) => mongoose.Types.ObjectId.isValid(id))
    .withMessage('Role ID must be a valid object ID'),
  body('gender')
    .optional({ values: 'falsy' })
    .isIn(GENDER)
    .withMessage('Gender must be Male, Female, or Other'),
  body('spouseName').optional().trim(),
  body('spouseAnniversary').optional({ values: 'falsy' }).isISO8601().withMessage('Invalid anniversary date format').toDate(),
  body('spouseGender').optional().trim(),
  body('kids').optional().isArray(),
  body('kids.*.name').optional().trim(),
  body('kids.*.birthday').optional().isISO8601().withMessage('Invalid birthday format').toDate(),
  body('kids.*.gender').optional().trim(),
  body('pets').optional().isArray(),
  body('pets.*.name').optional().trim(),
  body('pets.*.age').optional().trim(),
  body('favouriteFlower').optional().trim(),
  body('favouriteCakeFlavour').optional().trim(),
  body('favouriteOnlineStore').optional().trim(),
  body('favouriteLocalBusiness').optional().trim(),
  body('favouriteRestaurants').optional().trim(),
];
