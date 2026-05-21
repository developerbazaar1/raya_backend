const router = require('express').Router();
const asyncHandler = require('../../utils/asyncHandler');
const { validate, adminAuth } = require('../../middlewares');
// const {
//   cmsCreateValidation,
//   cmsUpdateValidation
// } = require('../../validations/admin/cms.validator');
const { userList } = require('../../controllers/admin/user.controller');

router.get('/', adminAuth('admin'), asyncHandler(userList));

module.exports = router;
