const router = require('express').Router();
const { authenticate, validate } = require('../../middlewares');
const asyncHandler = require('../../utils/asyncHandler');
const {
    createEvent, getEvents
} = require('../../controllers/businessOwnerTeam/even.controller');
const { eventCreateValidationBusinessOwnerTeam } = require('../../validations/event.validator');

router.post(
    '/',
    authenticate('employee'),
    validate(eventCreateValidationBusinessOwnerTeam),
    asyncHandler(createEvent)
);
router.get(
    '/',
    authenticate('employee'),
    asyncHandler(getEvents)
);

module.exports = router;
