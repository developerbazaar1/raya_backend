const { kpiCategoryCreateService, kpiCategoryGetService, kpiCategoryUpdateService, kpiCategoryDeleteService, kpiCreateService, kpiGetService, kpiUpdateService, kpiDeleteService } = require('../../services/kpi.service');

exports.createKpiCategory = async (req, res) => {
  const data = await kpiCategoryCreateService(req.body, req.user.userId);
  res.status(201).json({
    status: 'success',
    message: 'KPI Category created successfully.',
    data
  });
};

exports.getKpiCategory = async (req, res) => {
  const result = await kpiCategoryGetService(req.user.userId, req.query);
  res.status(200).json({
    status: 'success',
    message: 'KPI Categories fetched successfully.',
    ...result
  });
};

exports.updateKpiCategory = async (req, res) => {
  const data = await kpiCategoryUpdateService(req.params.categoryId, req.body, req.user.userId);
  res.status(200).json({
    status: 'success',
    message: 'KPI Category updated successfully.',
    data
  });
};

exports.deleteKpiCategory = async (req, res) => {
  const data = await kpiCategoryDeleteService(req.params.categoryId, req.user.userId);
  res.status(200).json({
    status: 'success',
    message: 'KPI Category deleted successfully.',
    data
  });
};

/**
 * Controller to handle KPI creation.
 *
 * CRUCIAL PARAMS/DEPENDENCIES:
 * - req.body: Contains categoryId, measurementType, kpiName.
 * - req.user.userId: Identifies the business owner creating the KPI.
 */
exports.createKpi = async (req, res) => {
  const data = await kpiCreateService(req.body, req.user.userId);
  res.status(201).json({
    status: 'success',
    message: 'KPI created successfully.',
    data
  });
};

/**
 * Controller to fetch all KPIs grouped by category.
 *
 * CRUCIAL PARAMS/DEPENDENCIES:
 * - req.user.userId: Identifies the business owner.
 * - kpiGetService: Core service executing the complex aggregation pipeline.
 */
exports.getKpis = async (req, res) => {
  const result = await kpiGetService(req.user.userId);
  res.status(200).json({
    status: 'success',
    message: 'KPIs fetched successfully.',
    ...result
  });
};

/**
 * Controller to handle updating a KPI.
 *
 * CRUCIAL PARAMS/DEPENDENCIES:
 * - req.params.kpiId: Identifies the KPI.
 * - req.body: Contains the new kpiName.
 * - req.user.userId: Identifies the owner executing the update.
 */
exports.updateKpi = async (req, res) => {
  const data = await kpiUpdateService(req.params.kpiId, req.body, req.user.userId);
  res.status(200).json({
    status: 'success',
    message: 'KPI updated successfully.',
    data
  });
};

/**
 * Controller to handle deleting a KPI.
 *
 * CRUCIAL PARAMS/DEPENDENCIES:
 * - req.params.kpiId: Identifies the KPI to delete.
 * - req.user.userId: Identifies the owner executing the deletion.
 */
exports.deleteKpi = async (req, res) => {
  const data = await kpiDeleteService(req.params.kpiId, req.user.userId);
  res.status(200).json({
    status: 'success',
    message: 'KPI deleted successfully.',
    data
  });
};
