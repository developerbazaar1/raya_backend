const router = require('express').Router();
const { authenticate, validate } = require('../../middlewares');
const asyncHandler = require('../../utils/asyncHandler');
const {
  getSpecificKpiLeaderboard,
  getAssignedKpis
} = require('../../controllers/businessOwnerTeam/kpi.controller');
const {
  getKpiLeaderboardValidation,
  getEmployeeAssignedKpisValidation
} = require('../../validations/kpi.validator');

router.get(
  '/assigned',
  authenticate('employee'),
  validate(getEmployeeAssignedKpisValidation),
  asyncHandler(getAssignedKpis)
);

router.get(
  '/:kpiId/leaderboard',
  authenticate('employee'),
  validate(getKpiLeaderboardValidation),
  asyncHandler(getSpecificKpiLeaderboard)
);

module.exports = router;
