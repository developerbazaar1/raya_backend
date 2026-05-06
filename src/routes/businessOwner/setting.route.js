const router = require('express').Router();
const asyncHandler = require('../../utils/asyncHandler');
const {
  authenticate,
  uploadBusinessOwnerSettingsFiles,
  validate
} = require('../../middlewares');
const AppError = require('../../utils/appError');
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

const ensureBusinessOwnerRole = (req, res, next) => {
  if (req.user?.role !== 'business_owner') {
    return next(new AppError('Only business owners can access this resource.', 403));
  }
  next();
};

router.use(authenticate, ensureBusinessOwnerRole);

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
