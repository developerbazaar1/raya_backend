const router = require('express').Router();
const asyncHandler = require('../../utils/asyncHandler');
const { validate, adminAuth } = require('../../middlewares');
const { meetingList } = require('../../controllers/admin/meeting.controller');

router.get('/:businessOwnerId', adminAuth('admin'), asyncHandler(meetingList));

module.exports = router;
