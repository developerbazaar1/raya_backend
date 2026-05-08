const router = require('express').Router();
const { authenticate, validate } = require('../../middlewares');
const asyncHandler = require('../../utils/asyncHandler');
const {
    createTimeOffRequest, getTimeOffRequest, updateNewChangeOffRequest
} = require('../../controllers/businessOwnerTeam/timeOff.controller');
const {
    createTimeOffRequestValidation
} = require('../../validations/timeOff.validators');


router.post(
    '/',
    authenticate('employee'),
    validate(createTimeOffRequestValidation),
    asyncHandler(createTimeOffRequest)
);

router.get(
    '/',
    authenticate('employee'),
    asyncHandler(getTimeOffRequest)
);

router.put(
    '/:id',
    authenticate('employee'),
    asyncHandler(updateNewChangeOffRequest)
);


module.exports = router;