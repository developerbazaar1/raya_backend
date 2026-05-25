const router = require('express').Router();
const asyncHandler = require('../../utils/asyncHandler');
const { validate, adminAuth } = require('../../middlewares');
const {
  createBusinessTypeValidation,
  updateBusinessTypeValidation
} = require('../../validations/admin/businesstype.validator');
const {
  createBusinessType,
  updateBusinessType,
  getAllBusinessTypes,
  getBusinessTypeById
} = require('../../controllers/admin/businesstype.controller');

router.post(
  '/',
  adminAuth('admin'),
  validate(createBusinessTypeValidation),
  asyncHandler(createBusinessType)
);
router.get('/', adminAuth('admin'), asyncHandler(getAllBusinessTypes));
router.get('/:businessId', adminAuth('admin'), asyncHandler(getBusinessTypeById));
router.put(
  '/:businessId',
  adminAuth('admin'),
  validate(updateBusinessTypeValidation),
  asyncHandler(updateBusinessType)
);

module.exports = router;
