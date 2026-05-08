const router = require('express').Router();
const asyncHandler = require('../../utils/asyncHandler');
const { authenticate, validate } = require('../../middlewares');
const { getAllTimeOffs, updateTimeOffRequest } = require('../../controllers/businessOwner/timeOff.controller');
const { updateTimeOffRequestValidation } = require('../../validations/timeOff.validators');


router.use(authenticate('business_owner'));


router.get('/', asyncHandler(getAllTimeOffs));
router.patch('/:timeOffId', validate(updateTimeOffRequestValidation), asyncHandler(updateTimeOffRequest));

module.exports = router;