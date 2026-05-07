const router = require('express').Router({ mergeParams: true });
const asyncHandler = require('../../utils/asyncHandler');
const { authenticate, validate } = require('../../middlewares');
const { taskCreateValidation } = require('../../validations/task.validator');
const { taskCreate } = require('../../controllers/businessOwner/task.controller');

router.post(
  '/',
  authenticate('business_owner'),
  validate(taskCreateValidation),
  asyncHandler(taskCreate)
);

module.exports = router;
