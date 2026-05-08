
const { body } = require('express-validator');


exports.updateTimeOffRequestValidation = [
    body('status')
        .notEmpty()
        .withMessage('Status is required')
        .isIn(['approved', 'rejected', 'change_requested', 'cancelled'])
        .withMessage('Invalid status'),
    body('ownerComment')
        .if(body('status').isIn(['rejected', 'change_requested']))
        .notEmpty()
        .withMessage('Comment is required if status is rejected or change requested'),
    body('suggestedDate')
        .if(body('status').isIn(['change_requested']))
        .notEmpty()
        .withMessage('Suggested date is required if status is change requested')
        .isDate()
        .withMessage('Suggested date must be a valid date'),
]

exports.createTimeOffRequestValidation = [
    body('reason')
        .trim()
        .notEmpty()
        .withMessage('Reason is required')
        .isLength({ min: 3, max: 100 })
        .withMessage('Reason must be between 3 and 100 characters'),
    body('startDate')
        .notEmpty()
        .withMessage('Date is required')
        .isISO8601()
        .withMessage('Date must be a valid ISO 8601 date'),

    body('endDate')
        .notEmpty()
        .withMessage('Date is required')
        .isISO8601()
        .withMessage('Date must be a valid ISO 8601 date'),
    body('fullDay')
        .optional()
        .isBoolean()
        .withMessage('Full day must be a boolean'),
    body('halfDay')
        .optional()
        .isObject()
        .withMessage('Half day must be an object'),
    body('halfDay.firstHalfDay')
        .if(body('halfDay').exists())
        .isBoolean()
        .withMessage('firstHalfDay must be a boolean'),
    body('halfDay.secondHalfDay')
        .if(body('halfDay').exists())
        .isBoolean()
        .withMessage('secondHalfDay must be a boolean'),
];
