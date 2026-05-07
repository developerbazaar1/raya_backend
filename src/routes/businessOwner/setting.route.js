const router = require('express').Router();
const asyncHandler = require('../../utils/asyncHandler');
const {
  authenticate,
  uploadBusinessOwnerSettingsFiles,
  validate
} = require('../../middlewares');
const {
  getSettings,
  getFoundation,
  patchSettings,
  patchFoundation,
  updatePassword
} = require('../../controllers/businessOwner/setting.controller');
const {
  updateBusinessOwnerSettingsValidation,
  updateBusinessOwnerPasswordValidation,
  updateBusinessOwnerFoundationValidation
} = require('../../validations/businessOwner.validator');

router.use(authenticate('business_owner'));

router.get('/', asyncHandler(getSettings));
router.patch(
  '/',
  uploadBusinessOwnerSettingsFiles,
  validate(updateBusinessOwnerSettingsValidation),
  asyncHandler(patchSettings)
);
router.patch(
  '/update-password',
  validate(updateBusinessOwnerPasswordValidation),
  asyncHandler(updatePassword)
);

router.get('/foundation', asyncHandler(getFoundation));
router.patch(
  '/foundation',
  validate(updateBusinessOwnerFoundationValidation),
  asyncHandler(patchFoundation)
);

module.exports = router;
