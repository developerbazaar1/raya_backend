const router = require('express').Router({ mergeParams: true });
const asyncHandler = require('../../utils/asyncHandler');
const { authenticate, validate } = require('../../middlewares');
const { eventCreateValidation, eventNoteValidation } = require('../../validations/event.validator');
const { eventCreate, eventGet, eventHistoryGet, createNote } = require('../../controllers/businessOwner/event.controller');

router.post(
  '/',
  authenticate('business_owner'),
  validate(eventCreateValidation),
  asyncHandler(eventCreate)
);

router.get('/', authenticate('business_owner'), asyncHandler(eventGet));
router.get('/history', authenticate('business_owner'), asyncHandler(eventHistoryGet)); //Meet History
router.put('/note/:meetingId', authenticate('business_owner'), validate(eventNoteValidation), asyncHandler(createNote));

module.exports = router;
