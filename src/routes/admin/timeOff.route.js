const router = require('express').Router();
const asyncHandler = require('../../utils/asyncHandler');
const { validate, adminAuth } = require('../../middlewares');
const { timeOffRequestList } = require('../../controllers/admin/timeOff.controller');

router.get('/:businessOwnerId', adminAuth('admin'), asyncHandler(timeOffRequestList));

module.exports = router;
