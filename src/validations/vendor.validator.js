
const { body } = require('express-validator');

exports.vendorCreateValidation = [
    body('companyName').trim().notEmpty().withMessage('Company name is required'),
    body('representativeName').trim().notEmpty().withMessage('Representative name is required'),
    body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email'),
    body('phoneNumber.countryCode').trim().notEmpty().withMessage('Country code is required'),
    body('phoneNumber.number').trim().notEmpty().withMessage('Phone number is required').isMobilePhone().withMessage('Invalid phone number'),
    body('notes').trim().notEmpty().withMessage('Notes is required'),
    body('role').trim().notEmpty().withMessage('Role is required'),
    body('role').isIn(['Plumber', 'Interior Designer', 'Painter', 'Electrician', 'Carpenter', 'Mason', 'Tiles']).withMessage('Invalid role'),
];
exports.vendorUpdateValidation = [
    body('companyName').trim().optional(),
    body('representativeName').trim().optional(),
    body('email').trim().optional().isEmail().withMessage('Invalid email'),
    body('phoneNumber.countryCode').trim().optional(),
    body('phoneNumber.number').trim().optional().isMobilePhone().withMessage('Invalid phone number'),
    body('notes').trim().optional(),
    body('role').trim().notEmpty().withMessage('Role is required'),
    body('role').isIn(['Plumber', 'Interior Designer', 'Painter', 'Electrician', 'Carpenter', 'Mason', 'Tiles']).withMessage('Invalid role'),
];
exports.vendorScheduleValidation = [
    body('time')
        .notEmpty()
        .withMessage('Time is required')
        .matches(/^(0?[1-9]|1[0-2])[: ]([0-5]\d)\s?(AM|PM|[Aa][Mm]|[Pp][Mm])$/)
        .withMessage('Time must be in 12-hour format with AM or PM (e.g., 12:12 AM)'),
    body('date').notEmpty().withMessage('Date is required').isISO8601().withMessage('Invalid date'),
    body('notes').trim().notEmpty().withMessage('Notes is required').isLength({ min: 2, max: 200 }).withMessage('Notes must be between 2 and 200 characters'),

];