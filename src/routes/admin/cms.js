const router = require('express').Router();
const asyncHandler = require('../../utils/asyncHandler');
const { validate, adminAuth } = require('../../middlewares');
const {
  cmsCreateValidation,
  cmsUpdateValidation
} = require('../../validations/admin/cms.validator');
const { cmsCreate, cmsUpdate, cmsGet, cmsList } = require('../../controllers/admin/cms.controller');

router.post('/', adminAuth('admin'), validate(cmsCreateValidation), asyncHandler(cmsCreate));
router.put('/:id', adminAuth('admin'), validate(cmsUpdateValidation), asyncHandler(cmsUpdate));
router.get('/:id', adminAuth('admin'), asyncHandler(cmsGet));
router.get('/', adminAuth('admin'), asyncHandler(cmsList));

module.exports = router;
