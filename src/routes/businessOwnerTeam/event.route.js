const router = require('express').Router();
const { authenticate, validate } = require('../../middlewares');
const asyncHandler = require('../../utils/asyncHandler');
const { createEvent, getEvents, eventHistoryGet, createNote } = require('../../controllers/businessOwnerTeam/even.controller');
const { eventCreateValidationBusinessOwnerTeam, eventNoteValidation } = require('../../validations/event.validator');

router.post(
    '/',
    authenticate('employee'),
    validate(eventCreateValidationBusinessOwnerTeam),
    asyncHandler(createEvent)
);
router.get('/', authenticate('employee'), asyncHandler(getEvents));
router.get('/history', authenticate('employee'), asyncHandler(eventHistoryGet)); //Meet History
router.put('/note/:meetingId', authenticate('employee'), validate(eventNoteValidation), asyncHandler(createNote));
module.exports = router;
