const { body, param } = require('express-validator');
const mongoose = require('mongoose');

exports.projectCreateValidation = [
    body('projectName')
        .trim()
        .notEmpty().withMessage('Project name is required')
        .isLength({ max: 255 }).withMessage('Project name must be at most 255 characters'),

    body('description')
        .trim()
        .notEmpty().withMessage('Description is required')
        .isLength({ max: 200 }).withMessage('Description must be at most 200 characters'),

    body('dueDate')
        .notEmpty().withMessage('Due date is required')
        .isISO8601().withMessage('Due date must be a valid ISO date (YYYY-MM-DD)')
        .toDate(),

    body('assignedUsers')
        .optional()
        .isArray().withMessage('Assigned users must be an array')
        .custom(arr => arr.every(id => mongoose.Types.ObjectId.isValid(id)))
        .withMessage('All assigned users must be valid object IDs')
];

exports.assignedProjectValidation = [
    body('assignedUsers')
        .optional()
        .isArray().withMessage('Assigned users must be an array')
        .custom(arr => arr.every(id => mongoose.Types.ObjectId.isValid(id)))
        .withMessage('All assigned users must be valid object IDs')
];

exports.unAssignProjectValidation = [
    param('projectId')
        .notEmpty().withMessage('Project ID is required')
        .custom(id => mongoose.Types.ObjectId.isValid(id))
        .withMessage('Project ID must be a valid object ID'),
    body('assignedUsers')
        .notEmpty().withMessage('Assigned users is required')
        .isArray().withMessage('Assigned users must be an array')
        .custom(arr => arr.every(id => mongoose.Types.ObjectId.isValid(id)))
        .withMessage('All assigned users must be valid object IDs')
];