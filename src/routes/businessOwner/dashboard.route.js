const router = require('express').Router({ mergeParams: true });
const asyncHandler = require('../../utils/asyncHandler');
const { authenticate, validate } = require('../../middlewares');
// const { todoCreateValidation } = require('../../validations/todo.validator');
const { dashboard, updateTopPriorities } = require('../../controllers/businessOwner/dashboard.controller');

router.get(
    '/',
    authenticate('business_owner'),
    dashboard
);

router.post(
    '/priorities',
    authenticate('business_owner'),
    updateTopPriorities
);


module.exports = router;
