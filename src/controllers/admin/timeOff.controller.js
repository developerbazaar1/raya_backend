const {
  timeOffRequestListService,
  timeOffRequestEmployeeListService
} = require('../../services/admin/timeOff.service');
/*
Time off request list for business owner
*/
exports.timeOffRequestList = async (req, res) => {
  const data = await timeOffRequestListService(req.params.businessOwnerId, req.query);
  res.status(200).json({
    status: 'success',
    message: 'Time off request list fetched successfully',
    data
  });
};
/*
Time OFF request list for employee
*/
exports.timeOffRequestEmployeeList = async (req, res) => {
  const data = await timeOffRequestEmployeeListService(req.params.employeeId, req.query);
  res.status(200).json({
    status: 'success',
    message: 'Time off  user request list fetched successfully',
    data
  });
};
