const router = require('express').Router();
const asyncHandler = require('../../utils/asyncHandler');
const { authenticate, validate } = require('../../middlewares');
const {
  cmsCreateValidation,
  cmsUpdateValidation
} = require('../../validations/admin/cms.validator');

const {
  cmsList,
  cmsGet,
  cmsCreate,
  cmsUpdate
} = require('../../controllers/businessOwner/cms.controller');

router.post(
  '/',
  authenticate('business_owner'),
  validate(cmsCreateValidation),
  asyncHandler(cmsCreate)
);
router.put(
  '/:id',
  authenticate('business_owner'),
  validate(cmsUpdateValidation),
  asyncHandler(cmsUpdate)
);
router.get('/:id', authenticate('business_owner'), asyncHandler(cmsGet));
router.get('/', authenticate('business_owner'), asyncHandler(cmsList));

module.exports = router;
