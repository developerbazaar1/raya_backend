const router = require('express').Router();
const { authenticate, validate } = require('../../middlewares');
const asyncHandler = require('../../utils/asyncHandler');
const {
  createMentalHealthCheck,
  getMentalHealthChecks
} = require('../../controllers/businessOwnerTeam/mentalHealthCheck.controller');
const { createMentalHealthCheckValidation } = require('../../validations/mentalHealthCheck.validator');

router.post(
  '/',
  authenticate('employee'),
  validate(createMentalHealthCheckValidation),
  asyncHandler(createMentalHealthCheck)
);
router.get('/', authenticate('employee'), asyncHandler(getMentalHealthChecks));
router.get('/history', authenticate('employee'), asyncHandler(getMentalHealthChecks));

module.exports = router;
