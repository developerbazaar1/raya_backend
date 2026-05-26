const {
  getSpecificKpiLeaderboardService,
  getKpisByCategoryService,
  employeeKpiHistoryGetService
} = require('../../services/kpi.service');

/**
 * Controller to fetch the KPI leaderboard for an employee.
 * Resolves the parent business owner ID and passes the logged-in user ID
 * to ensure the viewing member is prepended to the top of the leaderboard.
 */
exports.getSpecificKpiLeaderboard = async (req, res) => {
  const businessOwnerId = req.authUser.owner;
  const data = await getSpecificKpiLeaderboardService(
    req.params.kpiId,
    businessOwnerId,
    req.user.userId
  );

  res.status(200).json({
    status: 'success',
    message: 'KPI Leaderboard fetched successfully.',
    data
  });
};

/**
 * Controller to fetch all assigned KPIs for the logged-in employee.
 * Automatically targets the logged-in employee's user ID.
 */
exports.getAssignedKpis = async (req, res) => {
  const businessOwnerId = req.authUser.owner;
  const query = {
    ...req.query,
    assignedUserId: req.user.userId
  };
  const result = await getKpisByCategoryService(null, businessOwnerId, query);
  res.status(200).json({
    status: 'success',
    message: 'Assigned KPIs fetched successfully.',
    ...result
  });
};

/**
 * Controller to fetch proper chronological KPI performance history for the logged-in employee.
 */
exports.getKpiHistory = async (req, res) => {
  const businessOwnerId = req.authUser.owner;
  const data = await employeeKpiHistoryGetService(
    req.user.userId,
    businessOwnerId,
    req.query
  );

  const message = data.length === 0
    ? `No historical data found for the selected ${req.query.periodType} cycle.`
    : 'Assigned KPI history retrieved successfully.';

  res.status(200).json({
    status: 'success',
    message,
    data
  });
};
