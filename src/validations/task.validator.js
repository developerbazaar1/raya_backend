const { body, param } = require('express-validator');
const mongoose = require('mongoose');

exports.taskCreateValidation = [
    body('projectId')
        .notEmpty().withMessage('Project ID is required')
        .custom(id => mongoose.Types.ObjectId.isValid(id))
        .withMessage('Project ID must be a valid object ID'),
    body('taskName').notEmpty().withMessage('Task name is required'),
    body('description').notEmpty().withMessage('Task description is required'),
    body('dueDate')
        .notEmpty().withMessage('Due date is required')
        .isISO8601().withMessage('Due date must be a valid ISO date (YYYY-MM-DD)')
        .toDate(),
    body('assignedUsers')
        .notEmpty().withMessage('Assigned users are required')
        .custom(id => mongoose.Types.ObjectId.isValid(id))
        .withMessage('Assigned user must be a valid object ID')
];