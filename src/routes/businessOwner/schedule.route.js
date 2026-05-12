const router = require('express').Router({ mergeParams: true });
const asyncHandler = require('../../utils/asyncHandler');
const { authenticate, validate } = require('../../middlewares');
const { scheduleUpdateValidation } = require('../../validations/schedule.validator');
const { allSchedules, updateStatus } = require('../../controllers/businessOwner/schedule.controller');

router.get('/', authenticate('business_owner'), asyncHandler(allSchedules));
router.patch('/:scheduleId', authenticate('business_owner'), validate(scheduleUpdateValidation), asyncHandler(updateStatus));

module.exports = router;
