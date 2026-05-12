const router = require('express').Router({ mergeParams: true });
const asyncHandler = require('../../utils/asyncHandler');
const { authenticate, validate } = require('../../middlewares');
const { meetingCreateValidation } = require('../../validations/meeting.validator');
const { meetingCreate, meetingAll } = require('../../controllers/businessOwner/meeting.controller');

router.post(
  '/',
  authenticate('business_owner'),
  validate(meetingCreateValidation),
  asyncHandler(meetingCreate)
);

router.get('/', authenticate('business_owner'), asyncHandler(meetingAll));

module.exports = router;
