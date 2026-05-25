const { timeOffRequestListService } = require('../../services/admin/timeOff.service');

exports.timeOffRequestList = async (req, res) => {
  const data = await timeOffRequestListService(req.params.businessOwnerId,req.query);
  res.status(200).json({
    status: 'success',
    message: 'Time off request list fetched successfully',
    data
  });
};
