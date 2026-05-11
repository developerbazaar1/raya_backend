const router = require('express').Router();
const { authenticate, validate } = require('../../middlewares');
const asyncHandler = require('../../utils/asyncHandler');
const {
  createTimeOffRequest,
  getTimeOffRequest,
  updateNewChangeOffRequest,
  deleteTimeOffRequest
} = require('../../controllers/businessOwnerTeam/timeOff.controller');
const { createTimeOffRequestValidation, updateChangeRequestValidation } = require('../../validations/timeOff.validators');

router.post(
  '/',
  authenticate('employee'),
  validate(createTimeOffRequestValidation),
  asyncHandler(createTimeOffRequest)
);

router.get('/', authenticate('employee'), asyncHandler(getTimeOffRequest));
router.put('/:timeOffRequestId', authenticate('employee'), validate(updateChangeRequestValidation), asyncHandler(updateNewChangeOffRequest));
router.delete('/:timeOffRequestId', authenticate('employee'), asyncHandler(deleteTimeOffRequest));

module.exports = router;
