const router = require('express').Router();
const asyncHandler = require('../../utils/asyncHandler');
const { adminAuth } = require('../../middlewares');
const {
  timeOffRequestList,
  timeOffRequestEmployeeList
} = require('../../controllers/admin/timeOff.controller');

router.get('/:businessOwnerId', adminAuth('admin'), asyncHandler(timeOffRequestList));
router.get('/employee/:employeeId', adminAuth('admin'), asyncHandler(timeOffRequestEmployeeList));

module.exports = router;
