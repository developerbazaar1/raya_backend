const router = require('express').Router();
const asyncHandler = require('../../utils/asyncHandler');
const { validate, adminAuth } = require('../../middlewares');
const { createBusinessTypeValidation, updateBusinessTypeValidation } = require('../../validations/admin/businesstype.validator');
const { createBusinessType, updateBusinessType, getAllBusinessTypes, getBusinessTypeById } = require('../../controllers/admin/businesstype.controller');



router.post('/', adminAuth, validate(createBusinessTypeValidation), asyncHandler(createBusinessType));
router.get('/', adminAuth, asyncHandler(getAllBusinessTypes));
router.get('/:businessId', adminAuth, asyncHandler(getBusinessTypeById));
router.put('/:businessId', adminAuth, validate(updateBusinessTypeValidation), asyncHandler(updateBusinessType));

module.exports = router;


