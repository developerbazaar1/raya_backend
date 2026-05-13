const router = require('express').Router({ mergeParams: true });
const asyncHandler = require('../../utils/asyncHandler');
const { authenticate, validate } = require('../../middlewares');
const {
  contractorCreateValidation,
  contractorScheduleValidation,
  contractorUpdateValidation
} = require('../../validations/contractor.validator');
const {
  contractorCreate,
  contractorList,
  contractorDetails,
  contractorDelete,
  contractorSchedule,
  updateContractor
} = require('../../controllers/businessOwner/contractor.controller');

router.post(
  '/',
  authenticate('business_owner'),
  validate(contractorCreateValidation),
  asyncHandler(contractorCreate)
);

router.get('/', authenticate('business_owner'), asyncHandler(contractorList));
router.get('/:contractorId', authenticate('business_owner'), asyncHandler(contractorDetails));
router.delete('/:contractorId', authenticate('business_owner'), asyncHandler(contractorDelete));
router.post(
  '/schedule/:contractorId',
  authenticate('business_owner'),
  validate(contractorScheduleValidation),
  asyncHandler(contractorSchedule)
);
router.put(
  '/:contractorId',
  authenticate('business_owner'),
  validate(contractorUpdateValidation),
  asyncHandler(updateContractor)
);
module.exports = router;
