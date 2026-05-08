const router = require('express').Router();
const { authenticate, validate } = require('../../middlewares');
const asyncHandler = require('../../utils/asyncHandler');
const {
    createBusinessFoundation, getBusinessFoundation, updateBusinessFoundation
} = require('../../controllers/businessOwner/businessFoundation.controller');
const {
    createBusinessFoundationValidation, updateBusinessFoundationValidation
} = require('../../validations/businessFoundation.validator');


router.post(
    '/',
    authenticate('business_owner'),
    validate(createBusinessFoundationValidation),
    asyncHandler(createBusinessFoundation)
);

router.get(
    '/',
    authenticate('business_owner'),
    asyncHandler(getBusinessFoundation)
);
router.put(
    '/:foundationId',
    authenticate('business_owner'),
    validate(updateBusinessFoundationValidation),
    asyncHandler(updateBusinessFoundation)
);

module.exports = router;