const router = require('express').Router();
const { authenticate, validate, uploadMemberProfile } = require('../../middlewares');
const { updateMemberValidation } = require('../../validations/team.validator');
const asyncHandler = require('../../utils/asyncHandler');
const {
  getProfile,
  updateProfile
} = require('../../controllers/businessOwnerTeam/setting.controller');

router.get('/', authenticate('employee'), asyncHandler(getProfile));
router.patch(
  '/',
  authenticate('employee'),
  uploadMemberProfile,
  validate(updateMemberValidation),
  asyncHandler(updateProfile)
);

module.exports = router;
