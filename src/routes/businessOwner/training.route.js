const router = require('express').Router();
const asyncHandler = require('../../utils/asyncHandler');
const { authenticate, uploadTrainingSourceFiles, validate } = require('../../middlewares');
const {
  createTraining,
  generateTrainingVersion,
  getTrainingDetails,
  getTrainingQuiz,
  listTrainings
} = require('../../controllers/businessOwner/training.controller');
const {
  createTrainingValidation,
  trainingIdValidation,
  trainingVersionQuizValidation
} = require('../../validations/training.validator');

router.post(
  '/',
  authenticate('business_owner'),
  uploadTrainingSourceFiles,
  validate(createTrainingValidation),
  asyncHandler(createTraining)
);

router.get('/', authenticate('business_owner'), asyncHandler(listTrainings));

router.get(
  '/:trainingId/versions/:versionId/quiz',
  authenticate('business_owner'),
  validate(trainingVersionQuizValidation),
  asyncHandler(getTrainingQuiz)
);

router.get(
  '/:trainingId',
  authenticate('business_owner'),
  validate(trainingIdValidation),
  asyncHandler(getTrainingDetails)
);

// Generate New Script Version for training
// Maximum 3 total versions per training.
router.post(
  '/:trainingId/versions',
  authenticate('business_owner'),
  validate(trainingIdValidation),
  asyncHandler(generateTrainingVersion)
);

module.exports = router;
