const router = require('express').Router();
const { authenticate, validate } = require('../../middlewares');
const asyncHandler = require('../../utils/asyncHandler');
const {
  getSpecificKpiLeaderboard,
  getAssignedKpis,
  getKpiHistory
} = require('../../controllers/businessOwnerTeam/kpi.controller');
const {
  getKpiLeaderboardValidation,
  getEmployeeAssignedKpisValidation,
  kpiHistoryGetValidation
} = require('../../validations/kpi.validator');

router.get(
  '/assigned',
  authenticate('employee', 'admin'),
  validate(getEmployeeAssignedKpisValidation),
  asyncHandler(getAssignedKpis)
);

router.get(
  '/:kpiId/leaderboard',
  authenticate('employee', 'admin'),
  validate(getKpiLeaderboardValidation),
  asyncHandler(getSpecificKpiLeaderboard)
);

router.get(
  '/history',
  authenticate('employee', 'admin'),
  validate(kpiHistoryGetValidation),
  asyncHandler(getKpiHistory)
);

module.exports = router;
