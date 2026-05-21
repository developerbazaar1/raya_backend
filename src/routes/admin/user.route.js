const router = require('express').Router();
const asyncHandler = require('../../utils/asyncHandler');
const { validate, adminAuth } = require('../../middlewares');

const {
  userList,
  ownerEmployeeList,
  ownerEmployeeById,
  rolesListByBusinessOwnerId
} = require('../../controllers/admin/user.controller');

router.get('/', adminAuth('admin'), asyncHandler(userList));
router.get('/employee/:businessOwnerId', adminAuth('admin'), asyncHandler(ownerEmployeeList));
router.get('/employee/:businessOwnerId/:employeeId', adminAuth('admin'), asyncHandler(ownerEmployeeById));
router.get('/:businessOwnerId', adminAuth('admin'), asyncHandler(rolesListByBusinessOwnerId));

module.exports = router;
