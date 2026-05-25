const router = require('express').Router();
const asyncHandler = require('../../utils/asyncHandler');
const { validate, adminAuth } = require('../../middlewares');
const {
  createBusinessFoundationValidation,
  updateBusinessFoundationValidation
} = require('../../validations/businessFoundation.validator');
const { createBusinessFoundation,updateBusinessFoundation,getBusinessFoundation } = require('../../controllers/admin/foundation.controller');


router.post(
  '/',
  adminAuth('admin'),
  validate(createBusinessFoundationValidation),
  asyncHandler(createBusinessFoundation)
);

router.get('/', adminAuth('admin'), asyncHandler(getBusinessFoundation));
router.put(
  '/:foundationId',
  adminAuth('admin'),
  validate(updateBusinessFoundationValidation),
  asyncHandler(updateBusinessFoundation)
);

module.exports = router;

