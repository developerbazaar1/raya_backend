const { getDashboardService } = require('../../services/businessOwnerTeam/dashboard.service');

exports.getDashboard = async (req, res) => {
  const result = await getDashboardService(req.user.userId, req.query);
  res.status(200).json({
    status: 'success',
    message: 'Dashboard retrieved successfully',
    ...result
  });
};
