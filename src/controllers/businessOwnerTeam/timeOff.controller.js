const {
  createTimeOffRequest,
  getTimeOffRequest,
  updateNewChangeOffRequest,
  deleteTimeOffRequest
} = require('../../services/businessOwnerTeam/timeOff.service');

exports.createTimeOffRequest = async (req, res) => {
  const data = await createTimeOffRequest(req.body, req.user.userId);
  res.status(201).json({
    status: 'success',
    message: 'Time off request created successfully.',
    data
  });
};

exports.getTimeOffRequest = async (req, res) => {
  const data = await getTimeOffRequest(req.user.userId);
  res.status(200).json({
    status: 'success',
    message: 'Time off request fetched successfully.',
    data
  });
};

exports.updateNewChangeOffRequest = async (req, res) => {
  const data = await updateNewChangeOffRequest(req.body, req.params.timeOffRequestId);
  res.status(200).json({
    status: 'success',
    message: 'Time off request updated successfully.',
    data
  });
};


exports.deleteTimeOffRequest = async (req, res) => {
  const data = await deleteTimeOffRequest(req.params.timeOffRequestId);
  res.status(200).json({
    status: 'success',
    message: 'Time off request deleted successfully.',
    data
  });
};