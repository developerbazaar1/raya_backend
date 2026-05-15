const {
  dashboardService,
  updateTopPrioritiesService
} = require('../../services/dashboard.service');

exports.dashboard = async (req, res) => {
  const dashboardData = await dashboardService(req.body, req.user.userId);
  return res.status(200).json({
    status: 'success',
    message: 'Dashboard data fetched successfully',
    data: dashboardData
  });
};

exports.updateTopPriorities = async (req, res) => {
  const result = await updateTopPrioritiesService(req.body, req.user.userId);
  return res.status(200).json({
    status: 'success',
    message: 'Priorities updated successfully'
  });
};
