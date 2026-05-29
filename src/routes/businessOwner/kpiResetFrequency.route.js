const router = require('express').Router({ mergeParams: true });
const asyncHandler = require('../../utils/asyncHandler');
const { authenticate } = require('../../middlewares');
const {
  getKpiResetFrequencies
} = require('../../controllers/businessOwner/kpiResetFrequency.controller');

router.get('/', authenticate('business_owner', 'admin'), asyncHandler(getKpiResetFrequencies));

module.exports = router;
