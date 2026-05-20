const {
  MentalHealthCheckService,
  getMentalHealthChecks
} = require('../../services/businessOwnerTeam/mentalHealthCheck.service');

exports.createMentalHealthCheck = async (req, res) => {
  const data = await MentalHealthCheckService(req.user.userId, req.body);
  res.status(201).json({
    status: 'success',
    message: 'Health Check created successfully.',
    data
  });
};

exports.getMentalHealthChecks = async (req, res) => {
  const data = await getMentalHealthChecks(req.user.userId, req.query);
  res.status(200).json({
    status: 'success',
    message: 'Mental health history fetched successfully.',
    data
  });
};
