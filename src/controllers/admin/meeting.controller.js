const { meetingListService ,meetingListEmployeeService } = require('../../services/admin/meeting.service');

exports.meetingList = async (req, res) => {
  const data = await meetingListService(req.params.businessOwnerId, req.query);
  res.status(200).json({
    status: 'success',
    message: 'Meeting List fetched successfully',
    data
  });
};

exports.meetingListEmployee = async (req, res) => {
  const data = await meetingListEmployeeService(req.params.employeeId, req.query);
  res.status(200).json({
    status: 'success',
    message: 'Meeting List fetched successfully',
    data
  });
};
