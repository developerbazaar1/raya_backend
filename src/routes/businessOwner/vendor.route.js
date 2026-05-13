const router = require('express').Router({ mergeParams: true });
const asyncHandler = require('../../utils/asyncHandler');
const { authenticate, validate } = require('../../middlewares');
const {
  vendorCreateValidation,
  vendorScheduleValidation,
  vendorUpdateValidation
} = require('../../validations/vendor.validator');
const {
  vendorCreate,
  vendorList,
  vendorDetails,
  vendorDelete,
  vendorSchedule,
  updateVendor
} = require('../../controllers/businessOwner/vendor.controller');

router.post(
  '/',
  authenticate('business_owner'),
  validate(vendorCreateValidation),
  asyncHandler(vendorCreate)
);

router.get('/', authenticate('business_owner'), asyncHandler(vendorList));
router.get('/:vendorId', authenticate('business_owner'), asyncHandler(vendorDetails));
router.delete('/:vendorId', authenticate('business_owner'), asyncHandler(vendorDelete));
router.post(
  '/schedule/:vendorId',
  authenticate('business_owner'),
  validate(vendorScheduleValidation),
  asyncHandler(vendorSchedule)
);
router.put(
  '/:vendorId',
  authenticate('business_owner'),
  validate(vendorUpdateValidation),
  asyncHandler(updateVendor)
);
module.exports = router;
