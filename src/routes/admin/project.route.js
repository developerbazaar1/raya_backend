const router = require('express').Router();
const asyncHandler = require('../../utils/asyncHandler');
const { adminAuth } = require('../../middlewares');
const {
  employeeProjectList,
  employeeToDoList,
  employeeToDoHistoryList
} = require('../../controllers/admin/project.controller');

router.get('/employee/:employeeId', adminAuth('admin'), asyncHandler(employeeProjectList));
router.get('/todo/:employeeId', adminAuth('admin'), asyncHandler(employeeToDoList));
router.get('/todo/history/:employeeId', adminAuth('admin'), asyncHandler(employeeToDoHistoryList));

module.exports = router;
