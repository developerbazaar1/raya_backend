const router = require('express').Router({ mergeParams: true });
const asyncHandler = require('../../utils/asyncHandler');
const { authenticate } = require('../../middlewares');
const {
  getMeasurementTypes
} = require('../../controllers/businessOwner/measurementType.controller');

router.get('/', authenticate('business_owner'), asyncHandler(getMeasurementTypes));

module.exports = router;
