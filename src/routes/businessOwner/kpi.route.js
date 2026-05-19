const router = require('express').Router({ mergeParams: true });
const asyncHandler = require('../../utils/asyncHandler');
const { authenticate, validate } = require('../../middlewares');
const { kpiCategoryCreateValidation, kpiCategoryUpdateValidation, kpiCreateValidation, kpiUpdateValidation } = require('../../validations/kpi.validator');
const { createKpiCategory, getKpiCategory, updateKpiCategory, deleteKpiCategory, createKpi, getKpis, updateKpi, deleteKpi } = require('../../controllers/businessOwner/kpi.controller');

router.post(
  '/category',
  authenticate('business_owner'),
  validate(kpiCategoryCreateValidation),
  asyncHandler(createKpiCategory)
);

router.get(
  '/category',
  authenticate('business_owner'),
  asyncHandler(getKpiCategory)
);

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

router.get(
  '/',
  authenticate('business_owner'),
  asyncHandler(getKpis)
);

router.put(
  '/:kpiId',
  authenticate('business_owner'),
  validate(kpiUpdateValidation),
  asyncHandler(updateKpi)
);

router.delete(
  '/:kpiId',
  authenticate('business_owner'),
  asyncHandler(deleteKpi)
);

module.exports = router;
