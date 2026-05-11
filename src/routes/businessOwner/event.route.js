const router = require('express').Router({ mergeParams: true });
const asyncHandler = require('../../utils/asyncHandler');
const { authenticate, validate } = require('../../middlewares');
const { eventCreateValidation } = require('../../validations/event.validator');
const { eventCreate, eventGet } = require('../../controllers/businessOwner/event.controller');

router.post(
    '/',
    authenticate('business_owner'),
    validate(eventCreateValidation),
    asyncHandler(eventCreate)
);

router.get(
    '/',
    authenticate('business_owner'),
    asyncHandler(eventGet)
);


module.exports = router;
