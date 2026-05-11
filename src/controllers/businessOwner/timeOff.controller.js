const {
  getAllTimeOffsService,
  updateTimeOffRequestService
} = require('../../services/timeOff.service');

exports.getAllTimeOffs = async (req, res) => {
  const data = await getAllTimeOffsService(req.query, req.user.userId);

  return res.status(200).json({
    status: 'success',
    message: 'Time offs fetched successfully',
    data
  });
};

exports.updateTimeOffRequest = async (req, res) => {
  const data = await updateTimeOffRequestService(req.params.timeOffId, req.body, req.user.userId);

  return res.status(200).json({
    status: 'success',
    message: 'Time off request updated successfully',
    data
  });
};
