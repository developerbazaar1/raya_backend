const router = require('express').Router({ mergeParams: true });
const asyncHandler = require('../../utils/asyncHandler');
const { authenticate, validate } = require('../../middlewares');
const { taskCreateValidation, taskGetByIdValidation } = require('../../validations/task.validator');
const { taskCreate, getTaskById } = require('../../controllers/businessOwner/task.controller');
const { uploadTaskFiles } = require('../../middlewares/upload.middleware');

router.post(
  '/',
  authenticate('business_owner'),
  uploadTaskFiles,
  validate(taskCreateValidation),
  asyncHandler(taskCreate)
);

router.get(
  '/:taskId',
  authenticate('business_owner'),
  validate(taskGetByIdValidation),
  asyncHandler(getTaskById)
);

module.exports = router;
