const {
  kpiCategoryCreateService,
  kpiCategoryGetService,
  kpiCategoryUpdateService,
  kpiCategoryDeleteService,
  kpiCreateService,
  kpiGetService,
  kpiUpdateService,
  kpiDeleteService,
  kpiAssignService,
  kpiAssignmentUpdateService,
  kpiLeaderboardService,
  getKpisByCategoryService,
  getSpecificKpiLeaderboardService
} = require('../../services/kpi.service');

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

/**
 * Controller to handle bulk/cohort KPI assignment.
 *
 * Required Request Payload (req.body):
 * - categoryId: String (Valid ObjectId) - KPI Category reference.
 * - kpiId: String (Valid ObjectId) - Specific KPI reference.
 * - goalValue: Number (Positive value) - KPI target score.
 * - resetFrequency: String (Valid ObjectId) - Frequency reference ID.
 * - roleId: String (Valid ObjectId OR 'all') - Target employee role ID.
 * - assignedUserIds: Array of Strings (Valid ObjectIds OR ['all']) - Target employee user IDs.
 * - isRepeat: Boolean (Optional, defaults to false) - Repeat cycle flag.
 */
exports.assignKpi = async (req, res) => {
  const data = await kpiAssignService(req.user.userId, req.body);
  res.status(200).json({
    status: 'success',
    message: 'KPI successfully assigned to target employees.',
    data
  });
};

exports.updateKpiAssignment = async (req, res) => {
  const data = await kpiAssignmentUpdateService(req.params.kpiId, req.user.userId, req.body);
  res.status(200).json({
    status: 'success',
    message: 'KPI assignment updated successfully.',
    data
  });
};

exports.getKpiLeaderboard = async (req, res) => {
  const data = await kpiLeaderboardService(req.user.userId);
  res.status(200).json({
    status: 'success',
    message: 'KPI Leaderboard fetched successfully.',
    data
  });
};

exports.getKpisByCategory = async (req, res) => {
  const result = await getKpisByCategoryService(req.params.categoryId, req.user.userId, req.query);
  res.status(200).json({
    status: 'success',
    message: 'KPIs fetched successfully.',
    ...result
  });
};

/**
 * Controller to fetch all assigned KPIs for an employee across all categories.
 *
 * Query Parameters (req.query):
 * - assignedUserId: String (Valid MongoDB ObjectId) - Target employee User ID.
 */
exports.getAssignedKpis = async (req, res) => {
  const result = await getKpisByCategoryService(null, req.user.userId, req.query);
  res.status(200).json({
    status: 'success',
    message: 'Assigned KPIs fetched successfully.',
    ...result
  });
};

/**
 * Controller to fetch the leaderboard (employee rankings) for a specific KPI.
 *
 * Path Parameters (req.params):
 * - kpiId: String (Valid MongoDB ObjectId) - Target KPI ID.
 */
exports.getSpecificKpiLeaderboard = async (req, res) => {
  const data = await getSpecificKpiLeaderboardService(req.params.kpiId, req.user.userId);
  res.status(200).json({
    status: 'success',
    message: 'KPI leaderboard fetched successfully.',
    data
  });
};
