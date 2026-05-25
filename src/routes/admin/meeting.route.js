const router = require('express').Router();
const asyncHandler = require('../../utils/asyncHandler');
const { adminAuth } = require('../../middlewares');
const { meetingList, meetingListEmployee } = require('../../controllers/admin/meeting.controller');

router.get('/:businessOwnerId', adminAuth('admin'), asyncHandler(meetingList));

//Routes belongs to that particular employee
// router.get('/employee/:employeeId', adminAuth('admin'), asyncHandler(meetingListEmployee));

module.exports = router;
