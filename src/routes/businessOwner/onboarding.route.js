const router = require('express').Router();
const { authenticate, validate } = require('../../middlewares');
const asyncHandler = require('../../utils/asyncHandler');
const {
  getOnboardingProgress,
  completeStep
} = require('../../controllers/businessOwner/onboarding.controller');
const { body } = require('express-validator');

const completeStepValidation = [
  body('stepKey')
    .notEmpty()
    .withMessage('stepKey is required')
    .isIn(['watch_success_video', 'complete_disc_assessment'])
    .withMessage('Invalid stepKey or step is dynamically resolved')
];

router.get('/', authenticate('business_owner'), asyncHandler(getOnboardingProgress));
router.post(
  '/complete',
  authenticate('business_owner'),
  validate(completeStepValidation),
  asyncHandler(completeStep)
);

module.exports = router;
