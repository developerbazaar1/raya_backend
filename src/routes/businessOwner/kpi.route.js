const router = require('express').Router({ mergeParams: true });
const asyncHandler = require('../../utils/asyncHandler');
const { authenticate, validate } = require('../../middlewares');
const {
  kpiCategoryCreateValidation,
  kpiCategoryUpdateValidation,
  kpiCreateValidation,
  kpiUpdateValidation,
  kpiAssignValidation,
  kpiAssignmentUpdateValidation,
  getKpisByCategoryValidation,
  getAssignedKpisValidation,
  getKpiLeaderboardValidation
} = require('../../validations/kpi.validator');
const {
  createKpiCategory,
  getKpiCategory,
  updateKpiCategory,
  deleteKpiCategory,
  createKpi,
  getKpis,
  updateKpi,
  deleteKpi,
  assignKpi,
  updateKpiAssignment,
  getKpiLeaderboard,
  getKpisByCategory,
  getAssignedKpis,
  getSpecificKpiLeaderboard
} = require('../../controllers/businessOwner/kpi.controller');

router.post(
  '/category',
  authenticate('business_owner'),
  validate(kpiCategoryCreateValidation),
  asyncHandler(createKpiCategory)
);

router.get('/category', authenticate('business_owner'), asyncHandler(getKpiCategory));

router.put(
  '/category/:categoryId',
  authenticate('business_owner'),
  validate(kpiCategoryUpdateValidation),
  asyncHandler(updateKpiCategory)
);

router.delete(
  '/category/:categoryId',
  authenticate('business_owner'),
  asyncHandler(deleteKpiCategory)
);

router.post(
  '/',
  authenticate('business_owner'),
  validate(kpiCreateValidation),
  asyncHandler(createKpi)
);

router.get('/', authenticate('business_owner'), asyncHandler(getKpis));

router.put(
  '/:kpiId',
  authenticate('business_owner'),
  validate(kpiUpdateValidation),
  asyncHandler(updateKpi)
);

router.post(
  '/assign',
  authenticate('business_owner'),
  validate(kpiAssignValidation),
  asyncHandler(assignKpi)
);

router.put(
  '/assign/:kpiId',
  authenticate('business_owner'),
  validate(kpiAssignmentUpdateValidation),
  asyncHandler(updateKpiAssignment)
);

router.get('/leaderboard', authenticate('business_owner'), asyncHandler(getKpiLeaderboard));

router.get(
  '/category/:categoryId/kpis',
  authenticate('business_owner'),
  validate(getKpisByCategoryValidation),
  asyncHandler(getKpisByCategory)
);

router.get(
  '/assigned',
  authenticate('business_owner', 'team_member'),
  validate(getAssignedKpisValidation),
  asyncHandler(getAssignedKpis)
);

router.get(
  '/:kpiId/leaderboard',
  authenticate('business_owner'),
  validate(getKpiLeaderboardValidation),
  asyncHandler(getSpecificKpiLeaderboard)
);

router.delete('/:kpiId', authenticate('business_owner'), asyncHandler(deleteKpi));

module.exports = router;
