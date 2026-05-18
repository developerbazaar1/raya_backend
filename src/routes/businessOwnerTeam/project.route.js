const router = require('express').Router();
const { authenticate, validate } = require('../../middlewares');
const asyncHandler = require('../../utils/asyncHandler');
const {
  allProject,
  projectDetails,
  updateProjectStatusController
} = require('../../controllers/businessOwnerTeam/project.controller');
const { updateProjectStatusValidation } = require('../../validations/project.validator');

router.get('/', authenticate('employee'), asyncHandler(allProject));
router.get('/:projectId', authenticate('employee'), asyncHandler(projectDetails));
router.patch(
  '/update-status/:projectId',
  authenticate('employee'),
  validate(updateProjectStatusValidation),
  asyncHandler(updateProjectStatusController)
);

module.exports = router;
