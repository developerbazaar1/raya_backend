const router = require('express').Router();
const asyncHandler = require('../../utils/asyncHandler');
const { validate, adminAuth } = require('../../middlewares');
const {
  timeOffRequestList,
  timeOffRequestEmployeeList
} = require('../../controllers/admin/timeOff.controller');

router.get('/:businessOwnerId', adminAuth('admin'), asyncHandler(timeOffRequestList));
router.get('/:employeeId', adminAuth('admin'), asyncHandler(timeOffRequestEmployeeList));

module.exports = router;
